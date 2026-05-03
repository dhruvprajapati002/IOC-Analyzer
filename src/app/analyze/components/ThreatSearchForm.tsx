'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import VigilanceLogo from '@/components/brand/VigilanceLogo';
import {
  APP_COLORS,
} from '@/lib/colors';

interface ThreatSearchFormProps {
  onAnalyze: (value: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  currentIOC?: string;
}

const QUICK_EXAMPLES = [
  '8.8.8.8',
  'example-malicious-domain.com',
  '44d858c12fea8a8f36de82e1278abb02f',
];

export function ThreatSearchForm({
  onAnalyze,
  isLoading,
  disabled = false,
  currentIOC,
}: ThreatSearchFormProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (!query || isLoading || disabled) return;
    await onAnalyze(query);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    if (text.includes('\\n') || text.includes(',')) {
      const firstVal = text.split(/[\\n,]/)[0].trim();
      setValue(firstVal);
    } else {
      setValue(text);
    }
  };

  return (
    <div
      style={{
        background: APP_COLORS.backgroundSoft,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <VigilanceLogo variant="full" size="md" theme="light" />
          <h2 className="mt-1 text-xl font-bold" style={{ color: APP_COLORS.textPrimary }}>
            Search IOCs for Intelligence Enrichment
          </h2>
          <p className="mt-1 text-sm" style={{ color: APP_COLORS.textMuted }}>
            Search a single IP, domain, URL, or hash
          </p>
        </div>

        {currentIOC ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
              color: APP_COLORS.textPrimary,
              fontFamily: 'monospace',
            }}
          >
            Current Indicator: {currentIOC}
          </span>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex items-stretch gap-3">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4"
              style={{ color: APP_COLORS.textMuted }}
            />
            <input
              type="text"
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              placeholder="Enter an IP, domain, URL, or hash and press Enter…"
              disabled={isLoading || disabled}
              className="w-full rounded-xl border pl-9 pr-3 py-3 text-sm outline-none transition"
              style={{
                borderColor: APP_COLORS.border,
                backgroundColor: APP_COLORS.surface,
                color: APP_COLORS.textPrimary,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || disabled}
            className="rounded-xl px-4 py-3 text-sm font-semibold border"
            style={{
              backgroundColor: APP_COLORS.surface,
              borderColor: APP_COLORS.border,
              color: APP_COLORS.textSecondary,
              minWidth: 100,
              opacity: disabled ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_EXAMPLES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setValue(sample)}
              className="rounded-full px-2.5 py-1 text-xs"
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                color: APP_COLORS.textMuted,
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
