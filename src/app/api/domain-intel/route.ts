import { NextRequest, NextResponse } from 'next/server';
import { resolve4, resolve6, resolveMx, resolveNs, resolveTxt } from 'node:dns/promises';
import connectDB from '@/lib/db';
import { IocCache } from '@/lib/models/IocCache';

const DOMAIN_INTEL_TTL_MS = 60 * 60 * 1000;

function isDomain(value: string): boolean {
  return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(value);
}

async function safeResolve<T>(resolver: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await resolver();
  } catch {
    return fallback;
  }
}

function toISOString(value?: string | Date | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function nextCacheExpiry(): Date {
  return new Date(Date.now() + DOMAIN_INTEL_TTL_MS);
}

export async function GET(request: NextRequest) {
  try {
    const domainParam = request.nextUrl.searchParams.get('domain')?.trim().toLowerCase();
    if (!domainParam || !isDomain(domainParam)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid domain parameter',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const cacheDoc: any = await IocCache.findOne({ value: domainParam, type: 'domain' }).lean();
    const cachedIntel = (cacheDoc?.analysis as any)?.domainIntel;

    if (cachedIntel?.fetchedAt) {
      const ageMs = Date.now() - new Date(cachedIntel.fetchedAt).getTime();
      if (ageMs < DOMAIN_INTEL_TTL_MS && (!cacheDoc?.expiresAt || new Date(cacheDoc.expiresAt).getTime() > Date.now())) {
        return NextResponse.json({
          success: true,
          cached: true,
          data: cachedIntel,
        });
      }
    }

    const errors: Record<string, string> = {};

    const [aRecords, aaaaRecords, mxRecords, nsRecords, txtRecords] = await Promise.all([
      safeResolve(() => resolve4(domainParam), [] as string[]),
      safeResolve(() => resolve6(domainParam), [] as string[]),
      safeResolve(() => resolveMx(domainParam), [] as Array<{ exchange: string; priority: number }>),
      safeResolve(() => resolveNs(domainParam), [] as string[]),
      safeResolve(async () => {
        const rows = await resolveTxt(domainParam);
        return rows.map((parts) => parts.join('')).filter(Boolean);
      }, [] as string[]),
    ]);

    const rdap = await safeResolve(
      async () => {
        const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domainParam)}`);
        if (!response.ok) {
          throw new Error(`RDAP request failed (${response.status})`);
        }
        return response.json();
      },
      null as any
    );

    if (!rdap) {
      errors.whois = 'RDAP lookup unavailable';
    }

    const registrarEntity = (rdap?.entities || []).find((entity: any) =>
      Array.isArray(entity?.roles) && entity.roles.includes('registrar')
    );
    const registrantEntity = (rdap?.entities || []).find((entity: any) =>
      Array.isArray(entity?.roles) && entity.roles.includes('registrant')
    );

    const extractName = (entity: any): string | undefined => {
      const vcard = entity?.vcardArray?.[1];
      if (!Array.isArray(vcard)) return undefined;
      const fn = vcard.find((field: any) => Array.isArray(field) && field[0] === 'fn');
      return fn?.[3];
    };

    const eventMap: Record<string, string | undefined> = {};
    (rdap?.events || []).forEach((event: any) => {
      if (!event?.eventAction || !event?.eventDate) return;
      eventMap[event.eventAction] = event.eventDate;
    });

    const crtShData = await safeResolve(
      async () => {
        const response = await fetch(`https://crt.sh/?q=${encodeURIComponent(domainParam)}&output=json`);
        if (!response.ok) {
          throw new Error(`crt.sh failed (${response.status})`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : [];
      },
      [] as any[]
    );

    if (crtShData.length === 0) {
      errors.ssl = 'Certificate transparency lookup unavailable';
    }

    const cert = crtShData[0] || {};

    const domainIntel = {
      whois: {
        registrar: extractName(registrarEntity) || rdap?.registrar || 'Unknown',
        registrant: extractName(registrantEntity) || 'Unknown',
        createdDate: toISOString(eventMap.registration),
        expiresDate: toISOString(eventMap.expiration),
        updatedDate: toISOString(eventMap.lastChanged || eventMap.lastUpdateOfRdAPDatabase),
        nameservers: nsRecords,
        status: Array.isArray(rdap?.status) ? rdap.status : [],
      },
      dns: {
        a: aRecords,
        aaaa: aaaaRecords,
        mx: mxRecords.map((entry) => ({ exchange: entry.exchange, priority: entry.priority })),
        ns: nsRecords,
        txt: txtRecords,
      },
      ssl: {
        issuer: cert.issuer_name || cert.issuer_ca || 'Unknown',
        subject: cert.common_name || cert.name_value || 'Unknown',
        validFrom: toISOString(cert.not_before),
        validTo: toISOString(cert.not_after),
        issuerOrg: cert.issuer_name || cert.issuer_ca || 'Unknown',
      },
      reputation: {
        vtScore: (cacheDoc?.analysis as any)?.vtData?.score || (cacheDoc as any)?.riskScore || 0,
        verdictFromMain: (cacheDoc as any)?.verdict || 'unknown',
        threatTypes: (cacheDoc as any)?.threatIntel?.threatTypes || [],
      },
      fetchedAt: new Date().toISOString(),
      errors,
    };

    await IocCache.findOneAndUpdate(
      { value: domainParam, type: 'domain' },
      {
        $set: {
          'analysis.domainIntel': domainIntel,
          expiresAt: nextCacheExpiry(),
        },
        $setOnInsert: {
          value: domainParam,
          type: 'domain',
          verdict: 'unknown',
          severity: 'low',
          riskScore: 0,
          threatIntel: {
            threatTypes: [],
            confidence: 0,
          },
          created_at: new Date(),
        },
      },
      { upsert: true, new: false }
    );

    return NextResponse.json({
      success: true,
      cached: false,
      data: domainIntel,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch domain intelligence',
      },
      { status: 500 }
    );
  }
}
