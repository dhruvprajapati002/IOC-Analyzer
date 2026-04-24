import VigilanceLogo from '@/components/brand/VigilanceLogo';

type LogoProps = {
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function Logo({ compact = false, showTagline = false, className = '' }: LogoProps) {
  return (
    <VigilanceLogo
      variant={compact ? 'compact' : 'full'}
      size="md"
      theme="light"
      showTagline={showTagline}
      className={className}
    />
  );
}
