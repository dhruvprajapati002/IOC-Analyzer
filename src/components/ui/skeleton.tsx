// components/ui/skeleton.tsx
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-t-surfaceMuted/40 to-t-textMuted/40 ${className || ''}`}
      {...props}
    />
  );
}

export { Skeleton };
