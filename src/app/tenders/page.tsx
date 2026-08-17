"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Gavel, Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye,
  Download, Calendar, Building2, Tag, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, FileUp, Check, DollarSign, MapPin, Mail, Phone, ExternalLink,
  MessageSquare, Bell, Clock, ShieldCheck, AlertCircle, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency, formatDate, formatRelativeTime, isOverdue } from '@/lib/utils';
import type { Tender, TenderStatus, TenderPriority, Clarification } from '@/lib/types';
import { TenderCreateSchema, type TenderCreateInput, type PaginationParams } from '@/lib/schemas';
import { useAppStore } from '@/stores/app.store';
import { useActivityStore } from '@/stores/activity.store';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { realtimeSync } from '@/lib/utils';
import { ExportMenu } from '@/components/ui/export-menu';

const STATUS_BADGE: Record<TenderStatus, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  open: 'success',
  closed: 'destructive',
  awarded: 'default',
  draft: 'secondary',
  submitted: 'warning',
  active: 'success',
  evaluating: 'warning',
  archived: 'secondary'
};

const PRIORITY_BADGE: Record<TenderPriority, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  critical: 'destructive'
};

function TendersPageContent() {
  const searchParams = useSearchParams();
  const addToast = useAppStore(s => s.addToast);
  const logActivity = useActivityStore(s => s.logActivity);

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tenders' | 'clarifications'>('tenders');

  const [selected, setSelected] = useState<Tender | null>(null);
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clarification Form State
  const [clarTenderId, setClarTenderId] = useState('');
  const [clarSubject, setClarSubject] = useState('');
  const [clarClause, setClarClause] = useState('');
  const [clarDetails, setClarDetails] = useState('');
  const [clarStage, setClarStage] = useState<'pre_bid' | 'corrigendum' | 'post_bid'>('pre_bid');
  const [clarStatus, setClarStatus] = useState<'pending' | 'submitted' | 'answered'>('submitted');
  const [clarReminderDate, setClarReminderDate] = useState(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));

  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'TENDER_MUTATED') {
        load();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    const action = searchParams.get('action');
    if (q) setSearch(q);
    if (action === 'create') setCreateOpen(true);
  }, [searchParams]);

  const load = async () => {
    if (!window.bidfly?.tender) return;
    setLoading(true);
    try {
      const params: any = { page, limit, sortBy: 'updatedAt', sortOrder: 'desc' };
      if (search) params.search = search;
      const f: Record<string, string> = {};
      if (statusFilter !== 'all') f.status = statusFilter;
      if (categoryFilter !== 'all') f.category = categoryFilter;
      if (Object.keys(f).length) params.filters = f;

      const res = await window.bidfly.tender.list(params);
      if (res.success && res.data) {
        setTenders(res.data.items);
        setTotal(res.data.total);
      }

      if (window.bidfly.clarification) {
        const cRes = await window.bidfly.clarification.list();
        if (cRes.success && cRes.data) setClarifications(cRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, statusFilter, categoryFilter, search]);

  const handleSaveClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarSubject.trim() || !clarClause.trim()) {
      addToast({ title: 'Validation Error', description: 'Subject and Clause Reference are required.', variant: 'error' });
      return;
    }
    const tObj = tenders.find(t => t.id === clarTenderId) || tenders[0];
    if (!tObj) return;

    if (window.bidfly?.clarification) {
      await window.bidfly.clarification.create({
        stage: clarStage,
        tenderId: tObj.id,
        tenderNumber: tObj.tenderNumber,
        tenderTitle: tObj.title,
        querySubject: clarSubject,
        clauseReference: clarClause,
        clarificationDetails: clarDetails,
        status: clarStatus,
        queryDate: new Date().toISOString(),
        reminderDate: clarReminderDate
      });
      addToast({ title: 'Clarification Logged', description: `${clarSubject} recorded for ${tObj.tenderNumber}`, variant: 'success' });
      setClarificationModalOpen(false);
      setClarSubject('');
      setClarClause('');
      setClarDetails('');
      load();
    }
  };

  const handleDelete = async () => {
    if (!tenderToDelete || !window.bidfly?.tender) return;
    const res = await window.bidfly.tender.delete(tenderToDelete.id);
    if (res.success) {
      logActivity('DELETE', 'Tender', tenderToDelete.tenderNumber, `Deleted tender ${tenderToDelete.title}`, tenderToDelete.id);
      realtimeSync.broadcast('TENDER_MUTATED');
      addToast({ title: 'Tender deleted', description: tenderToDelete.tenderNumber, variant: 'default' });
      setTenderToDelete(null);
      load();
    } else {
      addToast({ title: 'Delete failed', description: res.error, variant: 'error' });
    }
  };

  // 4 Summary Metrics (Section 3 of User Manual)
  const technicalStageCount = useMemo(() => tenders.filter(t => t.status === 'open' || t.status === 'evaluating').length, [tenders]);
  const financialStageCount = useMemo(() => tenders.filter(t => t.status === 'submitted').length, [tenders]);
  const awardedCount = useMemo(() => tenders.filter(t => t.status === 'awarded').length, [tenders]);

  const exportColumns = useMemo(() => [
    { header: 'Tender No', key: 'tenderNumber' },
    { header: 'Title', key: 'title' },
    { header: 'Organization / Dept', key: 'organization' },
    { header: 'Portal / Category', key: 'category' },
    { header: 'Estimated Value (₹)', key: 'value', formatter: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { header: 'EMD Amount (₹)', key: 'emdAmount', formatter: (v?: number) => v ? `₹${v.toLocaleString('en-IN')}` : '₹0' },
    { header: 'Status', key: 'status' },
    { header: 'Deadline', key: 'submissionDeadline', formatter: (v: string) => formatDate(v) }
  ], []);

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards (Section 3 of PDF User Manual) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Tenders</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{total || tenders.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Gavel className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Technical Stage</p>
              <p className="text-2xl font-black text-blue-500 mt-0.5">{technicalStageCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Financial Stage</p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">{financialStageCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Awarded Tenders</p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">{awardedCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs: Tenders Workspace vs Clarification & Addenda Tracker */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="tenders" className="gap-2 text-xs font-bold">
              <Gavel className="h-4 w-4" /> Tender Discovery & Lifecycle
            </TabsTrigger>
            <TabsTrigger value="clarifications" className="gap-2 text-xs font-bold">
              <MessageSquare className="h-4 w-4" /> Clarification & Addenda Tracker ({clarifications.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === 'tenders' ? (
              <>
                <Button
                  size="sm"
                  onClick={() => { setSelected(null); setCreateOpen(true); }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs text-xs h-8 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> [Add Tender]
                </Button>
                <ExportMenu
                  title="Tender_Lifecycle_Register"
                  columns={exportColumns}
                  data={tenders}
                  variant="outline"
                  className="h-8 text-xs font-semibold gap-1.5"
                />
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setClarTenderId(tenders[0]?.id || '');
                  setClarificationModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs text-xs h-8 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Log Pre-Bid Query / Corrigendum
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Tender Lifecycle Management */}
        <TabsContent value="tenders" className="space-y-4 mt-4">
          {/* Search & Category Filter Toolbar (Section 3 of User Manual) */}
          <div className="flex flex-wrap items-center gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tender title, reference number, department..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 h-8 text-xs bg-muted/40"
              />
            </div>

            {/* Portal / Category Filter */}
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Category Portal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portals & Sectors</SelectItem>
                <SelectItem value="GeM Portal">GeM Portal</SelectItem>
                <SelectItem value="CPPP Portal">CPPP Portal</SelectItem>
                <SelectItem value="State Water Works">State Water Works</SelectItem>
                <SelectItem value="Mechanical & Valves">Mechanical & Valves</SelectItem>
                <SelectItem value="Civil Works">Civil Works</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open / Live</SelectItem>
                <SelectItem value="evaluating">Under Evaluation</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="awarded">Awarded / Won</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tenders Grid Table */}
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading Tenders Workspace...</div>
          ) : tenders.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Gavel className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Tenders Found</h3>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or click [Add Tender] to record an opportunity.</p>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-4 text-xs font-bold gap-1.5">
                <Plus className="h-3.5 w-3.5" /> [Add Tender]
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenders.map(t => {
                const overdue = isOverdue(t.submissionDeadline) && t.status === 'open';
                return (
                  <Card key={t.id} className="border shadow-xs hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold">
                          {t.tenderNumber}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={PRIORITY_BADGE[t.priority] || 'secondary'} className="text-[9px] uppercase font-bold">
                            {t.priority}
                          </Badge>
                          <Badge variant={STATUS_BADGE[t.status] || 'default'} className="text-[9px] uppercase font-bold">
                            {t.status}
                          </Badge>
                        </div>
                      </div>

                      <CardTitle className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                        {t.title}
                      </CardTitle>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{t.organization}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimated Value</p>
                          <p className="font-bold text-foreground mt-0.5">{formatCurrency(t.value)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">EMD Guarantee</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {t.emdAmount ? formatCurrency(t.emdAmount) : '₹0 (Exempt)'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3.5 w-3.5" /> Deadline:
                          </span>
                          <span className={cn('font-bold', overdue ? 'text-destructive' : 'text-foreground')}>
                            {formatDate(t.submissionDeadline)}
                          </span>
                        </div>
                        {t.preBidDate && (
                          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                            <span>Pre-Bid Meeting:</span>
                            <span className="font-medium">{formatDate(t.preBidDate)}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelected(t); setViewOpen(true); }}
                          className="h-8 text-xs font-semibold text-primary"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View NIT Details
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setSelected(t); setCreateOpen(true); }}
                            title="Edit Tender"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setTenderToDelete(t)}
                            title="Delete Tender"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Clarification & Addenda Tracker (Section 4 of User Manual) */}
        <TabsContent value="clarifications" className="space-y-4 mt-4">
          <Card className="border shadow-xs">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Pre-Bid Queries, Departmental Corrigenda & Amendments
                </CardTitle>
                <CardDescription className="text-xs">
                  Record official queries submitted to tender committees, clause deviations, and published corrigenda
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setClarTenderId(tenders[0]?.id || '');
                  setClarificationModalOpen(true);
                }}
                className="text-xs font-bold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> + New Query / Corrigendum
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-3">Stage / Type</th>
                      <th className="p-3">Tender Ref</th>
                      <th className="p-3">Clause Reference</th>
                      <th className="p-3">Subject & Query Details</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reminder Date</th>
                      <th className="p-3">Authority Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clarifications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No pre-bid queries or corrigenda logged. Click "+ New Query" above to track queries.
                        </td>
                      </tr>
                    ) : (
                      clarifications.map(c => (
                        <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <Badge variant="outline" className="uppercase text-[9px] font-bold">
                              {c.stage.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono font-bold text-foreground">
                            {c.tenderNumber}
                          </td>
                          <td className="p-3 font-semibold text-primary">
                            {c.clauseReference}
                          </td>
                          <td className="p-3 max-w-xs">
                            <p className="font-bold text-foreground">{c.querySubject}</p>
                            {c.clarificationDetails && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{c.clarificationDetails}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={c.status === 'answered' ? 'success' : c.status === 'submitted' ? 'warning' : 'secondary'}
                              className="text-[10px] uppercase font-bold"
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground font-medium">
                            {formatDate(c.reminderDate)}
                          </td>
                          <td className="p-3">
                            {c.authorityResponse ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded">
                                {c.authorityResponse}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Awaiting Committee Response</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Pre-Bid Query / Corrigendum Modal */}
      <Dialog open={clarificationModalOpen} onOpenChange={setClarificationModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Log Clarification / Corrigendum</DialogTitle>
            <DialogDescription className="text-xs">
              Track pre-bid queries sent to issuing authorities and official corrigenda amendments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveClarification} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Associated Tender *</Label>
              <Select value={clarTenderId} onValueChange={setClarTenderId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Tender" /></SelectTrigger>
                <SelectContent>
                  {tenders.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.tenderNumber} - {t.title.slice(0, 40)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stage / Type</Label>
                <Select value={clarStage} onValueChange={(v: any) => setClarStage(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_bid">Pre-Bid Query</SelectItem>
                    <SelectItem value="corrigendum">Departmental Corrigendum</SelectItem>
                    <SelectItem value="post_bid">Post-Bid Query</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={clarStatus} onValueChange={(v: any) => setClarStatus(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Drafting</SelectItem>
                    <SelectItem value="submitted">Submitted to Dept</SelectItem>
                    <SelectItem value="answered">Answered / Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Query Clause Reference *</Label>
              <Input
                placeholder="e.g. Section IV - Technical Specs Clause 4.2.1"
                value={clarClause}
                onChange={e => setClarClause(e.target.value)}
                className="h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject *</Label>
              <Input
                placeholder="e.g. Deviation on Inspection Agency Certification"
                value={clarSubject}
                onChange={e => setClarSubject(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Detailed Clarification Scope</Label>
              <Textarea
                placeholder="Enter query details, justification, and suggested amendment text..."
                value={clarDetails}
                onChange={e => setClarDetails(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Follow-up / Reminder Date</Label>
              <Input
                type="date"
                value={clarReminderDate}
                onChange={e => setClarReminderDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setClarificationModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold text-xs">
                Save Clarification Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Tender Modal */}
      <TenderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={selected}
        onSaved={() => { setCreateOpen(false); setSelected(null); load(); }}
      />

      {/* View NIT Details Modal */}
      <TenderViewDialog
        tender={selected}
        open={viewOpen}
        onOpenChange={setViewOpen}
        onEdit={t => { setViewOpen(false); setSelected(t); setCreateOpen(true); }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={!!tenderToDelete}
        onOpenChange={v => { if (!v) setTenderToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Tender Record?"
        description={`Are you sure you want to delete ${tenderToDelete?.tenderNumber}? All associated bids, clarifications, and datasheet records will be affected.`}
      />
    </div>
  );
}

function TenderFormDialog({
  open, onOpenChange, initial, onSaved
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Tender | null;
  onSaved: () => void;
}) {
  const addToast = useAppStore(s => s.addToast);
  const logActivity = useActivityStore(s => s.logActivity);
  const isEdit = !!initial;

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch
  } = useForm<any>({
    resolver: zodResolver(TenderCreateSchema) as any,
    defaultValues: {
      tenderNumber: '',
      title: '',
      description: '',
      organization: '',
      departmentName: '',
      category: 'Mechanical & Valves',
      portal: 'GeM Portal',
      value: 0,
      emdAmount: 0,
      preBidDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
      currency: 'INR',
      status: 'draft',
      priority: 'medium',
      publishDate: new Date().toISOString().slice(0, 16),
      submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
      submissionLocation: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      documents: [],
      tags: [],
      notes: ''
    }
  });

  useEffect(() => {
    if (open && initial) {
      setValue('tenderNumber', initial.tenderNumber);
      setValue('title', initial.title);
      setValue('description', initial.description || '');
      setValue('organization', initial.organization);
      setValue('departmentName', initial.departmentName || initial.organization);
      setValue('category', initial.category);
      setValue('portal', initial.portal || 'GeM Portal');
      setValue('value', initial.value);
      setValue('emdAmount', initial.emdAmount || Math.round(initial.value * 0.02));
      setValue('currency', initial.currency);
      setValue('status', initial.status as any);
      setValue('priority', initial.priority);
      setValue('publishDate', initial.publishDate.slice(0, 16));
      setValue('submissionDeadline', initial.submissionDeadline.slice(0, 16));
      setValue('preBidDate', initial.preBidDate ? initial.preBidDate.slice(0, 16) : '');
      setValue('submissionLocation', initial.submissionLocation || '');
      setValue('contactPerson', initial.contactPerson || '');
      setValue('contactEmail', initial.contactEmail || '');
      setValue('contactPhone', initial.contactPhone || '');
      setValue('notes', initial.notes || '');
    } else if (open) {
      reset({
        tenderNumber: `GEM/${new Date().getFullYear()}/B/${Math.floor(100000 + Math.random() * 900000)}`,
        title: '',
        description: '',
        organization: '',
        departmentName: '',
        category: 'Mechanical & Valves',
        portal: 'GeM Portal',
        value: 0,
        emdAmount: 0,
        currency: 'INR',
        status: 'open',
        priority: 'medium',
        publishDate: new Date().toISOString().slice(0, 16),
        submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
        preBidDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        submissionLocation: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        documents: [],
        tags: [],
        notes: ''
      });
    }
  }, [open, initial]);

  async function onSubmit(data: any) {
    try {
      if (!window.bidfly?.tender) return;
      let res;
      if (isEdit && initial) {
        res = await window.bidfly.tender.update({ ...data, id: initial.id });
      } else {
        res = await window.bidfly.tender.create(data);
      }
      if (res?.success) {
        logActivity(
          isEdit ? 'UPDATE' : 'CREATE',
          'Tender',
          data.tenderNumber,
          `${isEdit ? 'Updated' : 'Created'} tender "${data.title}" for ${data.organization}`,
          isEdit ? initial?.id : (res.data as any)?.id
        );
        realtimeSync.broadcast('TENDER_MUTATED');
        addToast({
          title: isEdit ? 'Tender updated' : 'Tender created',
          description: data.title,
          variant: 'success'
        });
        onSaved();
      } else {
        addToast({ title: 'Save failed', description: res?.error, variant: 'error' });
      }
    } catch (e) {
      addToast({ title: 'Unexpected error', variant: 'error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tender Master Record' : 'Create New Tender Record'}</DialogTitle>
          <DialogDescription>
            Enter tender metadata, reference numbers, EMD amount, pre-bid dates, and submission deadline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Reference No (GeM/CPPP ID) *</Label>
                  <Input {...register('tenderNumber')} className="h-8 text-xs font-mono font-bold" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Issuing Organization *</Label>
                  <Input {...register('organization')} placeholder="e.g. NTPC Ltd" className="h-8 text-xs" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Department / Division</Label>
                  <Input {...register('departmentName')} placeholder="e.g. Mechanical Circle" className="h-8 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tender Title / Scope *</Label>
                <Input {...register('title')} placeholder="e.g. Supply and Commissioning of Class 300 Valves" className="h-8 text-xs" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Estimated Value (₹) *</Label>
                  <Input type="number" {...register('value', { valueAsNumber: true })} className="h-8 text-xs font-bold" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">EMD Amount (₹)</Label>
                  <Input type="number" {...register('emdAmount', { valueAsNumber: true })} className="h-8 text-xs font-bold text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Portal / Category</Label>
                  <Select value={watch('category')} onValueChange={v => setValue('category', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mechanical & Valves">Mechanical & Valves</SelectItem>
                      <SelectItem value="Civil Works">Civil Works</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="State Water Works">State Water Works</SelectItem>
                      <SelectItem value="IT & Software">IT & Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Pre-Bid Meeting Date</Label>
                  <Input type="datetime-local" {...register('preBidDate')} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Submission Deadline *</Label>
                  <Input type="datetime-local" {...register('submissionDeadline')} className="h-8 text-xs font-bold text-destructive" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tender Status</Label>
                  <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="evaluating">Under Evaluation</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="awarded">Awarded</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Technical Description & Scope</Label>
                <Textarea rows={3} {...register('description')} className="text-xs" />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold text-xs">
              {isEdit ? 'Save Changes' : 'Create Tender'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TenderViewDialog({ tender, open, onOpenChange, onEdit }: { tender: Tender | null; open: boolean; onOpenChange: (v: boolean) => void; onEdit: (t: Tender) => void }) {
  if (!tender) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono font-bold text-xs">{tender.tenderNumber}</Badge>
            <Badge variant={STATUS_BADGE[tender.status] || 'default'} className="uppercase text-[10px] font-bold">
              {tender.status}
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold mt-2">{tender.title}</DialogTitle>
          <DialogDescription className="text-xs">{tender.organization} • {tender.category}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimated Value</p>
              <p className="font-bold text-foreground mt-0.5">{formatCurrency(tender.value)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">EMD Deposit</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {tender.emdAmount ? formatCurrency(tender.emdAmount) : 'Exempt'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Deadline</p>
              <p className="font-bold text-destructive mt-0.5">{formatDate(tender.submissionDeadline)}</p>
            </div>
          </div>

          <div>
            <p className="font-bold text-muted-foreground uppercase text-[10px]">Scope of Work</p>
            <p className="mt-1 text-foreground leading-relaxed bg-card p-3 rounded-lg border">{tender.description || 'No detailed scope attached.'}</p>
          </div>

          {tender.notes && (
            <div>
              <p className="font-bold text-muted-foreground uppercase text-[10px]">Internal Notes</p>
              <p className="mt-1 text-muted-foreground italic bg-muted/30 p-2.5 rounded-lg">{tender.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          <Button size="sm" onClick={() => onEdit(tender)} className="font-bold text-xs gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit Tender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TendersPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading Tenders Workspace...</div>}>
      <TendersPageContent />
    </Suspense>
  );
}
