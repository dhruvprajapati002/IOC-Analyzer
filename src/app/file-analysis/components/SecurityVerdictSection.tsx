// 'use client';

// import React from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Shield, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
// import { TYPOGRAPHY } from '@/lib/typography';
// import { FileAnalysisResult } from './types';

// interface SecurityVerdictSectionProps {
//   result: FileAnalysisResult;
// }

// export function SecurityVerdictSection({ result }: SecurityVerdictSectionProps) {
//   const getVerdictDisplay = (verdict: string) => {
//     switch (verdict) {
//       case 'malicious':
//         return { color: APP_COLORS.danger, icon: XCircle, text: 'MALICIOUS' };
//       case 'suspicious':
//         return { color: APP_COLORS.warning, icon: AlertTriangle, text: 'SUSPICIOUS' };
//       case 'harmless':
//         return { color: APP_COLORS.success, icon: CheckCircle, text: 'CLEAN' };
//       case 'unknown':
//         return { color: APP_COLORS.info, icon: Shield, text: 'UNKNOWN' };
//       default:
//         return { color: APP_COLORS.textSecondary, icon: Shield, text: 'UNKNOWN' };
//     }
//   };

//   const getRiskColor = (level: string) => {
//     switch (level) {
//       case 'critical': return APP_COLORS.danger;
//       case 'high': return '#f97316';
//       case 'medium': return APP_COLORS.warning;
//       case 'low': return APP_COLORS.success;
//       default: return APP_COLORS.textMuted;
//     }
//   };

//   const getRiskLabel = (level: string) => {
//     if (!level) return 'Unknown';
//     return level.charAt(0).toUpperCase() + level.slice(1);
//   };

//   const verdictInfo = getVerdictDisplay(result.verdict);
//   const VerdictIcon = verdictInfo.icon;
//   const riskColor = getRiskColor(result.riskLevel);

//   return (
//     <Card
//       className={`${CARD_STYLES.base} h-full transition-all duration-200`}
//       style={{
//         backgroundColor: APP_COLORS.backgroundSoft,
//         borderColor: APP_COLORS.border,
//       }}
//     >
//       <CardContent className="p-6">
//         {/* Header */}
//         <div className="flex items-center gap-3 mb-6">
//           <div
//             className="p-2.5 rounded-lg"
//             style={{
//               backgroundColor: `${verdictInfo.color}20`,
//             }}
//           >
//             <Shield className="h-5 w-5" style={{ color: verdictInfo.color }} />
//           </div>
//           <div>
//             <h3 
//               className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
//               style={{ color: APP_COLORS.textPrimary }}
//             >
//               Security Verdict
//             </h3>
//             <p 
//               className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
//               style={{ color: APP_COLORS.textSecondary }}
//             >
//               Analysis summary
//             </p>
//           </div>
//         </div>

//         <div className="space-y-4">
//           {/* Verdict Badge */}
//           <div 
//             className="flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200"
//             style={{
//               backgroundColor: `${verdictInfo.color}1`,
//               borderColor: `${verdictInfo.color}30`,
//             }}
//           >
//             <Badge 
//               className={`${TYPOGRAPHY.label.md} flex items-center gap-2 px-3 py-1.5`}
//               style={{
//                 backgroundColor: `${verdictInfo.color}20`,
//                 color: verdictInfo.color,
//                 border: `1px solid ${verdictInfo.color}40`,
//                 fontWeight: 700,
//               }}
//             >
//               <VerdictIcon className="h-4 w-4" />
//               {verdictInfo.text}
//             </Badge>
            
//             <div className="flex items-center gap-2">
//               <div className="relative flex h-2.5 w-2.5">
//                 <span 
//                   className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
//                   style={{ backgroundColor: verdictInfo.color }}
//                 />
//                 <span 
//                   className="relative inline-flex rounded-full h-2.5 w-2.5"
//                   style={{ backgroundColor: verdictInfo.color }}
//                 />
//               </div>
//               <span 
//                 className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
//                 style={{ color: verdictInfo.color }}
//               >
//                 Active
//               </span>
//             </div>
//           </div>
          
