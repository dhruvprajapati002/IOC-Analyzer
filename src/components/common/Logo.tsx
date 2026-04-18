import { Radar, Shield } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

type LogoProps = {
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function Logo({ compact = false, showTagline = false, className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <div
        className="relative h-11 w-11 rounded-xl border flex items-center justify-center"
        style={{
          borderColor: `${APP_COLORS.info}50`,
          background: `linear-gradient(135deg, ${APP_COLORS.accentBlueDark}30, ${APP_COLORS.accentCyan}20)`,
        }}
      >
       <Shield className="h-6 w-6" style={{ color: APP_COLORS.textPrimary }} />
        <Radar className="h-3.5 w-3.5 absolute -bottom-1 -right-1" style={{ color: APP_COLORS.accentCyan }} />
      </div>

      {!compact && (
        <div className="leading-tight">
          <p className="text-lg font-black tracking-tight" style={{ color: APP_COLORS.textPrimary }}>
            VigilanceX
          </p>
          {showTagline && (
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: APP_COLORS.textSecondary }}>
              Cyber Threat Intelligence Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
}
