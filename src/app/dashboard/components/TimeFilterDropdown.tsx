'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

export type TimeRange = 'daily' | 'weekly' | 'monthly';

interface TimeFilterDropdownProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const timeRangeOptions = [
  { value: 'daily' as TimeRange, label: 'Last 24 Hours', icon: '📅' },
  { value: 'weekly' as TimeRange, label: 'Last 7 Days', icon: '📆' },
  { value: 'monthly' as TimeRange, label: 'Last 30 Days', icon: '📊' },
];

export function TimeFilterDropdown({ value, onChange }: TimeFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = timeRangeOptions.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (range: TimeRange) => {
    onChange(range);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all hover:shadow-sm"
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: isOpen ? APP_COLORS.primary : APP_COLORS.borderSoft,
          boxShadow: isOpen ? `0 0 0 2px ${APP_COLORS.primary}20` : 'none',
        }}
      >
        <Clock className="h-3 w-3" style={{ color: APP_COLORS.primary }} />
        <span 
          className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
          style={{ color: APP_COLORS.textPrimary }}
        >
          {selectedOption?.label}
        </span>
        <ChevronDown 
          className="h-3 w-3 transition-transform" 
          style={{ 
            color: APP_COLORS.textSecondary,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 w-40 rounded-lg border shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: APP_COLORS.border,
          }}
        >
          {timeRangeOptions.map((option) => {
            const isSelected = option.value === value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="w-full flex items-center justify-between px-3 py-2 transition-all hover:bg-opacity-80"
                style={{
                  backgroundColor: isSelected ? `${APP_COLORS.primary}15` : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = `${APP_COLORS.primary}08`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{option.icon}</span>
                  <span 
                    className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.medium}`}
                    style={{ 
                      color: isSelected ? APP_COLORS.primary : APP_COLORS.textSecondary 
                    }}
                  >
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
