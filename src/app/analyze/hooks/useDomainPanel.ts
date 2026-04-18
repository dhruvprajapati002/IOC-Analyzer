import { useCallback, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

export interface DomainIntelData {
  whois?: {
    registrar?: string;
    registrant?: string;
    createdDate?: string;
    expiresDate?: string;
    updatedDate?: string;
    nameservers?: string[];
    status?: string[];
  };
  dns?: {
    a?: string[];
    aaaa?: string[];
    mx?: Array<{ exchange: string; priority?: number }>;
    ns?: string[];
    txt?: string[];
  };
  ssl?: {
    issuer?: string;
    subject?: string;
    validFrom?: string;
    validTo?: string;
    issuerOrg?: string;
  };
  reputation?: {
    vtScore?: number;
    verdictFromMain?: string;
    threatTypes?: string[];
  };
  fetchedAt?: string;
  errors?: Record<string, string>;
}

export function useDomainPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DomainIntelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState('');

  const openPanel = useCallback(async (nextDomain: string) => {
    const trimmed = nextDomain.trim();
    if (!trimmed) return;

    setDomain(trimmed);
    setIsOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/domain-intel?domain=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error(`Domain intelligence request failed (${response.status})`);
      }

      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error || 'Unable to load domain intelligence');
      }

      setData(payload.data || null);
    } catch (requestError: any) {
      setError(requestError?.message || 'Unable to load domain intelligence');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    loading,
    data,
    error,
    domain,
    openPanel,
    closePanel,
  };
}
