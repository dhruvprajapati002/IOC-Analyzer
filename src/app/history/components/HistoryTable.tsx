'use client';

import { Eye, Clock, Search, RefreshCw, CheckCircle, Globe, Link2, Paperclip, Lock, FileText, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format as formatDate } from 'date-fns';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { IOCRecord, Pagination } from './types';

interface HistoryTableProps {
  records: IOCRecord[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  pagination: any;
  onPageChange: (page: number) => void;
  onViewDetails?: (ioc: string) => void;
  selectedIOC?: string | null;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
}

export function HistoryTable({
  records,
  loading,
  currentPage,
  totalPages,
  pagination,
  onPageChange,
  onViewDetails,
  selectedIOC,
  itemsPerPage = 10,
  onItemsPerPageChange
}: HistoryTableProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'malicious': return APP_COLORS.danger;
      case 'suspicious': return APP_COLORS.warning;
      case 'harmless': return APP_COLORS.success;
      default: return APP_COLORS.textSecondary;
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'malicious': return 'Malicious';
      case 'suspicious': return 'Suspicious';
      case 'harmless': return 'Clean';
      default: return 'Undetected';
    }
  };

  // ✅ NEW: Get analysis icon based on type/source
  const getAnalysisIcon = (record: IOCRecord) => {
    if (record.source === 'file_analysis') {
      return <FileText className="w-4 h-4" style={{ color: APP_COLORS.danger }} />;
    }
    
    switch (record.type) {
      case 'ip':
        return <Globe className="w-4 h-4" style={{ color: APP_COLORS.primary }} />;
      case 'domain':
        return <Link2 className="w-4 h-4" style={{ color: APP_COLORS.success }} />;
      case 'url':
        return <Paperclip className="w-4 h-4" style={{ color: APP_COLORS.warning }} />;
      case 'hash':
        return <Hash className="w-4 h-4" style={{ color: APP_COLORS.info }} />;
      default:
        return <Search className="w-4 h-4" style={{ color: APP_COLORS.textSecondary }} />;
    }
  };

  // ✅ NEW: Get analysis display
  const getAnalysisDisplay = (record: IOCRecord) => {
    // File analysis - show filename and size
    if (record.source === 'file_analysis' && record.metadata?.filename) {
      const filesize = record.metadata.filesize 
        ? record.metadata.filesize > 1024 * 1024
          ? `${(record.metadata.filesize / (1024 * 1024)).toFixed(2)} MB`
          : `${(record.metadata.filesize / 1024).toFixed(1)} KB`
        : null;
        
      return {
        primary: record.metadata.filename,
        secondary: filesize,
        color: APP_COLORS.textPrimary
      };
    }
    
    // Manual searches - show label or type name
    if (record.label) {
      return {
        primary: record.label,
        secondary: null,
        color: APP_COLORS.textSecondary
      };
    }
    
    // Fallback - show type-based label
    const typeLabels: Record<string, string> = {
      'ip': 'IP Reputation Check',
      'domain': 'Domain Lookup',
      'url': 'URL Analysis',
      'hash': 'Hash Analysis'
    };
    
    return {
      primary: typeLabels[record.type] || 'Analysis',
      secondary: null,
      color: APP_COLORS.textSecondary
    };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ip': return APP_COLORS.primary;
      case 'domain': return APP_COLORS.primarySoft;
      case 'url': return APP_COLORS.info;
      case 'hash': return APP_COLORS.warning;
      default: return APP_COLORS.textMuted;
    }
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden border-1 rounded-lg"
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <div 
        className="flex-1 min-h-0 overflow-x-auto overflow-y-auto custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${APP_COLORS.primary}40 ${APP_COLORS.surface}`,
        }}
      >
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${APP_COLORS.surface};
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${APP_COLORS.primary}40;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${APP_COLORS.primary}60;
          }
        `}</style>
        <Table>
          <TableHeader
            className="sticky top-0 z-10"
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
            }}
          >
            <TableRow
              style={{
                borderColor: APP_COLORS.border,
              }}
            >
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                style={{ color: APP_COLORS.primary }}
              >
                IOC
              </TableHead>
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                style={{ color: APP_COLORS.primary }}
              >
                Type
              </TableHead>
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                style={{ color: APP_COLORS.primary }}
              >
                Verdict
              </TableHead>
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                style={{ color: APP_COLORS.primary }}
              >
                Detection
              </TableHead>
              {/* ✅ COMBINED: Analysis Column */}
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                style={{ color: APP_COLORS.primary }}
              >
                Analysis
              </TableHead>
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                style={{ color: APP_COLORS.primary }}
              >
                Analyzed
              </TableHead>
              <TableHead
                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide text-right`}
                style={{ color: APP_COLORS.primary }}
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <RefreshCw
                    className="h-8 w-8 animate-spin mx-auto mb-4"
                    style={{ color: APP_COLORS.primary }}
                  />
                  <p
                    className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.medium}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Loading history data...
                  </p>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <Search
                    className="h-12 w-12 mx-auto mb-4 opacity-30"
                    style={{ color: APP_COLORS.textSecondary }}
                  />
                  <p
                    className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.semibold} mb-1`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    No records found
                  </p>
                  <p
                    className={TYPOGRAPHY.body.sm}
                    style={{ color: APP_COLORS.textDim }}
                  >
                    Try adjusting your filters or search query
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const analysisDisplay = getAnalysisDisplay(record);
                
                return (
                  <TableRow
                    key={record.id}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderColor: APP_COLORS.border,
                      backgroundColor: selectedIOC === record.ioc ? `${APP_COLORS.primary}08` : 'transparent',
                    }}
                    onClick={() => onViewDetails?.(record.ioc)}
                    onMouseEnter={(e) => {
                      if (selectedIOC !== record.ioc) {
                        e.currentTarget.style.backgroundColor = `${APP_COLORS.surfaceSoft}60`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedIOC !== record.ioc) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {/* IOC */}
                    <TableCell className="max-w-xs">
                      <span
                        className={`${TYPOGRAPHY.code.sm} ${TYPOGRAPHY.fontWeight.medium} truncate block`}
                        style={{ color: APP_COLORS.textPrimary


                         }}
                        title={record.ioc}
                      >
                        {record.ioc}
                      </span>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <span
                        className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`}
                        style={{ color: getTypeColor(record.type) }}
                      >
                        {record.type}
                      </span>
                    </TableCell>

                    {/* Verdict */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getVerdictColor(record.verdict) }}
                        />
                        <span
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                          style={{ color: getVerdictColor(record.verdict) }}
                        >
                          {getVerdictLabel(record.verdict)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Detection Stats */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {record.stats.malicious > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} tabular-nums`}
                              style={{ color: APP_COLORS.danger }}
                            >
                              {record.stats.malicious}
                            </span>
                            <span
                              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                              style={{ color: APP_COLORS.textSecondary }}
                            >
                              mal
                            </span>
                          </div>
                        )}
                        {record.stats.suspicious > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} tabular-nums`}
                              style={{ color: APP_COLORS.warning }}
                            >
                              {record.stats.suspicious}
                            </span>
                            <span
                              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                              style={{ color: APP_COLORS.textSecondary }}
                            >
                              sus
                            </span>
                          </div>
                        )}
                        {record.stats.malicious === 0 && record.stats.suspicious === 0 && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" style={{ color: APP_COLORS.success }} />
                            <span
                              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                              style={{ color: APP_COLORS.success }}
                            >
                              Clean
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* ✅ COMBINED: Analysis */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAnalysisIcon(record)}
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} truncate block max-w-[220px]`}
                            style={{ color: analysisDisplay.color }}
                            title={analysisDisplay.primary}
                          >
                            {analysisDisplay.primary}
                          </span>
                          {analysisDisplay.secondary && (
                            <span
                              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                              style={{ color: APP_COLORS.textSecondary }}
                            >
                              {analysisDisplay.secondary}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Analyzed Time */}
                    <TableCell>
                      <div
                        className={`flex items-center gap-1.5 ${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(new Date(record.searchedAt), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(record.ioc);
                        }}
                        className={`${TYPOGRAPHY.label.xs} ${TYPOGRAPHY.fontWeight.semibold} transition-all`}
                        style={{
                          color: selectedIOC === record.ioc ? APP_COLORS.primary : APP_COLORS.textMuted,
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {selectedIOC === record.ioc ? 'Viewing' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer - Fixed at bottom */}
      {totalPages > 0 && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t"
          style={{
            borderColor: APP_COLORS.border,
            backgroundColor: APP_COLORS.backgroundSoft,
          }}
        >
          {/* Left: Items per page + Info */}
          <div className="flex items-center gap-6">
            {/* Items per page selector */}
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <span
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Show
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} px-3 py-1.5 border focus:outline-none focus:ring-2 transition-all`}
                  style={{
                    backgroundColor: APP_COLORS.backgroundSoft,
                    borderColor: APP_COLORS.border,
                    color: APP_COLORS.textPrimary,
                    borderRadius: '6px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = APP_COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${APP_COLORS.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = APP_COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  per page
                </span>
              </div>
            )}

            {/* Page info */}
            {pagination && (
              <div
                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Showing{' '}
                <span className={TYPOGRAPHY.fontWeight.bold} style={{ color: APP_COLORS.textPrimary }}>
                  {((pagination.currentPage - 1) * itemsPerPage) + 1}
                </span>
                {' '}-{' '}
                <span className={TYPOGRAPHY.fontWeight.bold} style={{ color: APP_COLORS.textPrimary }}>
                  {Math.min(pagination.currentPage * itemsPerPage, pagination.totalCount)}
                </span>
                {' '}of{' '}
                <span className={TYPOGRAPHY.fontWeight.bold} style={{ color: APP_COLORS.textPrimary }}>
                  {pagination.totalCount}
                </span>
              </div>
            )}
          </div>

          {/* Right: Pagination controls */}
          <div className="flex items-center gap-2">
            {/* Page indicator */}
            <span
              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} px-3`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Page{' '}
              <span className={TYPOGRAPHY.fontWeight.bold} style={{ color: APP_COLORS.textPrimary }}>
                {currentPage}
              </span>
              {' '}of{' '}
              <span className={TYPOGRAPHY.fontWeight.bold} style={{ color: APP_COLORS.textPrimary }}>
                {totalPages}
              </span>
            </span>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 h-8 w-8"
                style={{
                  backgroundColor: currentPage === 1 ? APP_COLORS.surfaceSoft : APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                  color: currentPage === 1 ? APP_COLORS.textMuted : APP_COLORS.textPrimary,
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="p-2 h-8 w-8"
                style={{
                  backgroundColor: currentPage === totalPages ? APP_COLORS.surfaceSoft : APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                  color: currentPage === totalPages ? APP_COLORS.textMuted : APP_COLORS.textPrimary,
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
