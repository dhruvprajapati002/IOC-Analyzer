'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import type { FileAnalysisResult, FileAnalysisAPIResponse } from './types';
import { apiFetch } from '@/lib/apiFetch';

interface FileUploadZoneProps {
  token: string;
  onAnalysisComplete: (result: FileAnalysisResult) => void;
  onRateLimitUpdate: (headers: Headers) => void;
  rateLimitRemaining: number;
}

export function FileUploadZone({
  token,
  onAnalysisComplete,
  onRateLimitUpdate,
  rateLimitRemaining
}: FileUploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File too large! Maximum size is 50MB.', {
        description: `Selected file: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        duration: 5000,
      });
      setFile(null);
      return;
    }

    const validExtensions = [
      // Executables
      '.exe', '.dll', '.com', '.scr', '.msi', '.bin', '.elf',
      // Scripts
      '.bat', '.cmd', '.ps1', '.sh', '.bash', '.vbs', '.js', '.py', '.rb', '.pl', '.php', '.asp', '.aspx',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf', '.odt', '.ods',
      // Archives
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.tgz', '.cab', '.iso',
      // Mobile
      '.apk', '.ipa', '.dex',
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp',
      // Other
      '.jar', '.class', '.swf', '.dmg', '.pkg', '.deb', '.rpm'
    ];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Unsupported file type!', {
        description: 'Please select a supported file format',
        duration: 5000,
      });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    toast.success(`File selected: ${selectedFile.name}`, {
      description: `Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
    });
  };

  const handleClearFile = () => {
    setFile(null);
    setProgress(0);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (rateLimitRemaining <= 0) {
      toast.error('Rate limit exceeded! Please wait before analyzing more files.');
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiFetch('/api/file-analysis-v2', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      onRateLimitUpdate(response.headers);

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 429) {
          toast.error('Rate limit exceeded!', {
            description: 'Please wait before analyzing more files.',
            duration: 8000,
          });
        } else if (response.status === 413) {
          toast.error('File too large!', {
            description: errorData.error || 'File exceeds maximum size limit.',
            duration: 5000,
          });
        } else {
          throw new Error(errorData.error || 'Analysis failed');
        }
        return;
      }

      const data: FileAnalysisAPIResponse = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        const result = data.results[0];

        const normalizedResult: FileAnalysisResult = {
          ...result,
          hashes: result.hashes || {
            md5: result.fileInfo?.md5 || '',
            sha1: result.fileInfo?.sha1 || '',
            sha256: result.fileInfo?.sha256 || result.ioc || '',
          },
          analysisTime: result.analysisTime || `${(data.analysisTimeMs / 1000).toFixed(2)}s`,
        };

        onAnalysisComplete(normalizedResult);

        toast.success('Analysis complete!', {
          description: `Verdict: ${result.verdict.toUpperCase()} • Risk: ${result.riskScore}/100`,
          duration: 5000,
        });

        setTimeout(() => {
          setFile(null);
          setProgress(0);
        }, 2000);
      } else {
        throw new Error('No analysis results returned');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed', {
        description: 'Please try again or contact support if the issue persists.',
      });
      setProgress(0);
    } finally {
      setAnalyzing(false);
      clearInterval(progressInterval);
    }
  };

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-300 hover:shadow-md`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-4">
        {/* Upload Area - Compact */}
        <motion.div
          className="relative border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer overflow-hidden"
          style={{
            borderColor: dragActive ? APP_COLORS.primary : APP_COLORS.border,
            backgroundColor: dragActive ? `${APP_COLORS.primary}08` : 'transparent',
          }}
          animate={{
            scale: dragActive ? 1.02 : 1,
            borderColor: dragActive ? APP_COLORS.primary : APP_COLORS.border,
          }}
          transition={{ duration: 0.2 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <AnimatePresence mode="wait">
            {!file ? (
              // ✅ Empty State - Compact
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="py-6 px-4"
              >
                <div className="flex items-center justify-center gap-4">
                  {/* Icon */}
                  <motion.div
                    className="p-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: `${APP_COLORS.primary}15`,
                    }}
                    animate={{
                      scale: dragActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload
                      className="h-5 w-5"
                      style={{ color: APP_COLORS.primary }}
                    />
                  </motion.div>

                  {/* Text */}
                  <div className="flex-1">
                    <p
                      className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      Drop file here or click to browse
                    </p>
                    <p
                      className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      EXE, APK, PDF, DOC, ZIP, Images, Scripts & More • Max 50MB
                    </p>
                  </div>
                </div>

                {/* File Input */}
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={analyzing}
                  accept=".exe,.dll,.com,.scr,.msi,.bin,.elf,.bat,.cmd,.ps1,.sh,.bash,.vbs,.js,.py,.rb,.pl,.php,.asp,.aspx,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.odt,.ods,.zip,.rar,.7z,.tar,.gz,.bz2,.tgz,.cab,.iso,.apk,.ipa,.dex,.jpg,.jpeg,.png,.gif,.bmp,.svg,.ico,.webp,.jar,.class,.swf,.dmg,.pkg,.deb,.rpm"
                />
              </motion.div>
            ) : analyzing ? (
              // ✅ Analyzing State - Animated
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="py-6 px-4"
              >
                <div className="flex items-center gap-4">
                  {/* Animated Loader */}
                  <motion.div
                    className="p-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: `${APP_COLORS.primary}15`,
                    }}
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2
                      className="h-5 w-5"
                      style={{ color: APP_COLORS.primary }}
                    />
                  </motion.div>

                  {/* Progress Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        Analyzing {file.name}
                      </p>
                      <motion.span
                        className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                        style={{ color: APP_COLORS.primary }}
                        key={progress}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {progress}%
                      </motion.span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${APP_COLORS.primary}20` }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: APP_COLORS.primary }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>

                    {/* Status Text */}
                    <motion.p
                      className={`${TYPOGRAPHY.caption.xs} mt-1.5`}
                      style={{ color: APP_COLORS.textSecondary }}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {progress < 30 && 'Uploading file...'}
                      {progress >= 30 && progress < 60 && 'Scanning with VirusTotal...'}
                      {progress >= 60 && progress < 90 && 'Analyzing threat signatures...'}
                      {progress >= 90 && 'Finalizing results...'}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            ) : (
              // ✅ File Selected State - Compact
              <motion.div
                key="selected"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="py-4 px-4"
              >
                <div className="flex items-center gap-3">
                  {/* File Icon */}
                  <motion.div
                    className="p-2.5 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${APP_COLORS.success}15`,
                      border: `1px solid ${APP_COLORS.success}30`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <FileText
                      className="h-4 w-4"
                      style={{ color: APP_COLORS.success }}
                    />
                  </motion.div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {file.name}
                    </p>
                    <p
                      className={`${TYPOGRAPHY.caption.xs}`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleAnalyze}
                        disabled={rateLimitRemaining <= 0}
                        size="sm"
                        className="h-8"
                        style={{
                          backgroundColor: rateLimitRemaining <= 0 ? APP_COLORS.textMuted : APP_COLORS.primary,
                          color: 'white',
                        }}
                      >
                        {rateLimitRemaining <= 0 ? (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                            Limit Reached
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        onClick={handleClearFile}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer Info - Compact */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: rateLimitRemaining > 0 ? APP_COLORS.success : APP_COLORS.error }}
            />
            <span style={{ color: APP_COLORS.textSecondary }}>
              {rateLimitRemaining} analyses remaining
            </span>
          </motion.div>

          {file && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${TYPOGRAPHY.caption.xs}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Ready to scan
            </motion.span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
