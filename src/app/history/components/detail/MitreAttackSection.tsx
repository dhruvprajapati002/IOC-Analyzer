import { ExternalLink, Target } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

interface MitreAttackSectionProps {
  mitreAttack?: Record<string, any> | null;
}

function normalizeItem(item: any): { id: string; name: string; description?: string; link?: string } {
  if (typeof item === 'string') {
    const parts = item.split(':');
    const id = (parts[0] || '').trim();
    const name = (parts.slice(1).join(':') || parts[0] || '').trim();

    return {
      id,
      name,
      link: id.startsWith('T')
        ? `https://attack.mitre.org/techniques/${id}/`
        : id.startsWith('TA')
          ? `https://attack.mitre.org/tactics/${id}/`
          : undefined,
    };
  }

  const id = String(item?.id || '').trim();
  return {
    id,
    name: String(item?.name || item?.title || id || 'Unknown'),
    description: item?.description,
    link: item?.link,
  };
}

function ItemList({ title, items }: { title: string; items: any[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
      <h4 className="mb-2 text-xs font-black uppercase tracking-wide" style={{ color: APP_COLORS.textSecondary }}>
        {title} ({items.length})
      </h4>
      <div className="space-y-2">
        {items.slice(0, 12).map((item, index) => {
          const normalized = normalizeItem(item);
          return (
            <div key={`${normalized.id || normalized.name}-${index}`} className="rounded-lg border p-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.surface }}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black" style={{ color: APP_COLORS.primary }}>{normalized.id || 'MITRE'}</p>
                  <p className="truncate text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>{normalized.name}</p>
                </div>
                {normalized.link ? (
                  <a href={normalized.link} target="_blank" rel="noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded border" style={{ borderColor: APP_COLORS.border }}>
                    <ExternalLink className="h-3.5 w-3.5" style={{ color: APP_COLORS.textSecondary }} />
                  </a>
                ) : null}
              </div>
              {normalized.description ? (
                <p className="mt-1 text-xs" style={{ color: APP_COLORS.textSecondary }}>{normalized.description}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MitreAttackSection({ mitreAttack }: MitreAttackSectionProps) {
  const tactics = Array.isArray(mitreAttack?.tactics) ? mitreAttack?.tactics : [];
  const techniques = Array.isArray(mitreAttack?.techniques) ? mitreAttack?.techniques : [];

  if (!tactics.length && !techniques.length) return null;

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
          MITRE ATT&CK
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ItemList title="Tactics" items={tactics} />
        <ItemList title="Techniques" items={techniques} />
      </div>
    </section>
  );
}
