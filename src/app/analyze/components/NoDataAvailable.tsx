'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info, RefreshCcw, Globe2, MapPin, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface NoDataAvailableProps {
  ioc: string;
  type: string;
  error?: string;
  geolocation?: {
    countryName?: string;
    city?: string;
    isp?: string;
  };
  onRetry?: () => void;
}

export function NoDataAvailable({
  ioc,
  type,
  error,
  geolocation,
  onRetry,
}: NoDataAvailableProps) {
  const isNetworkError =
    error?.toLowerCase().includes('certificate') ||
    error?.toLowerCase().includes('network') ||
    error?.toLowerCase().includes('fetch failed');

  const isIp = type === 'ip';

  const hasGeo =
    isIp &&
    geolocation &&
    (geolocation.countryName || geolocation.city || geolocation.isp);

  const locationLine =
    geolocation?.city && geolocation?.countryName
      ? `${geolocation.city}, ${geolocation.countryName}`
      : geolocation?.countryName || geolocation?.city;

  return (
    <Card
      className={`${CARD_STYLES.base} shadow-none`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
       
      }}
    >
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-5 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: APP_COLORS.warning + '15' }}
            >
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: APP_COLORS.warning }}
              />
            </div>
            <div className="text-left">
              <h3
                className={`${TYPOGRAPHY.heading.h4} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                No cyber intelligence data available
              </h3>
              <p
                className={`${TYPOGRAPHY.caption.md}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                This indicator could not be enriched by the configured providers.
              </p>
            </div>
          </div>

          {/* IOC summary */}
          <div
            className="w-full rounded-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            style={{
              backgroundColor: APP_COLORS.surfaceSoft,
              border: `1px solid ${APP_COLORS.borderSoft}`,
            }}
          >
            <span
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} px-2.5 py-1 rounded-full uppercase tracking-wide`}
              style={{
                backgroundColor: APP_COLORS.info + '16',
                color: APP_COLORS.info,
              }}
            >
              {type}
            </span>
            <code
              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontFamily.mono} break-all`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              {ioc.length > 80 ? `${ioc.slice(0, 80)}…` : ioc}
            </code>
          </div>

          {/* IP context (minimal) */}
          {hasGeo && (
            <div
              className="w-full rounded-lg p-4 grid gap-3 sm:grid-cols-[auto,1fr]"
              style={{
                backgroundColor: APP_COLORS.surfaceSoft,
                border: `1px solid ${APP_COLORS.borderSoft}`,
              }}
            >
              <div className="flex flex-col items-center sm:items-start gap-2">
                <Globe2
                  className="w-5 h-5"
                  style={{ color: APP_COLORS.info }}
                />
                <p
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  IP context
                </p>
              </div>
              <div className="text-left space-y-1">
                {locationLine && (
                  <p
                    className={TYPOGRAPHY.body.sm}
                    style={{ color: APP_COLORS.textPrimary }}
                  >
                    <MapPin className="inline w-4 h-4 mr-1 -mt-0.5" />
                    {locationLine}
                  </p>
                )}
                {geolocation?.isp && (
                  <p
                    className={TYPOGRAPHY.caption.md}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    <Activity className="inline w-4 h-4 mr-1 -mt-0.5" />
                    ISP: {geolocation.isp}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error section */}
          {error && (
            <div
              className="w-full rounded-lg p-4 flex gap-3 items-start"
              style={{
                backgroundColor: isNetworkError
                  ? APP_COLORS.warning + '10'
                  : APP_COLORS.danger + '10',
                border: `1px solid ${
                  isNetworkError
                    ? APP_COLORS.warning + '40'
                    : APP_COLORS.danger + '40'
                }`,
              }}
            >
              <Info
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{
                  color: isNetworkError
                    ? APP_COLORS.warning
                    : APP_COLORS.danger,
                }}
              />
              <div className="text-left space-y-1">
                <p
                  className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  {isNetworkError ? 'Connectivity issue' : 'Request error'}
                </p>
                <p
                  className={TYPOGRAPHY.caption.md}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Actions + tips */}
          <div className="w-full flex flex-col items-center gap-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                className={`rounded-lg ${TYPOGRAPHY.body.sm}`}
                style={{
                  backgroundColor: APP_COLORS.primary,
                  color: APP_COLORS.textPrimary,
                }}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry analysis
              </Button>
            )}

            <div
              className="w-full rounded-lg p-3 text-left"
              style={{
                backgroundColor: APP_COLORS.surfaceSoft,
                border: `1px solid ${APP_COLORS.borderSoft}`,
              }}
            >
              <p
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold} mb-1`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Next steps
              </p>
              <ul
                className={`${TYPOGRAPHY.caption.sm} space-y-1`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                <li>• Verify the IOC format (IP, domain, hash, URL).</li>
                <li>• Try again after a short delay.</li>
                {isNetworkError && (
                  <li>• Check outbound network and SSL inspection settings.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
