'use client';

import { useState } from 'react';
import { Calendar, Copy, FileText, Fingerprint, HardDrive, Layers3 } from 'lucide-react';
import {
  APP_COLORS,
  CHART_COLORS,
  RISK_COLORS,
  STATUS_BADGE,
  BUTTON_STYLES,
  INPUT_STYLES,
  SHADOWS,
  LOADING_STYLES,
} from '@/lib/colors';
import { CardShell } from '@/app/analyze/components/cards/CardShell';
import { formatBytes, formatDate } from '@/app/analyze/utils/analyzeFormatters';
import { toast } from 'sonner';

interface FileInformationCardProps {
  fileInfo: any;
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div
      style={{
        background: APP_COLORS.backgroundSoft,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-wide" style={{ color: APP_COLORS.textMuted }}>
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
        {value}
      </p>
    </div>
  );
}

export function FileInformationCard({ fileInfo }: FileInformationCardProps) {
  const [hashOpen, setHashOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);

  if (!fileInfo) return null;

  const hashEntries = [
    ['MD5', fileInfo.md5],
    ['SHA1', fileInfo.sha1],
    ['SHA256', fileInfo.sha256],
  ].filter((entry) => !!entry[1]);

  return (
    <CardShell
      title="File Information"
      icon={<FileText className="h-4 w-4" />}
      iconColor={APP_COLORS.accentBlue}
      sectionLabel="Artifact & Sandbox Insights"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoTile
          label="File Name"
          value={fileInfo.meaningful_name || fileInfo.name || 'Unknown'}
          icon={<FileText className="h-4 w-4" style={{ color: APP_COLORS.primary }} />}
        />
        <InfoTile
          label="File Type"
          value={fileInfo.type_description || fileInfo.type || 'Unknown'}
          icon={<Layers3 className="h-4 w-4" style={{ color: APP_COLORS.primary }} />}
        />
        <InfoTile
          label="File Size"
          value={formatBytes(fileInfo.size)}
          icon={<HardDrive className="h-4 w-4" style={{ color: APP_COLORS.primary }} />}
        />
        <InfoTile
          label="First Seen"
          value={formatDate(fileInfo.firstSeen)}
          icon={<Calendar className="h-4 w-4" style={{ color: APP_COLORS.primary }} />}
        />
        <InfoTile
          label="Last Analysis"
          value={formatDate(fileInfo.lastAnalysis)}
          icon={<Calendar className="h-4 w-4" style={{ color: APP_COLORS.primary }} />}
        />
        <InfoTile
          label="Upload Date"
          value={formatDate(fileInfo.uploadDate)}
          icon={<Calendar className="h-4 w-4" style={{ color: APP_COLORS.primary }} />}
        />
      </div>

      <div className="mt-4 space-y-3">
        <details
          open={hashOpen}
          onToggle={(event) => setHashOpen((event.target as HTMLDetailsElement).open)}
          className="rounded-xl border px-3 py-2"
          style={{ borderColor: APP_COLORS.border }}
        >
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
            Cryptographic Hashes [{hashEntries.length}]
          </summary>
          <div className="mt-2 space-y-2">
            {hashEntries.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg px-2 py-1"
                style={{ backgroundColor: APP_COLORS.backgroundSoft }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Fingerprint className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
                  <span className="text-xs font-semibold" style={{ color: APP_COLORS.textMuted }}>
                    {label}
                  </span>
                  <code className="truncate text-xs" style={{ color: APP_COLORS.textPrimary }}>
                    {value as string}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(String(value));
                    toast.success(`${label} copied`);
                  }}
                  aria-label={`Copy ${label}`}
                  title={`Copy ${label}`}
                  style={{ color: APP_COLORS.textMuted }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </details>

        {Array.isArray(fileInfo.names) && fileInfo.names.length > 0 ? (
          <details
            open={namesOpen}
            onToggle={(event) => setNamesOpen((event.target as HTMLDetailsElement).open)}
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: APP_COLORS.border }}
          >
            <summary className="cursor-pointer text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
              Known File Names [{fileInfo.names.length}]
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {fileInfo.names.slice(0, 20).map((name: string) => (
                <span
                  key={name}
                  className="rounded-md border px-2 py-1 text-xs"
                  style={{ borderColor: APP_COLORS.border, color: APP_COLORS.textSecondary }}
                >
                  {name}
                </span>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </CardShell>
  );
}
