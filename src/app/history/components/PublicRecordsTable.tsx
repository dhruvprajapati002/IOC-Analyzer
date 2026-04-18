// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Search, RefreshCw, Globe, Eye, User, Clock, TrendingUp, Filter, CheckCircle, AlertTriangle, FileText, BarChart3 } from 'lucide-react';
// import { format as formatDate } from 'date-fns';
// import Link from 'next/link';
// import { apiFetch } from '@/lib/apiFetch';

// interface PublicRecord {
//   id: string;
//   ioc: string;
//   type: string;
//   username: string;
//   sharedAt: string;
//   fetchedAt: string;
//   verdict: string;
//   stats: {
//     malicious: number;
//     suspicious: number;
//     harmless: number;
//     undetected: number;
//   };
//   threatTypes: string[];
//   severity: string;
//   popularThreatLabel: string | null;
//   familyLabels: string[];
//   label: string | null;
// }

// interface PaginationData {
//   currentPage: number;
//   totalPages: number;
//   totalCount: number;
//   hasNextPage: boolean;
//   hasPrevPage: boolean;
//   limit: number;
// }

// export function PublicRecordsTable() {
//   const { token } = useAuth();
//   const [records, setRecords] = useState<PublicRecord[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [pagination, setPagination] = useState<PaginationData | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [typeFilter, setTypeFilter] = useState<string>('all');
//   const [verdictFilter, setVerdictFilter] = useState<string>('all');
//   const [severityFilter, setSeverityFilter] = useState<string>('all');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
//   const [justRefreshed, setJustRefreshed] = useState(false);
//   const [stats, setStats] = useState<any>(null);
//   const itemsPerPage = 10;

//   // Fetch public records
//   const fetchPublicRecords = async () => {
//     setLoading(true);
//     try {
//       const searchParams = new URLSearchParams({
//         page: currentPage.toString(),
//         limit: itemsPerPage.toString(),
//         sortBy: 'sharedAt',
//         sortOrder: 'desc'
//       });

//       if (searchQuery) searchParams.set('search', searchQuery);
//       if (typeFilter !== 'all') searchParams.set('type', typeFilter);
//       if (verdictFilter !== 'all') searchParams.set('verdict', verdictFilter);
//       if (severityFilter !== 'all') searchParams.set('severity', severityFilter);

//       const response = await apiFetch(`/api/history/public?${searchParams}`);

//       if (response.ok) {
//         const data = await response.json();
//         setRecords(data.data.records);
//         setPagination(data.data.pagination);
        
//         // Calculate stats from records
//         const statsData = {
//           total: data.data.pagination.totalCount,
//           byVerdict: {
//             malicious: 0,
//             suspicious: 0,
//             harmless: 0,
//             undetected: 0
//           }
//         };
        
//         data.data.records.forEach((r: PublicRecord) => {
//           if (r.verdict === 'malicious') statsData.byVerdict.malicious++;
//           else if (r.verdict === 'suspicious') statsData.byVerdict.suspicious++;
//           else if (r.verdict === 'harmless') statsData.byVerdict.harmless++;
//           else statsData.byVerdict.undetected++;
//         });
        
//         setStats(statsData);
//         setLastRefresh(new Date());
        
//         // Show success animation
//         setJustRefreshed(true);
//         setTimeout(() => setJustRefreshed(false), 2000);
//       }
//     } catch (error) {
//       console.error('Failed to fetch public records:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPublicRecords();
//   }, [currentPage, typeFilter, verdictFilter, severityFilter]);

