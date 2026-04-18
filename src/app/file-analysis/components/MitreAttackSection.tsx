'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Activity, FileText, ExternalLink } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface MitreTactic {
  id: string;
  name: string;
  description?: string;
  link?: string;
}

interface MitreTechnique {
  id: string;
  name: string;
  description?: string;
  link?: string;
}

interface MitreAttackData {
  tactics?: Array<MitreTactic | string>;
  techniques?: Array<MitreTechnique | string>;
}

interface MitreAttackSectionProps {
  mitreData: MitreAttackData | null | undefined;
}

// ✅ Expandable MITRE Item Component
function MitreItem({
  id,
  name,
  description,
  link,
  color,
}: {
  id: string;
  name: string;
  description?: string;
  link?: string;
  color: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className="rounded-lg border transition-all duration-200"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}30`,
      }}
    >
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between gap-3 p-3 cursor-pointer"
        style={{
          backgroundColor: isExpanded ? `${color}12` : 'transparent',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* ID Badge */}
          <div
            className="px-2 py-1 border rounded flex-shrink-0"
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}40`,
            }}
          >
            <span
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black}`}
              style={{ color }}
            >
              {id}
            </span>
          </div>

          {/* Name */}
          <span
            className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate`}
            style={{ color }}
          >
            {name}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* External Link Button */}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded border transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${color}25`;
                e.currentTarget.style.borderColor = `${color}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${color}15`;
                e.currentTarget.style.borderColor = `${color}40`;
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" style={{ color }} />
            </a>
          )}

          {/* Expand/Collapse Icon */}
          {description && (
            <div
              className="p-1 rounded transition-transform duration-200"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Description */}
      {description && isExpanded && (
        <div
          className="px-3 pb-3 pt-1 border-t animate-in slide-in-from-top-2 duration-200"
          style={{
            borderColor: `${color}20`,
          }}
        >
          <p
            className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium} leading-relaxed`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            {description}
          </p>
        </div>
      )}
    </div>
  );
}

export function MitreAttackSection({ mitreData }: MitreAttackSectionProps) {
  // ✅ Early return if no data
  if (!mitreData) return null;

  // ✅ Normalize tactics
  const normalizedTactics: MitreTactic[] = mitreData.tactics?.map((tactic): MitreTactic => {
    if (typeof tactic === 'string') {
      const parts = tactic.split(':');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts.slice(1).join(':').trim();
        return { 
          id, 
          name,
          description: undefined,
          link: `https://attack.mitre.org/tactics/${id}/`
        };
      }
      return { 
        id: '', 
        name: tactic,
        description: undefined,
        link: undefined
      };
    }
    return {
      id: tactic.id,
      name: tactic.name,
      description: tactic.description,
      link: tactic.link || `https://attack.mitre.org/tactics/${tactic.id}/`
    };
  }).filter(t => t.name && t.name !== 'Unknown') || [];

  // ✅ Normalize techniques
  const normalizedTechniques: MitreTechnique[] = mitreData.techniques?.map((technique): MitreTechnique => {
    if (typeof technique === 'string') {
      const parts = technique.split(':');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts.slice(1).join(':').trim();
        return { 
          id, 
          name,
          description: undefined,
          link: `https://attack.mitre.org/techniques/${id}/`
        };
      }
      return { 
        id: '', 
        name: technique,
        description: undefined,
        link: undefined
      };
    }
    return {
      id: technique.id,
      name: technique.name,
      description: technique.description,
      link: technique.link || `https://attack.mitre.org/techniques/${technique.id}/`
    };
  }).filter(t => t.name && t.name !== 'Unknown') || [];

  // ✅ Only render if we have data
  if (normalizedTactics.length === 0 && normalizedTechniques.length === 0) {
    return null;
  }

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg border"
              style={{
                backgroundColor: `${APP_COLORS.accentBlue}15`,
                borderColor: `${APP_COLORS.accentBlue}30`,
              }}
            >
              <Target className="h-5 w-5" style={{ color: APP_COLORS.accentBlue }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                MITRE ATT&CK Framework
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Adversary tactics and techniques
              </p>
            </div>
          </div>

          {/* Badge count */}
          <div className="flex items-center gap-2">
            {normalizedTactics.length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${APP_COLORS.accentBlue}15`,
                  color: APP_COLORS.accentBlue,
                }}
              >
                {normalizedTactics.length} Tactics
              </Badge>
            )}
            {normalizedTechniques.length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${APP_COLORS.accentBlue}15`,
                  color: APP_COLORS.accentBlue,
                }}
              >
                {normalizedTechniques.length} Techniques
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tactics Section */}
        {normalizedTactics.length > 0 && (
          <div>
            <div
              className="flex items-center gap-2 mb-3 pb-2 border-b"
              style={{ borderColor: `${APP_COLORS.accentBlue}30` }}
            >
              <Activity
                className="h-4 w-4"
                style={{ color: APP_COLORS.accentBlue }}
              />
              <span
                className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black} uppercase tracking-wider`}
                style={{ color: APP_COLORS.accentBlue }}
              >
                TACTICS ({normalizedTactics.length})
              </span>
            </div>
            {/* ✅ Scrollable container */}
            <div 
              className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${APP_COLORS.accentBlue}40 ${APP_COLORS.surface}`,
              }}
            >
              {normalizedTactics.map((tactic, idx) => (
                <MitreItem
                  key={`tactic-${tactic.id || idx}`}
                  id={tactic.id}
                  name={tactic.name}
                  description={tactic.description}
                  link={tactic.link}
                  color={APP_COLORS.accentBlue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Techniques Section */}
        {normalizedTechniques.length > 0 && (
          <div>
            <div
              className="flex items-center gap-2 mb-3 pb-2 border-b"
              style={{ borderColor: `${APP_COLORS.accentBlue}30` }}
            >
              <FileText
                className="h-4 w-4"
                style={{ color: APP_COLORS.accentBlue }}
              />
              <span
                className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black} uppercase tracking-wider`}
                style={{ color: APP_COLORS.accentBlue }}
              >
                TECHNIQUES ({normalizedTechniques.length})
              </span>
            </div>
            {/* ✅ Scrollable container */}
            <div 
              className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${APP_COLORS.accentBlue}40 ${APP_COLORS.surface}`,
              }}
            >
              {normalizedTechniques.map((technique, idx) => (
                <MitreItem
                  key={`technique-${technique.id || idx}`}
                  id={technique.id}
                  name={technique.name}
                  description={technique.description}
                  link={technique.link}
                  color={APP_COLORS.accentBlue}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