//           {/* Risk Score Card */}
//           <div
//             className="p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01]"
//             style={{
//               borderColor: `${riskColor}30`,
//             }}
//           >
//             <div className="flex justify-between items-start mb-3">
//               <div className="flex items-center gap-2.5">
//                 <div
//                   className="p-1.5 rounded-lg"
//                   style={{
//                     backgroundColor: `${riskColor}15`,
//                   }}
//                 >
//                   <TrendingUp className="h-4 w-4" style={{ color: riskColor }} />
//                 </div>
//                 <div>
//                   <span 
//                     className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wider block`}
//                     style={{ color: APP_COLORS.textSecondary }}
//                   >
//                     RISK LEVEL
//                   </span>
//                   <span 
//                     className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
//                     style={{ color: riskColor }}
//                   >
//                     {getRiskLabel(result.riskLevel)}
//                   </span>
//                 </div>
//               </div>
              
//               <div className="text-right">
//                 <div className="flex items-baseline gap-1">
//                   <span 
//                     className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold} leading-none`}
//                     style={{ color: riskColor }}
//                   >
//                     {result.riskScore}
//                   </span>
//                   <span 
//                     className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontFamily.mono}`}
//                     style={{ color: APP_COLORS.textSecondary }}
//                   >
//                     /100
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             {/* Fixed Progress Bar with proper color */}
//             <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${riskColor}20` }}>
//               <div
//                 className="h-full rounded-full transition-all duration-500"
//                 style={{
//                   width: `${result.riskScore}%`,
//                   backgroundColor: riskColor,
//                 }}
//               />
//             </div>
//           </div>

//           {/* Detection Rate */}
//           {result.engines && (
//             <div
//               className="p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01]"
//               style={{ 
//                 borderColor: `${APP_COLORS.border}`,
//               }}
//             >
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-2.5">
//                   <div
//                     className="w-2.5 h-2.5 rounded-full"
//                     style={{ 
//                       backgroundColor: result.engines.detected > 0 ? APP_COLORS.danger : APP_COLORS.success,
//                       boxShadow: `0 0 8px ${result.engines.detected > 0 ? APP_COLORS.danger : APP_COLORS.success}60`
//                     }}
//                   />
//                   <span 
//                     className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wider`}
//                     style={{ color: APP_COLORS.textSecondary }}
//                   >
//                     DETECTION RATE
//                   </span>
//                 </div>
                
//                 <Badge
//                   className={`${TYPOGRAPHY.label.xs} px-2.5 py-1`}
//                   style={{
//                     backgroundColor: result.engines.detected > 0 ? `${APP_COLORS.danger}20` : `${APP_COLORS.success}20`,
//                     color: result.engines.detected > 0 ? APP_COLORS.danger : APP_COLORS.success,
//                     border: `1px solid ${result.engines.detected > 0 ? APP_COLORS.danger : APP_COLORS.success}40`,
//                     fontWeight: 700,
//                   }}
//                 >
//                   {Math.round((result.engines.detected / result.engines.total) * 100)}%
//                 </Badge>
//               </div>
              
//               <div className="flex items-baseline gap-1.5">
//                 <span 
//                   className={`${TYPOGRAPHY.heading.h4} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
//                   style={{ color: APP_COLORS.textPrimary }}
//                 >
//                   {result.engines.detected}
//                 </span>
//                 <span 
//                   className={`${TYPOGRAPHY.body.sm}`}
//                   style={{ color: APP_COLORS.textSecondary }}
//                 >
//                   /
//                 </span>
//                 <span 
//                   className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontFamily.mono}`}
//                   style={{ color: APP_COLORS.textSecondary }}
//                 >
//                   {result.engines.total}
//                 </span>
//                 <span 
//                   className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium} ml-1`}
//                   style={{ color: APP_COLORS.textSecondary }}
//                 >
//                   engines
//                 </span>
//               </div>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