//   // Debounced search
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (currentPage === 1) {
//         fetchPublicRecords();
//       } else {
//         setCurrentPage(1);
//       }
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   const getVerdictBadge = (verdict: string) => {
//     const config = {
//       malicious: { 
//         label: 'Malicious',
//         className: 'bg-t-danger/10 text-t-dangerLight border-t-danger/30 font-medium'
//       },
//       suspicious: { 
//         label: 'Suspicious',
//         className: 'bg-t-warning/10 text-t-warning border-t-warning/30 font-medium'
//       },
//       harmless: { 
//         label: 'Clean',
//         className: 'bg-t-success/10 text-t-success border-t-success/30 font-medium'
//       },
//       undetected: { 
//         label: 'Undetected',
//         className: 'bg-t-surfaceMuted/10 text-t-textMuted border-t-border/30 font-medium'
//       },
//     };
//     const { label, className } = config[verdict as keyof typeof config] || config.undetected;
//     return <Badge variant="outline" className={className}>{label}</Badge>;
//   };

//   const getSeverityColor = (severity: string) => {
//     const colors = {
//       critical: 'text-t-dangerLight',
//       high: 'text-t-warning',
//       medium: 'text-t-accentYellow',
//       low: 'text-t-info',
//       unknown: 'text-t-textMuted',
//     };
//     return colors[severity as keyof typeof colors] || 'text-t-textMuted';
//   };

//   // Calculate time since last refresh
//   const getTimeSinceRefresh = () => {
//     const seconds = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000);
//     if (seconds < 60) return `${seconds}s ago`;
//     const minutes = Math.floor(seconds / 60);
//     if (minutes < 60) return `${minutes}m ago`;
//     const hours = Math.floor(minutes / 60);
//     return `${hours}h ago`;
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-gradient-to-br from-t-success/20 to-t-primary/20 rounded-lg border border-t-success/30">
//             <Globe className="h-6 w-6 text-t-success" />
//           </div>
//           <div>
//             <h2 className="text-2xl font-bold text-t-textPrimary">Public Community Feed</h2>
//             <p className="text-sm text-t-textMuted">
//               {pagination ? `${pagination.totalCount} shared analyses from the community` : 'Loading...'}
//             </p>
//           </div>
//         </div>

//         {/* Enhanced Refresh Button */}
//         <div className="flex items-center gap-3">
//           {/* Last Refresh Time */}
//           <div className="hidden sm:flex flex-col items-end">
//             <span className="text-xs text-t-textMuted">Last updated</span>
//             <span className="text-xs text-t-textMuted font-medium">{getTimeSinceRefresh()}</span>
//           </div>

//           {/* Refresh Button */}
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={fetchPublicRecords}
//             disabled={loading}
//             className={`
//               border-t-border bg-t-surface/50 hover:bg-t-surfaceAlt transition-all duration-300
//               ${justRefreshed ? 'border-t-success/50 bg-t-success/10' : ''}
//               ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
//             `}
//           >
//             {justRefreshed ? (
//               <>
//                 <CheckCircle className="h-4 w-4 mr-2 text-t-success" />
//                 <span className="text-t-success">Updated</span>
//               </>
//             ) : (
//               <>
//                 <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
//                 Refresh
//               </>
//             )}
//           </Button>
//         </div>
//       </div>

//       {/* Filters */}
//       <Card className="bg-t-surface/50 border-t-border backdrop-blur-sm">
//         <CardHeader className="pb-4">
//           <div className="flex items-center gap-2">
//             <Filter className="h-5 w-5 text-t-success" />
//             <CardTitle className="text-t-textPrimary text-sm font-semibold">Filter Public Analyses</CardTitle>
//           </div>
//           <CardDescription className="text-t-textMuted text-xs">
//             Refine community shared IOCs
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-col gap-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-t-textMuted" />
//               <Input
//                 placeholder="Search IOCs or usernames..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 bg-t-bg/50 border-t-border text-t-textPrimary placeholder:text-t-textMuted focus:border-t-primary transition-colors"
//               />
//             </div>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//               <Select value={typeFilter} onValueChange={setTypeFilter}>
//                 <SelectTrigger className="bg-t-bg/50 border-t-border text-t-textPrimary">
//                   <SelectValue placeholder="All Types" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-t-surface border-t-border">
//                   <SelectItem value="all">All Types</SelectItem>
//                   <SelectItem value="ip">IP Address</SelectItem>
//                   <SelectItem value="domain">Domain</SelectItem>
//                   <SelectItem value="url">URL</SelectItem>
//                   <SelectItem value="hash">Hash</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select value={verdictFilter} onValueChange={setVerdictFilter}>
//                 <SelectTrigger className="bg-t-bg/50 border-t-border text-t-textPrimary">
//                   <SelectValue placeholder="All Verdicts" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-t-surface border-t-border">
//                   <SelectItem value="all">All Verdicts</SelectItem>
//                   <SelectItem value="malicious">Malicious</SelectItem>
//                   <SelectItem value="suspicious">Suspicious</SelectItem>
//                   <SelectItem value="harmless">Clean</SelectItem>
//                   <SelectItem value="undetected">Undetected</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select value={severityFilter} onValueChange={setSeverityFilter}>
//                 <SelectTrigger className="bg-t-bg/50 border-t-border text-t-textPrimary">
//                   <SelectValue placeholder="All Severities" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-t-surface border-t-border">
//                   <SelectItem value="all">All Severities</SelectItem>
//                   <SelectItem value="critical">Critical</SelectItem>
//                   <SelectItem value="high">High</SelectItem>
//                   <SelectItem value="medium">Medium</SelectItem>
//                   <SelectItem value="low">Low</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Results Table with Stats Bar */}
//       <Card className="bg-t-surface/50 border-t-border backdrop-blur-sm">
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <div className="flex items-center gap-2 mb-1">
//                 <BarChart3 className="h-5 w-5 text-t-success" />
//                 <CardTitle className="text-t-textPrimary font-semibold">Community Shared Analyses</CardTitle>
//               </div>
//               <CardDescription className="text-t-textMuted text-sm">
//                 {pagination ? (
//                   <>Showing <span className="text-t-textPrimary font-medium">{records.length}</span> of <span className="text-t-textPrimary font-medium">{pagination.totalCount}</span> public records</>
//                 ) : (
//                   'Loading...'
//                 )}
//               </CardDescription>
//             </div>
//             {loading && (
//               <RefreshCw className="h-5 w-5 animate-spin text-t-success" />
//             )}
//           </div>

//           {/* Inline Stats Bar - Above Table */}
//           {stats && (
//             <div className="grid grid-cols-5 gap-3 p-4 bg-t-bg/50 rounded-lg border border-t-border/50">
//               {/* Total Records */}
//               <div className="flex items-center gap-3 px-3 py-2 bg-t-success/5 rounded-lg border border-t-success/20">
//                 <div className="p-2 bg-t-success/10 rounded">
//                   <Globe className="h-4 w-4 text-t-success" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-t-textPrimary">{stats.total}</div>
//                   <p className="text-xs text-t-success/70 font-medium">Total Shared</p>
//                 </div>
//               </div>

//               {/* Malicious */}
//               <div className="flex items-center gap-3 px-3 py-2 bg-t-danger/5 rounded-lg border border-t-danger/20">
//                 <div className="p-2 bg-t-danger/10 rounded">
//                   <AlertTriangle className="h-4 w-4 text-t-dangerLight" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-t-dangerLight">{stats.byVerdict.malicious || 0}</div>
//                   <p className="text-xs text-t-dangerLight/70 font-medium">Malicious</p>
//                 </div>
//               </div>

//               {/* Suspicious */}
//               <div className="flex items-center gap-3 px-3 py-2 bg-t-warning/5 rounded-lg border border-t-warning/20">
//                 <div className="p-2 bg-t-warning/10 rounded">
//                   <AlertTriangle className="h-4 w-4 text-t-warning" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-t-warning">{stats.byVerdict.suspicious || 0}</div>
//                   <p className="text-xs text-t-warning/70 font-medium">Suspicious</p>
//                 </div>
//               </div>

//               {/* Clean */}
//               <div className="flex items-center gap-3 px-3 py-2 bg-t-success/5 rounded-lg border border-t-success/20">
//                 <div className="p-2 bg-t-success/10 rounded">
//                   <CheckCircle className="h-4 w-4 text-t-success" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-t-success">{stats.byVerdict.harmless || 0}</div>
//                   <p className="text-xs text-t-success/70 font-medium">Clean</p>
//                 </div>
//               </div>

//               {/* Undetected */}
//               <div className="flex items-center gap-3 px-3 py-2 bg-t-surfaceMuted/20 rounded-lg border border-t-border/30">
//                 <div className="p-2 bg-t-surfaceMuted/10 rounded">
//                   <Search className="h-4 w-4 text-t-textMuted" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-t-textSecondary">{stats.byVerdict.undetected || 0}</div>
//                   <p className="text-xs text-t-textMuted font-medium">Undetected</p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </CardHeader>

//         <CardContent className="p-0">
//           {/* Scrollable Table Container with Sticky Header */}
//           <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
//             <Table>
//               <TableHeader className="bg-t-bg/90 sticky top-0 z-10 backdrop-blur-sm">
//                 <TableRow className="hover:bg-t-bg/90 border-t-border">
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">IOC</TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">Type</TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">Verdict</TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">
//                     <div className="flex items-center gap-1">
//                       <span>Threats</span>
//                       <Badge variant="outline" className="text-[10px] bg-t-danger/10 text-t-dangerLight border-t-danger/30 ml-1">
//                         M/S
//                       </Badge>
//                     </div>
//                   </TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">Severity</TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">Shared By</TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold bg-t-bg/90">Shared</TableHead>
//                   <TableHead className="text-t-textSecondary font-semibold text-right bg-t-bg/90">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {loading && records.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-16">
//                       <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-t-success" />
//                       <p className="text-t-textMuted font-medium">Loading public analyses...</p>
//                     </TableCell>
//                   </TableRow>
//                 ) : records.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-16 text-t-textMuted">
//                       <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
//                       <p className="text-lg font-medium mb-2">No Public Analyses Yet</p>
//                       <p className="text-sm">Be the first to share your analysis with the community!</p>
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   records.map((record) => (
//                     <TableRow key={record.id} className="hover:bg-t-surfaceAlt/30 border-t-border/50 transition-colors">
//                       <TableCell className="font-mono text-sm text-t-info max-w-xs">
//                         <div className="flex items-center gap-2">
//                           <span className="truncate">{record.ioc}</span>
//                           {record.popularThreatLabel && (
//                             <Badge variant="secondary" className="text-[10px] shrink-0 bg-t-accentViolet/10 text-t-accentViolet border-t-accentViolet/30">
//                               {record.popularThreatLabel}
//                             </Badge>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <Badge variant="outline" className="uppercase text-xs bg-t-surfaceAlt/50 text-t-textSecondary border-t-border">
//                           {record.type}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {getVerdictBadge(record.verdict)}
//                       </TableCell>
//                       <TableCell>
//                         {/* Compact Threat Count Display */}
//                         <div className="flex items-center gap-2">
//                           {record.stats.malicious > 0 && (
//                             <div className="flex items-center gap-1.5 bg-t-danger/10 px-2 py-1 rounded border border-t-danger/20">
//                               <div className="w-1.5 h-1.5 bg-t-danger rounded-full" />
//                               <span className="text-xs text-t-dangerLight font-bold">{record.stats.malicious}</span>
//                               <span className="text-[10px] text-t-dangerLight/70 font-medium">M</span>
//                             </div>
//                           )}
//                           {record.stats.suspicious > 0 && (
//                             <div className="flex items-center gap-1.5 bg-t-warning/10 px-2 py-1 rounded border border-t-warning/20">
//                               <div className="w-1.5 h-1.5 bg-t-warning rounded-full" />
//                               <span className="text-xs text-t-warning font-bold">{record.stats.suspicious}</span>
//                               <span className="text-[10px] text-t-warning/70 font-medium">S</span>
//                             </div>
//                           )}
//                           {record.stats.malicious === 0 && record.stats.suspicious === 0 && (
//                             <div className="flex items-center gap-1.5">
//                               <CheckCircle className="w-3.5 h-3.5 text-t-success" />
//                               <span className="text-xs text-t-success font-medium">Clean</span>
//                             </div>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center gap-1">
//                           <TrendingUp className={`h-3 w-3 ${getSeverityColor(record.severity)}`} />
//                           <span className={`text-xs font-medium capitalize ${getSeverityColor(record.severity)}`}>
//                             {record.severity}
//                           </span>
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center gap-2">
//                           <div className="w-6 h-6 bg-gradient-to-br from-t-info/20 to-t-accentViolet/20 rounded-full flex items-center justify-center border border-t-info/30">
//                             <User className="h-3 w-3 text-t-info" />
//                           </div>
//                           <span className="text-sm text-t-textSecondary font-medium">{record.username}</span>
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center gap-2 text-sm text-t-textMuted">
//                           <Clock className="h-3.5 w-3.5" />
//                           {formatDate(new Date(record.sharedAt), 'MMM d, HH:mm')}
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-right">
//                         <Link href={`/analyze?q=${encodeURIComponent(record.ioc)}`}>
//                           <Button 
//                             size="sm" 
//                             variant="ghost" 
//                             className="h-9 px-3 hover:bg-t-surfaceAlt/50 text-t-success hover:text-t-primary"
//                           >
//                             <Eye className="h-4 w-4 mr-1.5" />
//                             View
//                           </Button>
//                         </Link>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>

//           {/* Pagination */}
//           {pagination && pagination.totalPages > 1 && (
//             <div className="flex items-center justify-between px-6 py-4 border-t border-t-border/50 bg-t-bg/30">
//               <div className="text-sm text-t-textMuted">
//                 Page <span className="text-t-textPrimary font-semibold">{pagination.currentPage}</span> of{' '}
//                 <span className="text-t-textPrimary font-semibold">{pagination.totalPages}</span>
//                 <span className="hidden sm:inline"> ({pagination.totalCount} total records)</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//                   disabled={!pagination.hasPrevPage || loading}
//                   className="bg-t-surface/50 border-t-border hover:bg-t-surfaceAlt disabled:opacity-50"
//                 >
//                   Previous
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setCurrentPage(prev => prev + 1)}
//                   disabled={!pagination.hasNextPage || loading}
//                   className="bg-t-surface/50 border-t-border hover:bg-t-surfaceAlt disabled:opacity-50"
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
