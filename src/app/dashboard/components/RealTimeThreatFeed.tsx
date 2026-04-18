'use client';

import { AlertTriangle, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { CARD_STYLES, LOADING_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ScrollArea } from '@/components/ui/ScrollArea';
import type { ThreatFeedItem } from './dashboard.types';

interface RealTimeThreatFeedProps {
  items: ThreatFeedItem[];
  loading?: boolean;
}

function verdictClass(verdict: string): string {
  const normalized = verdict.toLowerCase();
  if (normalized === 'malicious') return 'text-t-danger';
  if (normalized === 'suspicious') return 'text-t-warning';
  if (normalized === 'harmless') return 'text-t-success';
  return 'text-t-textSecondary';
}

function timeAgo(timestamp: string): string {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  return `${hours}h ago`;
}

export function RealTimeThreatFeed({ items, loading = false }: RealTimeThreatFeedProps) {
  const rows = Array.isArray(items) ? items : [];

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border border-[#dad9d4] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]`}>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-t-danger" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Live Threat Feed
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className={`${LOADING_STYLES.skeleton} h-60`} />
        ) : !rows || rows.length === 0 ? (
          <NoGraphData title="No live events" subtitle="No recent IOC events to display" />
        ) : (
          <ScrollArea className="h-60 pr-2" variant="thin">
            <div className="space-y-2">
              {rows.slice(0, 20).map((item) => (
                <div key={`${item.ioc}-${item.timestamp}`} className="rounded-lg border border-[#dad9d4] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-textPrimary`}>
                      {item.ioc}
                    </span>
                    <span className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <AlertTriangle className={`h-3.5 w-3.5 ${verdictClass(item.verdict)}`} />
                    <span className={`${TYPOGRAPHY.caption.xs} ${verdictClass(item.verdict)}`}>
                      {item.verdict}
                    </span>
                    <span className={`${TYPOGRAPHY.caption.xs} text-t-textSecondary`}>
                      {item.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
