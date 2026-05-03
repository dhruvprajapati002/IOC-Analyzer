'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, ShieldQuestion, Shield } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

interface VerdictActionGuideProps {
  verdict?: 'malicious' | 'suspicious' | 'harmless' | 'clean' | 'undetected' | 'unknown' | 'error';
  ioc?: string;
  visible: boolean;
  onDismiss: () => void;
}

export function VerdictActionGuide({ verdict, ioc, visible, onDismiss }: VerdictActionGuideProps) {
  const [expanded, setExpanded] = useState(false);

  // Reset expanded state if verdict changes
  useEffect(() => {
    setExpanded(false);
  }, [verdict]);

  if (!visible || !verdict || verdict === 'error') return null;

  const v = verdict.toLowerCase();
  let title = '';
  let description = '';
  let actions: string[] = [];
  let icon = <Shield className="h-5 w-5" />;
  let color = APP_COLORS.neutral;

  const iocDisplay = ioc ? ` (${ioc.length > 30 ? ioc.substring(0, 30) + '...' : ioc})` : '';

  if (v === 'malicious') {
    title = 'Malicious Threat Detected';
    description = `The scanned IOC${iocDisplay} has been confirmed as malicious. Immediate action recommended.`;
    actions = [
      'Block at firewall/DNS',
      'Isolate affected systems',
      'Escalate to incident response',
      'Preserve logs',
      'Check for lateral movement'
    ];
    icon = <ShieldAlert className="h-5 w-5 text-white" />;
    color = '#ef4444'; // Red
  } else if (v === 'suspicious') {
    title = 'Suspicious Activity';
    description = `The scanned IOC${iocDisplay} shows suspicious characteristics but is not confirmed malicious.`;
    actions = [
      'Monitor closely',
      'Do not block yet',
      'Run deeper sandbox analysis',
      'Check for related IOCs',
      'Document findings'
    ];
    icon = <ShieldAlert className="h-5 w-5 text-black" />;
    color = '#eab308'; // Yellow
  } else if (v === 'clean' || v === 'harmless' || v === 'undetected') {
    title = 'No Threats Detected';
    description = `The scanned IOC${iocDisplay} appears safe based on current intelligence.`;
    actions = [
      'Continue monitoring',
      'Re-scan if context changes',
      'Whitelist if appropriate'
    ];
    icon = <ShieldCheck className="h-5 w-5 text-white" />;
    color = '#22c55e'; // Green
  } else {
    title = 'Unknown Threat Level';
    description = `Insufficient data to determine verdict for this IOC${iocDisplay}.`;
    actions = [
      'Try additional intelligence sources',
      'Submit for sandbox analysis',
      'Treat as suspicious until confirmed'
    ];
    icon = <ShieldQuestion className="h-5 w-5 text-white" />;
    color = '#94a3b8'; // Slate
  }

  const textColor = v === 'suspicious' ? '#000000' : '#ffffff';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 z-50 w-full md:w-80 shadow-2xl transition-all duration-300 ease-in-out"
      style={{
        transform: 'translateY(0)',
        opacity: 1,
      }}
    >
      <div 
        className="rounded-t-xl md:rounded-lg overflow-hidden flex flex-col border-x-0 border-b-0 md:border-x md:border-b"
        style={{
          backgroundColor: APP_COLORS.surface,
          border: `1px solid ${color}`,
        }}
      >
        <div 
          className="flex items-start justify-between p-4"
          style={{ backgroundColor: color, color: textColor }}
        >
          <div className="flex gap-3">
            <div className="mt-0.5">{icon}</div>
            <div>
              <h4 className="font-bold text-sm">{title}</h4>
              <p className="text-xs opacity-90 mt-1">{description}</p>
            </div>
          </div>
          <button 
            onClick={onDismiss}
            className="opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold hover:underline w-full text-left"
            style={{ color: APP_COLORS.primary }}
          >
            {expanded ? 'Hide Recommended Actions' : 'View Recommended Actions'}
          </button>

          {expanded && (
            <ul className="mt-3 space-y-1.5 list-disc pl-4 text-xs" style={{ color: APP_COLORS.textSecondary }}>
              {actions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
