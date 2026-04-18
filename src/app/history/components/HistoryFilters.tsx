'use client';

import { Search, Download, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface HistoryFiltersProps {
  searchQuery: string;
  typeFilter: string;
  verdictFilter: string;
  sourceFilter: string; // ✅ NEW
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onVerdictFilterChange: (value: string) => void;
  onExport: (format: 'csv' | 'json') => void;
}

export function HistoryFilters({
  searchQuery,
  typeFilter,
  verdictFilter,

  onSearchChange,
  onTypeFilterChange,
  onVerdictFilterChange,
 
  onExport
}: HistoryFiltersProps) {
  return (
    <div
      className="p-4 rounded-xl border backdrop-blur-sm shadow-lg"
      style={{
        backgroundColor: `${APP_COLORS.backgroundSoft}`,
        borderColor: `${APP_COLORS.border}`,
        
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: APP_COLORS.textSecondary }}
          />
          <Input
            placeholder="Search by IOC, label, or hash..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 h-10 ${TYPOGRAPHY.body.sm} transition-all duration-200 hover:border-opacity-60 focus:ring-2`}
            style={{
              backgroundColor: `${APP_COLORS.backgroundSoft}`,
              borderColor: APP_COLORS.border,
              color: APP_COLORS.textPrimary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = APP_COLORS.primary;
              e.target.style.boxShadow = `0 0 0 3px ${APP_COLORS.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = APP_COLORS.border;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-40">
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger
              className={`h-10 ${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} transition-all duration-200 hover:border-opacity-60`}
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border,
                color: APP_COLORS.textPrimary,
              }}
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent
              className="z-50 min-w-[160px] backdrop-blur-xl shadow-2xl border"
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border,
                boxShadow: `0 8px 32px ${APP_COLORS.background}cc`,
              }}
            >
              <SelectItem 
                value="all"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                All Types
              </SelectItem>
              <SelectItem 
                value="ip"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                🌐 IP Address
              </SelectItem>
              <SelectItem 
                value="domain"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                🔗 Domain
              </SelectItem>
              <SelectItem 
                value="url"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                🔗 URL
              </SelectItem>
              <SelectItem 
                value="hash"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                🔐 Hash
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verdict Filter */}
        <div className="w-full sm:w-44">
          <Select value={verdictFilter} onValueChange={onVerdictFilterChange}>
            <SelectTrigger
              className={`h-10 ${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} transition-all duration-200 hover:border-opacity-60`}
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border,
                color: APP_COLORS.textPrimary,
              }}
            >
              <SelectValue placeholder="Verdict" />
            </SelectTrigger>
            <SelectContent
              className="z-50 min-w-[180px] backdrop-blur-xl shadow-2xl border"
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border,
                boxShadow: `0 8px 32px ${APP_COLORS.background}cc`,
              }}
            >
              <SelectItem 
                value="all"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                All Verdicts
              </SelectItem>
              <SelectItem 
                value="malicious"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: APP_COLORS.danger }}></span>
                  <span>Malicious</span>
                </div>
              </SelectItem>
              <SelectItem 
                value="suspicious"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: APP_COLORS.warning }}></span>
                  <span>Suspicious</span>
                </div>
              </SelectItem>
              <SelectItem 
                value="harmless"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: APP_COLORS.success }}></span>
                  <span>Clean</span>
                </div>
              </SelectItem>
              <SelectItem 
                value="undetected"
                className={`${TYPOGRAPHY.body.sm} cursor-pointer transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: APP_COLORS.textMuted }}></span>
                  <span>Undetected</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-10 ${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.semibold} transition-all duration-200 hover:border-opacity-60 hover:shadow-md`}
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border,
                color: APP_COLORS.textPrimary,
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 backdrop-blur-xl shadow-2xl border"
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
              borderColor: APP_COLORS.border,
              boxShadow: `0 8px 32px ${APP_COLORS.background}cc`,
            }}
          >
            <DropdownMenuItem 
              onClick={() => onExport('csv')}
              className={`cursor-pointer ${TYPOGRAPHY.body.sm} transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              <Download className="h-4 w-4 mr-2" style={{ color: APP_COLORS.primary }} />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onExport('json')}
              className={`cursor-pointer ${TYPOGRAPHY.body.sm} transition-colors hover:bg-[var(--t-surfaceAlt)] focus:bg-[var(--t-surfaceAlt)]`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              <FileDown className="h-4 w-4 mr-2" style={{ color: APP_COLORS.info }} />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
