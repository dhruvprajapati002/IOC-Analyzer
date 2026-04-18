import { APP_COLORS, CHART_COLORS, RISK_COLORS, STATUS_BADGE, BUTTON_STYLES, INPUT_STYLES, SHADOWS, LOADING_STYLES } from '@/lib/colors';

export function AnalysisCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{
        background: APP_COLORS.surface,
        borderColor: APP_COLORS.border,
      }}
    >
      <div className={`${LOADING_STYLES.skeleton} mb-3 h-5 w-1/3`} />
      <div className={`${LOADING_STYLES.skeleton} mb-4 h-5 w-full`} />
      <div className={`${LOADING_STYLES.skeleton} mb-4 h-3 w-full`} />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className={`${LOADING_STYLES.skeleton} h-8`} />
        <div className={`${LOADING_STYLES.skeleton} h-8`} />
        <div className={`${LOADING_STYLES.skeleton} h-8`} />
      </div>
      <div className="mb-4 flex gap-2">
        <div className={`${LOADING_STYLES.skeleton} h-6 w-24 rounded-full`} />
        <div className={`${LOADING_STYLES.skeleton} h-6 w-20 rounded-full`} />
        <div className={`${LOADING_STYLES.skeleton} h-6 w-16 rounded-full`} />
      </div>
      <div className="flex gap-2">
        <div className={`${LOADING_STYLES.skeleton} h-7 w-20 rounded-lg`} />
        <div className={`${LOADING_STYLES.skeleton} h-7 w-20 rounded-lg`} />
      </div>
    </div>
  );
}
