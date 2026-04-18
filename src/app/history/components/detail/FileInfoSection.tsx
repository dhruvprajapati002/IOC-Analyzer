import { FileCode2 } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { formatFileSize } from '../../utils/historyFormatters';
import type { IOCDetailData } from './types';

interface FileInfoSectionProps {
  details: IOCDetailData;
}

function extractFileInfo(details: IOCDetailData) {
  const fileInfo = (details.fileInfo || {}) as Record<string, any>;
  const metadata = details.metadata || {};

  const name = fileInfo.name || metadata.filename || null;
  const size = fileInfo.size ?? metadata.filesize ?? null;
  const type = fileInfo.type || metadata.filetype || null;

  return {
    name,
    size,
    type,
    md5: fileInfo.md5 || null,
    sha1: fileInfo.sha1 || null,
    sha256: fileInfo.sha256 || null,
    firstSeen: fileInfo.firstSeen || null,
    uploadDate: fileInfo.uploadDate || null,
    lastAnalysis: fileInfo.lastAnalysis || null,
  };
}

function hashRow(label: string, value: string | null) {
  if (!value) return null;
  return (
    <div key={label} className="rounded-lg border p-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.surface }}>
      <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>{label}</p>
      <p className="mt-1 break-all font-mono text-xs" style={{ color: APP_COLORS.textPrimary }}>{value}</p>
    </div>
  );
}

export function FileInfoSection({ details }: FileInfoSectionProps) {
  const info = extractFileInfo(details);

  if (!info.name && !info.type && !info.size && !info.md5 && !info.sha1 && !info.sha256) {
    return null;
  }

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-3 flex items-center gap-2">
        <FileCode2 className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
          File Information
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>Filename</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>{info.name || 'N/A'}</p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>File Type</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>{info.type || 'N/A'}</p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>Size</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>{formatFileSize(Number(info.size))}</p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>Last Analysis</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>{info.lastAnalysis || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {hashRow('MD5', info.md5)}
        {hashRow('SHA1', info.sha1)}
        {hashRow('SHA256', info.sha256)}
      </div>
    </section>
  );
}
