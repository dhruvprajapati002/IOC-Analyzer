// 'use client';

// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Globe, Lock, Share2, Check, Loader2 } from 'lucide-react';
// import { toast } from 'sonner';
// import { useAuth } from '@/contexts/AuthContext';
// import { FEATURES } from '@/lib/features';

// interface ShareAnalysisButtonProps {
//   ioc: string;
//   onShareToggle?: (isPublic: boolean) => void;
// }

// export function ShareAnalysisButton({ ioc, onShareToggle }: ShareAnalysisButtonProps) {
//   // Early return if feature disabled
//   if (!FEATURES.SHARE_IOC_PUBLIC) {
//     return null;
//   }

//   const { token } = useAuth();
//   const [isPublic, setIsPublic] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [checking, setChecking] = useState(true);
//   const [justShared, setJustShared] = useState(false);

//   // Check current share status on mount
//   useEffect(() => {
//     const checkStatus = async () => {
//       if (!token || !ioc) {
//         setChecking(false);
//         return;
//       }

//       try {
//         const response = await fetch(`/api/ioc/share?ioc=${encodeURIComponent(ioc)}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           setIsPublic(data.isPublic || false);
//         }
//       } catch (error) {
//         console.error('Failed to check share status:', error);
//       } finally {
//         setChecking(false);
//       }
//     };

//     checkStatus();
//   }, [ioc, token]);

//   const handleToggleShare = async () => {
//     if (!token) {
//       toast.error('Not authenticated');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch('/api/ioc/share', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           ioc,
//           isPublic: !isPublic
//         })
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.details || 'Failed to toggle share status');
//       }

//       const data = await response.json();
//       const newStatus = !isPublic;
      
//       setIsPublic(newStatus);
//       setJustShared(newStatus);
      
//       if (newStatus) {
//         toast.success('Analysis shared publicly! 🌐', {
//           description: 'Other users can now view this analysis in the community feed'
//         });
//       } else {
//         toast.success('Analysis made private 🔒', {
//           description: 'Only you can view this analysis now'
//         });
//       }

//       onShareToggle?.(newStatus);

//       // Reset animation after 3 seconds
//       if (newStatus) {
//         setTimeout(() => setJustShared(false), 3000);
//       }

//     } catch (error) {
//       console.error('Share toggle error:', error);
//       toast.error(error instanceof Error ? error.message : 'Failed to update sharing settings');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (checking) {
//     return (
//       <Button variant="outline" size="default" disabled className="border-slate-600">
//         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//         Loading...
//       </Button>
//     );
//   }

//   return (
//     <Button
//       onClick={handleToggleShare}
//       disabled={loading}
//       variant={isPublic ? "default" : "outline"}
//       size="default"
//       className={`
//         transition-all duration-300
//         ${isPublic 
//           ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-green-500 shadow-lg shadow-green-500/20' 
//           : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500'
//         }
//         ${justShared ? 'animate-pulse scale-105' : ''}
//       `}
//       title={isPublic ? 'Click to make this analysis private' : 'Share this analysis with the community'}
//     >
//       {loading ? (
//         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//       ) : justShared ? (
//         <Check className="w-4 h-4 mr-2" />
//       ) : isPublic ? (
//         <Globe className="w-4 h-4 mr-2" />
//       ) : (
//         <Share2 className="w-4 h-4 mr-2" />
//       )}
//       {isPublic ? 'Public' : 'Share Publicly'}
//     </Button>
//   );
// }
