# Analyze Refactor Change Log

Date: 2026-04-18
Scope: Analyze page redesign migration, rate-limit redesign, and IOC v2 backend rate-limit header/payload updates.

## Summary

This update continues the migration to the new Analyze architecture (cards/hooks/domain panel), introduces IP-based minute/day rate limiting in IOC v2 API, and wires the new frontend rate-limit UX and search/domain experience.

## Files Changed

### Frontend (Analyze)

1. src/app/analyze/AnalyzePageView.tsx
2. src/app/analyze/components/ThreatSearchForm.tsx
3. src/app/analyze/components/RateLimitIndicator.tsx
4. src/app/analyze/components/cards/FileInformationCard.tsx

### Backend (IOC v2)

1. src/app/api/ioc-v2/services/rate-limit.ts
2. src/app/api/ioc-v2/route.ts

### Memory Update

1. /memories/repo/ui-rebrand-theme.md (brand note corrected from SentinelIQ to VigilanceX)

## Detailed Changes

### 1) Analyze page integration updates

File: src/app/analyze/AnalyzePageView.tsx

- Updated imports to use new card components from src/app/analyze/components/cards.
- Added integration for new detection list card:
  - DetectionNamesCard
- Updated card prop wiring to match the new card contracts:
  - ThreatOverviewCard now receives explicit detection counts and normalized risk props.
  - PopularThreatLabel now receives label/suggestedLabel and malicious/suspicious counts.
  - ThreatIntelligenceCards now receives familyLabels.
  - DynamicVTData now receives both vtData and detections.
  - IPReputationCard now receives data instead of legacy ipReputation prop.
  - MultiSourceDataCard now receives only multiSourceData.

#### Rate-limit integration in Analyze page

- Added support for parsing the new minute/day rate-limit headers:
  - X-RateLimit-Remaining-Minute
  - X-RateLimit-Limit-Minute
  - X-RateLimit-Reset-Minute
- Kept fallback support for legacy headers (X-RateLimit-Remaining, X-RateLimit-Limit, X-RateLimit-Reset).
- Updated 429 handling message to use backend payload:
  - type (minute/day)
  - retryAfter (seconds)
- Added derived state object for the new RateLimitIndicator contract (minute/day/countdown model).
- Added live countdown refresh while limited (1-second interval).

#### Search and domain UX integration

- Added RecentSearchChips under the analyze form.
- Added local IOC type detector helper for chip metadata.
- Added Domain panel integration using useDomainPanel and DomainSidePanel.
- Added Domain Intelligence button in the Active Investigation strip when current IOC is a domain.

### 2) Threat search form contract and UI

File: src/app/analyze/components/ThreatSearchForm.tsx

- Replaced legacy contract with:
  - onAnalyze(value: string)
  - isLoading
  - disabled
  - currentIOC
- Added input-console style behavior with textarea-based IOC input.
- Added quick sample chips for one-click IOC input.
- Added keyboard shortcut support (Ctrl/Cmd + K) to focus input.
- Analyze button now follows loading/disabled states from parent.

### 3) Rate-limit indicator redesign

File: src/app/analyze/components/RateLimitIndicator.tsx

- Replaced old remaining/limit/resetAt props with a single typed state prop (RateLimitState).
- New UI model:
  - minute usage bar ([used / 4])
  - minute remaining count
  - day remaining count
  - limited state countdown text: "Rate limit reached - resets in Xs"
- Removed old status badge variants and motion-only status sections from prior implementation.

### 4) File information card accessibility fix

File: src/app/analyze/components/cards/FileInformationCard.tsx

- Added accessible text metadata to hash copy buttons:
  - aria-label
  - title
- This resolves the "Buttons must have discernible text" accessibility issue for icon-only copy actions.

### 5) IOC v2 backend rate-limit service redesign

File: src/app/api/ioc-v2/services/rate-limit.ts

- Replaced legacy in-memory user/hour limiter with IP-keyed dual-window limiter.
- New policy:
  - minute limit: 4
  - day limit: 100
- Added typed response contract (RateLimitResult) that includes:
  - allowed
  - limitType (minute/day/null)
  - retryAfter
  - minute bucket (limit/remaining/resetAt)
  - day bucket (limit/remaining/resetAt)
- Added periodic cleanup/refresh of expired windows.

### 6) IOC v2 route header/payload updates

File: src/app/api/ioc-v2/route.ts

- Added client identifier extraction from request headers:
  - x-forwarded-for
  - x-real-ip
  - cf-connecting-ip
- Switched rate-limit key from user-based to IP-based identifier.
- Added minute/day rate-limit headers on responses:
  - X-RateLimit-Limit-Minute
  - X-RateLimit-Remaining-Minute
  - X-RateLimit-Reset-Minute
  - X-RateLimit-Limit-Day
  - X-RateLimit-Remaining-Day
  - X-RateLimit-Reset-Day
- Kept legacy headers for compatibility:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
- Updated 429 payload shape for POST and GET:
  - type
  - retryAfter
  - resetAt
  - minuteRemaining
  - dayRemaining

## Validation Status

- No type/compile errors in:
  - src/app/api/ioc-v2/services/rate-limit.ts
  - src/app/api/ioc-v2/route.ts
- Analyze page and many cards still show existing style-policy diagnostics related to inline styles (non-blocking for TypeScript compile in this pass).
- Accessibility issue for copy button in FileInformationCard was fixed.

## Known Follow-ups

1. Complete AnalyzePageView migration to use the new hooks end-to-end (useAnalysis/useRateLimit bridging is partial).
2. Resolve remaining inline-style lint diagnostics in Analyze components/cards.
3. Run full verification for minute/day limits with real requests:
   - Success responses include both minute and day headers.
   - 429 payload exposes type and retryAfter.
4. Run project tests/lint after styling cleanup.

## Quick Manual Test Checklist

1. Open Analyze page.
2. Submit IOC until minute quota is exhausted.
3. Confirm rate indicator shows minute bar and countdown.
4. Confirm 429 toast includes active limit type and wait text.
5. Submit a domain IOC and click Domain Intelligence.
6. Confirm side panel opens and fetches /api/domain-intel.
7. Confirm recent search chips appear and can re-trigger analysis.
