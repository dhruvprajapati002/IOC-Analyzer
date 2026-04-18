'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface ThreatCategoriesSectionProps {
  categories: string[] | Array<{ name?: string; category?: string; type?: string; [key: string]: any }>;
}

export function ThreatCategoriesSection({ categories }: ThreatCategoriesSectionProps) {
  if (!categories || categories.length === 0) return null;

  // ✅ Normalize categories - handle both string[] and object[] from OpenSearch
  const normalizedCategories = categories.map((category) => {
    if (typeof category === 'string') {
      return category;
    }
    // Handle object format - try different property names
    return category.name || category.category || category.type || String(category);
  }).filter(Boolean); // Remove any empty/null values

  if (normalizedCategories.length === 0) return null;

  // Professional color palette based on threat severity
  const getCategoryStyle = (category: string) => {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('trojan') || lowerCategory.includes('ransomware') || lowerCategory.includes('backdoor')) {
      return { color: APP_COLORS.danger };
    }
    if (lowerCategory.includes('malware') || lowerCategory.includes('virus') || lowerCategory.includes('worm')) {
      return { color: APP_COLORS.accentOrange };
    }
    if (lowerCategory.includes('adware') || lowerCategory.includes('pup') || lowerCategory.includes('suspicious')) {
      return { color: APP_COLORS.warning };
    }
    return { color: APP_COLORS.danger };
  };

  return (
    <Card
      className={`${CARD_STYLES.base} h-full transition-all duration-200`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.danger}20`,
              }}
            >
              <Shield className="h-5 w-5" style={{ color: APP_COLORS.danger }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Threat Categories
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Classification types
              </p>
            </div>
          </div>
          
          <Badge
            variant="secondary"
            className={`${TYPOGRAPHY.label.xs} px-2.5 py-1`}
            style={{
              backgroundColor: `${APP_COLORS.danger}20`,
              color: APP_COLORS.danger,
              border: `1px solid ${APP_COLORS.danger}40`,
              fontWeight: 700,
            }}
          >
            {normalizedCategories.length}
          </Badge>
        </div>

        {/* Categories List */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          {normalizedCategories.map((category, index) => {
            const style = getCategoryStyle(category);
            return (
              <CategoryRow
                key={index}
                category={category}
                index={index}
                color={style.color}
              />
            );
          })}
        </div>

        {/* Footer Summary */}
        {normalizedCategories.length > 3 && (
          <div 
            className="mt-4 pt-4 border-t"
            style={{ borderColor: `${APP_COLORS.border}` }}
          >
            <div className="flex items-center justify-between">
              <span 
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Multiple threats identified
              </span>
              <Badge
                variant="secondary"
                className={`${TYPOGRAPHY.label.xs} px-2.5 py-1`}
                style={{
                  backgroundColor: `${APP_COLORS.danger}20`,
                  color: APP_COLORS.danger,
                  border: `1px solid ${APP_COLORS.danger}40`,
                  fontWeight: 700,
                }}
              >
                HIGH RISK
              </Badge>
            </div>
          </div>
        )}
      </CardContent>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${APP_COLORS.surfaceSoft};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${APP_COLORS.danger}60;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${APP_COLORS.danger};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${APP_COLORS.danger}60 ${APP_COLORS.surfaceSoft};
        }
      `}</style>
    </Card>
  );
}

function CategoryRow({
  category,
  index,
  color,
}: {
  category: string;
  index: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] group cursor-default"
      style={{
        borderColor: `${color}30`,
      }}
    >
      {/* Icon */}
      <div
        className="p-2 rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{
          backgroundColor: `${color}15`,
        }}
      >
        <Target 
          className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" 
          style={{ color }}
        />
      </div>

      {/* Category Text */}
      <div className="flex-1 min-w-0">
        <span
          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} block truncate`}
          style={{ color }}
          title={category}
        >
          {category}
        </span>
        <span
          className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          Type {index + 1}
        </span>
      </div>

      {/* Status Indicator */}
      <div className="flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}60`
          }}
        />
      </div>
    </div>
  );
}
