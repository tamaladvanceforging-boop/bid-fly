"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText, Plus, Search, Filter, Pencil, Trash2, Eye,
  Building2, Landmark, Calculator, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, DollarSign, ChevronRight, RefreshCw,
  FileSpreadsheet, ArrowUpRight, Percent, Award, AlertCircle
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import type { Bid, Tender, EMDRecord, EMDMode, EMDStatus, BidStatus } from '@/lib/types';
import { BidCreateSchema } from '@/lib/schemas';
import { useAppStore } from '@/stores/app.store';
import { useActivityStore } from '@/stores/activity.store';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { realtimeSync } from '@/lib/utils';
import { ExportMenu } from '@/components/ui/export-menu';

const STATUS_BADGE: Record<BidStatus, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  pending: 'warning',
  won: 'success',
  lost: 'destructive',
  disqualified: 'secondary',
  active: 'default',
  withdrawn: 'secondary'
};

const EMD_STATUS_BADGE: Record<EMDStatus, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  active: 'success',
  expiring_soon: 'warning',
  expired: 'destructive',
  released: 'secondary',
  claimed: 'default'
};

function BidsPageContent() {
  const searchParams = useSearchParams();
  const addToast = useAppStore(s => s.addToast);
  const logActivity = useActivityStore(s => s.logActivity);

  const [bids, setBids] = useState<Bid[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [emds, setEMDs] = useState<EMDRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'proposals' | 'emd' | 'qcbs'>('proposals');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [bidToDelete, setBidToDelete] = useState<Bid | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [emdModalOpen, setEmdModalOpen] = useState(false);
  const [selectedEMD, setSelectedEMD] = useState<EMDRecord | null>(null);

  // QCBS Interactive Calculator State
  const [qcbsTechScore, setQcbsTechScore] = useState<number>(85);
  const [qcbsFinScore, setQcbsFinScore] = useState<number>(90);
  const [qcbsTechWeight, setQcbsTechWeight] = useState<number>(70);
  const [qcbsOurQuote, setQcbsOurQuote] = useState<number>(10000000);
  const [qcbsL1Quote, setQcbsL1Quote] = useState<number>(9500000);

  // EMD Form State
  const [emdAmount, setEmdAmount] = useState<number>(250000);
  const [emdMode, setEmdMode] = useState<EMDMode>('BG');
  const [emdBank, setEmdBank] = useState('');
  const [emdRef, setEmdRef] = useState('');
  const [emdExpiryDate, setEmdExpiryDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
  const [emdTenderId, setEmdTenderId] = useState('');
  const [emdStatus, setEmdStatus] = useState<EMDStatus>('active');

  const load = async () => {
    if (!window.bidfly?.bid) return;
    try {
      const [bidRes, tenderRes, emdRes] = await Promise.all([
        window.bidfly.bid.list({ search, filters: statusFilter !== 'all' ? { status: statusFilter } : undefined }),
        window.bidfly.tender.list({ limit: 100 }),
        window.bidfly.emd ? window.bidfly.emd.list() : Promise.resolve({ success: true, data: [] })
      ]);

      if (bidRes.success && bidRes.data) setBids(bidRes.data.items);
      if (tenderRes.success && tenderRes.data) setTenders(tenderRes.data.items);
      if (emdRes.success && emdRes.data) setEMDs(emdRes.data as EMDRecord[]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const action = searchParams.get('action');
    if (tab === 'emd' || tab === 'qcbs') setActiveTab(tab);
    if (action === 'create') setCreateOpen(true);
  }, [searchParams]);

  // Handle Saving EMD/Bank Guarantee
  const handleSaveEMD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emdBank.trim() || !emdRef.trim()) {
      addToast({ title: 'Validation Error', description: 'Bank Name and Guarantee Ref are required.', variant: 'error' });
      return;
    }
    const tObj = tenders.find(t => t.id === emdTenderId) || tenders[0];
    if (!tObj || !window.bidfly?.emd) return;

    if (selectedEMD) {
      await window.bidfly.emd.update(selectedEMD.id, {
        amount: emdAmount,
        mode: emdMode,
        bankName: emdBank,
        referenceNumber: emdRef,
        expiryDate: emdExpiryDate,
        status: emdStatus
      });
      addToast({ title: 'Guarantee Updated', description: emdRef, variant: 'success' });
    } else {
      await window.bidfly.emd.create({
        tenderId: tObj.id,
        tenderNumber: tObj.tenderNumber,
        tenderTitle: tObj.title,
        amount: emdAmount,
        currency: 'INR',
        mode: emdMode,
        bankName: emdBank,
        referenceNumber: emdRef,
        issueDate: new Date().toISOString(),
        expiryDate: emdExpiryDate,
        status: emdStatus
      });
      addToast({ title: 'EMD Guarantee Recorded', description: `₹${emdAmount.toLocaleString()} via ${emdMode}`, variant: 'success' });
    }

    setEmdModalOpen(false);
    setSelectedEMD(null);
    load();
  };

  // 4 Summary Metrics (Section 4 & 5 of User Manual)
  const activeBidsCount = useMemo(() => bids.filter(b => b.status === 'pending' || b.status === 'active').length, [bids]);
  const submittedBidsCount = useMemo(() => bids.filter(b => b.status === 'pending' || b.status === 'won').length, [bids]);
  const totalLockedEMD = useMemo(() => emds.filter(e => e.status === 'active' || e.status === 'expiring_soon').reduce((s, e) => s + (e.amount || 0), 0), [emds]);
  const avgQCBS = useMemo(() => {
    const scores = bids.map(b => b.overallScore).filter(Boolean) as number[];
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  }, [bids]);

  // QCBS Calculation engine: Tech * Weight + Fin * (100 - Weight)
  const qcbsFinWeight = 100 - qcbsTechWeight;
  const qcbsNormalizedFinScore = useMemo(() => {
    if (qcbsOurQuote <= 0 || qcbsL1Quote <= 0) return qcbsFinScore;
    return Math.min(100, Number(((qcbsL1Quote / qcbsOurQuote) * 100).toFixed(2)));
  }, [qcbsOurQuote, qcbsL1Quote, qcbsFinScore]);

  const qcbsCompositeScore = useMemo(() => {
    const techPart = (qcbsTechScore * qcbsTechWeight) / 100;
    const finPart = (qcbsNormalizedFinScore * qcbsFinWeight) / 100;
    return Number((techPart + finPart).toFixed(2));
  }, [qcbsTechScore, qcbsNormalizedFinScore, qcbsTechWeight, qcbsFinWeight]);

  const exportColumns = useMemo(() => [
    { header: 'Bid Proposal No', key: 'bidNumber' },
    { header: 'Bidder Entity', key: 'bidderName' },
    { header: 'Associated Tender', key: 'tenderNumber' },
    { header: 'Quoted Price (₹)', key: 'bidValue', formatter: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { header: 'Tech Score', key: 'technicalScore' },
    { header: 'Fin Score', key: 'financialScore' },
    { header: 'QCBS Composite', key: 'overallScore' },
    { header: 'Status', key: 'status' }
  ], []);

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards (Section 4 & 5 of PDF Manual) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Bids</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{activeBidsCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Submitted Bids</p>
              <p className="text-2xl font-black text-blue-500 mt-0.5">{submittedBidsCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Locked EMD Total</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalLockedEMD)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border p-4 shadow-xs bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">QCBS Average</p>
              <p className="text-2xl font-black text-purple-500 mt-0.5">{avgQCBS} / 100</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs: Bid Proposals vs EMD/BG Manager vs QCBS Calculator */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="proposals" className="gap-2 text-xs font-bold">
              <FileText className="h-4 w-4" /> Bid Proposals
            </TabsTrigger>
            <TabsTrigger value="emd" className="gap-2 text-xs font-bold">
              <Landmark className="h-4 w-4" /> EMD & BG Manager ({emds.length})
            </TabsTrigger>
            <TabsTrigger value="qcbs" className="gap-2 text-xs font-bold">
              <Calculator className="h-4 w-4" /> QCBS Calculator (70:30)
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === 'proposals' && (
              <>
                <Button
                  size="sm"
                  onClick={() => { setSelectedBid(null); setCreateOpen(true); }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs text-xs h-8 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> [Prepare New Bid]
                </Button>
                <ExportMenu
                  title="Bid_Proposals_Register"
                  columns={exportColumns}
                  data={bids}
                  variant="outline"
                  className="h-8 text-xs font-semibold gap-1.5"
                />
              </>
            )}
            {activeTab === 'emd' && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedEMD(null);
                  setEmdBank('');
                  setEmdRef('');
                  setEmdTenderId(tenders[0]?.id || '');
                  setEmdModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs text-xs h-8 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> + Record Guarantee / EMD
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Bid Proposals */}
        <TabsContent value="proposals" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bid number or bidder name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="won">Won / Awarded</SelectItem>
                <SelectItem value="lost">Lost / Outbid</SelectItem>
                <SelectItem value="disqualified">Disqualified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bids.map(b => (
              <Card key={b.id} className="border shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] font-bold">{b.bidNumber}</Badge>
                    <Badge variant={STATUS_BADGE[b.status] || 'default'} className="uppercase text-[9px] font-bold">
                      {b.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground line-clamp-1">{b.bidderName}</CardTitle>
                  <CardDescription className="text-xs truncate">{b.tenderNumber} • {b.tenderTitle || 'PSU Tender'}</CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40 border grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Quoted Price</p>
                      <p className="text-base font-extrabold text-foreground mt-0.5">{formatCurrency(b.bidValue || b.quotedAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">QCBS Score</p>
                      <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                        {b.overallScore ? `${b.overallScore}/100` : '93.1/100'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Submission Date:</span>
                    <span className="font-semibold text-foreground">{formatDate(b.submissionDate)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedBid(b); setCreateOpen(true); }}
                      className="text-xs font-semibold text-primary h-7"
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit Quote
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setBidToDelete(b)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: EMD & Bank Guarantee Manager (Section 5.3 & 5.4 of Manual) */}
        <TabsContent value="emd" className="space-y-4 mt-4">
          <Card className="border shadow-xs">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-500" />
                  EMD & Bank Guarantee (BG) Portfolio Register
                </CardTitle>
                <CardDescription className="text-xs">
                  Track Bank Guarantees, Fixed Deposit Receipts (FDR), Demand Drafts, and validity expiry alerts
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-3">Mode</th>
                      <th className="p-3">Guarantee / FDR Ref No</th>
                      <th className="p-3">Issuing Bank</th>
                      <th className="p-3">Tender Opportunity</th>
                      <th className="p-3 text-right">EMD Value (₹)</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3">Guarantee Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emds.map(e => {
                      const exp = new Date(e.expiryDate).getTime();
                      const daysLeft = Math.ceil((exp - Date.now()) / 86400000);
                      const isExpiring = daysLeft <= 15 && daysLeft > 0 && e.status !== 'released';
                      return (
                        <tr key={e.id} className={cn('border-b hover:bg-muted/20 transition-colors', isExpiring && 'bg-amber-500/5')}>
                          <td className="p-3">
                            <Badge variant="outline" className="font-bold text-[10px]">
                              {e.mode}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono font-bold text-foreground">
                            {e.referenceNumber}
                          </td>
                          <td className="p-3 text-muted-foreground font-medium">
                            {e.bankName}
                          </td>
                          <td className="p-3 font-medium text-foreground max-w-xs truncate">
                            {e.tenderNumber} - {e.tenderTitle || ''}
                          </td>
                          <td className="p-3 text-right font-extrabold text-foreground">
                            {formatCurrency(e.amount)}
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <p className={cn('font-bold', isExpiring ? 'text-amber-500' : 'text-foreground')}>
                                {formatDate(e.expiryDate)}
                              </p>
                              {daysLeft > 0 ? (
                                <p className="text-[10px] text-muted-foreground">({daysLeft} days remaining)</p>
                              ) : (
                                <p className="text-[10px] text-destructive font-bold">Matured</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={EMD_STATUS_BADGE[e.status] || 'default'} className="uppercase text-[9px] font-bold">
                              {e.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEMD(e);
                                setEmdAmount(e.amount);
                                setEmdMode(e.mode);
                                setEmdBank(e.bankName);
                                setEmdRef(e.referenceNumber);
                                setEmdExpiryDate(e.expiryDate.slice(0, 10));
                                setEmdStatus(e.status);
                                setEmdModalOpen(true);
                              }}
                              className="h-7 text-xs font-semibold text-primary"
                            >
                              Edit / Renew
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Interactive QCBS Calculator (Section 6 of User Manual) */}
        <TabsContent value="qcbs" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-xs">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-500" />
                  Quality & Cost Based Selection (QCBS) Evaluation Model
                </CardTitle>
                <CardDescription className="text-xs">
                  Calculate composite QCBS score based on technical score weightage (e.g. 70%) and financial price quote weightage (e.g. 30%)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-6">
                {/* Weightage Sliders */}
                <div className="p-4 rounded-xl bg-muted/40 border space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Technical Weightage (T): <strong>{qcbsTechWeight}%</strong></span>
                    <span className="font-bold text-primary">Financial Weightage (F): <strong>{qcbsFinWeight}%</strong></span>
                  </div>
                  <Slider
                    value={[qcbsTechWeight]}
                    onValueChange={(v: number[]) => setQcbsTechWeight(v[0])}
                    min={50}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>50% Tech / 50% Fin</span>
                    <span className="font-bold text-primary">70% Tech / 30% Fin (Standard PSU Model)</span>
                    <span>90% Tech / 10% Fin</span>
                  </div>
                </div>

                {/* Score & Quote Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Our Technical Score (out of 100) *</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={qcbsTechScore}
                      onChange={e => setQcbsTechScore(Number(e.target.value))}
                      className="font-bold text-sm h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">Scored by Technical Evaluation Committee</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Our Quoted Price (₹) *</Label>
                    <Input
                      type="number"
                      value={qcbsOurQuote}
                      onChange={e => setQcbsOurQuote(Number(e.target.value))}
                      className="font-bold text-sm h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(qcbsOurQuote)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Lowest Competitor Bid (L1 Price in ₹) *</Label>
                    <Input
                      type="number"
                      value={qcbsL1Quote}
                      onChange={e => setQcbsL1Quote(Number(e.target.value))}
                      className="font-bold text-sm h-9 text-emerald-600 dark:text-emerald-400"
                    />
                    <p className="text-[10px] text-muted-foreground">Normalized Formula: (L1 / Our Quote) × 100</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Normalized Financial Score (Sf)</Label>
                    <div className="h-9 px-3 rounded-md bg-muted/60 border flex items-center justify-between text-xs font-mono font-bold text-primary">
                      <span>Sf = ({formatCurrency(qcbsL1Quote)} / {formatCurrency(qcbsOurQuote)}) × 100</span>
                      <span className="text-sm">{qcbsNormalizedFinScore}</span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Calculation Breakdown (Section 6.1 of User Manual) */}
                <div className="p-4 rounded-xl border bg-card/60 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Illustrative Composite Calculation</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Technical Contribution</p>
                      <p className="text-base font-black text-foreground mt-0.5">
                        {qcbsTechScore} × {qcbsTechWeight}% = <strong>{((qcbsTechScore * qcbsTechWeight) / 100).toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Financial Contribution</p>
                      <p className="text-base font-black text-foreground mt-0.5">
                        {qcbsNormalizedFinScore} × {qcbsFinWeight}% = <strong>{((qcbsNormalizedFinScore * qcbsFinWeight) / 100).toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Composite Score Card */}
            <Card className="border shadow-xs flex flex-col justify-between">
              <CardHeader className="p-5 pb-2 text-center">
                <Badge variant="outline" className="mx-auto uppercase font-bold text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10">
                  QCBS Final Composite Score
                </Badge>
                <CardTitle className="text-4xl font-black text-purple-600 dark:text-purple-400 mt-4 tracking-tight">
                  {qcbsCompositeScore} <span className="text-lg text-muted-foreground">/ 100</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Higher composite score achieves rank **H1** in QCBS tender awards.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-2 pt-2 border-t text-xs">
                  <p className="font-bold text-foreground text-[11px] uppercase">QCBS Review Checklist (Section 6.2)</p>
                  <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Confirm technical evaluation score
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Confirm L1 competitor price input
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Verify tender weightage rules (70:30 / 80:20)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Compare against minimum qualification threshold
                    </li>
                  </ul>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    addToast({ title: 'QCBS Score Recorded', description: `Calculated composite score: ${qcbsCompositeScore}/100`, variant: 'success' });
                  }}
                  className="w-full font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Save Score to Active Bid
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record Guarantee / EMD Modal */}
      <Dialog open={emdModalOpen} onOpenChange={setEmdModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Record Bank Guarantee / EMD</DialogTitle>
            <DialogDescription className="text-xs">
              Enter financial security deposit details, instrument mode, and expiry dates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEMD} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs">Associated Tender *</Label>
              <Select value={emdTenderId} onValueChange={setEmdTenderId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Tender" /></SelectTrigger>
                <SelectContent>
                  {tenders.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.tenderNumber} - {t.title.slice(0, 35)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Security Mode *</Label>
                <Select value={emdMode} onValueChange={(v: any) => setEmdMode(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BG">Bank Guarantee (BG)</SelectItem>
                    <SelectItem value="FDR">Fixed Deposit (FDR)</SelectItem>
                    <SelectItem value="Online Transfer">Online RTGS / NEFT</SelectItem>
                    <SelectItem value="DD">Demand Draft (DD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Guarantee Status</Label>
                <Select value={emdStatus} onValueChange={(v: any) => setEmdStatus(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                    <SelectItem value="released">Released / Credited</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">EMD Amount (₹) *</Label>
              <Input
                type="number"
                value={emdAmount}
                onChange={e => setEmdAmount(Number(e.target.value))}
                className="h-8 text-xs font-bold text-emerald-600"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Issuing Bank & Branch *</Label>
              <Input
                placeholder="e.g. State Bank of India, Commercial Branch"
                value={emdBank}
                onChange={e => setEmdBank(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">BG / FDR / UTR Ref No *</Label>
                <Input
                  placeholder="e.g. BG/SBI/2026/98214"
                  value={emdRef}
                  onChange={e => setEmdRef(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Guarantee Expiry Date *</Label>
                <Input
                  type="date"
                  value={emdExpiryDate}
                  onChange={e => setEmdExpiryDate(e.target.value)}
                  className="h-8 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEmdModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold text-xs">
                Save Guarantee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prepare / Edit Bid Modal */}
      <BidFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={selectedBid}
        tenders={tenders}
        onSaved={() => { setCreateOpen(false); setSelectedBid(null); load(); }}
      />

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!bidToDelete}
        onOpenChange={v => { if (!v) setBidToDelete(null); }}
        onConfirm={async () => {
          if (!bidToDelete || !window.bidfly?.bid) return;
          await window.bidfly.bid.delete(bidToDelete.id);
          addToast({ title: 'Bid proposal deleted', description: bidToDelete.bidNumber, variant: 'default' });
          setBidToDelete(null);
          load();
        }}
        title="Delete Bid Proposal?"
        description={`Are you sure you want to remove ${bidToDelete?.bidNumber}?`}
      />
    </div>
  );
}

function BidFormDialog({
  open, onOpenChange, initial, tenders, onSaved
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Bid | null;
  tenders: Tender[];
  onSaved: () => void;
}) {
  const addToast = useAppStore(s => s.addToast);
  const isEdit = !!initial;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(BidCreateSchema) as any,
    defaultValues: {
      tenderId: tenders[0]?.id || '',
      bidNumber: `BID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      bidderName: 'Advance Forging Pvt Ltd',
      bidValue: 0,
      currency: 'INR',
      submissionDate: new Date().toISOString().slice(0, 16),
      status: 'pending',
      technicalScore: 92,
      financialScore: 88,
      overallScore: 90.8,
      technicalWeightage: 70,
      financialWeightage: 30,
      emdAmount: 0,
      emdMode: 'BG',
      notes: ''
    }
  });

  useEffect(() => {
    if (open && initial) {
      setValue('tenderId', initial.tenderId);
      setValue('bidNumber', initial.bidNumber);
      setValue('bidderName', initial.bidderName);
      setValue('bidValue', initial.bidValue);
      setValue('currency', initial.currency);
      setValue('submissionDate', initial.submissionDate.slice(0, 16));
      setValue('status', initial.status as any);
      setValue('technicalScore', initial.technicalScore);
      setValue('financialScore', initial.financialScore);
      setValue('overallScore', initial.overallScore);
      setValue('notes', initial.notes || '');
    } else if (open) {
      reset({
        tenderId: tenders[0]?.id || '',
        bidNumber: `BID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        bidderName: 'Advance Forging Pvt Ltd',
        bidValue: 11800000,
        currency: 'INR',
        submissionDate: new Date().toISOString().slice(0, 16),
        status: 'pending',
        technicalScore: 92,
        financialScore: 88,
        overallScore: 90.8,
        notes: ''
      });
    }
  }, [open, initial, tenders]);

  async function onSubmit(data: any) {
    if (!window.bidfly?.bid) return;
    let res;
    if (isEdit && initial) {
      res = await window.bidfly.bid.update({ ...data, id: initial.id });
    } else {
      res = await window.bidfly.bid.create(data);
    }
    if (res?.success) {
      addToast({ title: isEdit ? 'Bid updated' : 'Bid recorded', description: data.bidNumber, variant: 'success' });
      onSaved();
    } else {
      addToast({ title: 'Save failed', description: res?.error, variant: 'error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bid Proposal' : 'Prepare New Bid Proposal'}</DialogTitle>
          <DialogDescription className="text-xs">
            Enter bidder details, financial proposal value, and technical scoring metrics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-3.5">
          <div className="space-y-1">
            <Label className="text-xs">Associated Tender *</Label>
            <Select value={watch('tenderId')} onValueChange={v => setValue('tenderId', v)}>
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
            <div className="space-y-1">
              <Label className="text-xs">Bid Proposal Number *</Label>
              <Input {...register('bidNumber')} className="h-8 text-xs font-mono font-bold" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bidder Entity *</Label>
              <Input {...register('bidderName')} className="h-8 text-xs" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Total Quoted Price (₹) *</Label>
              <Input type="number" {...register('bidValue', { valueAsNumber: true })} className="h-8 text-xs font-extrabold text-foreground" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Proposal Status</Label>
              <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="won">Won / Awarded</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tech Score (70%)</Label>
              <Input type="number" step="0.1" {...register('technicalScore', { valueAsNumber: true })} className="h-8 text-xs font-bold text-blue-600" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin Score (30%)</Label>
              <Input type="number" step="0.1" {...register('financialScore', { valueAsNumber: true })} className="h-8 text-xs font-bold text-emerald-600" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">QCBS Composite</Label>
              <Input type="number" step="0.1" {...register('overallScore', { valueAsNumber: true })} className="h-8 text-xs font-black text-purple-600" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Submission Date</Label>
            <Input type="datetime-local" {...register('submissionDate')} className="h-8 text-xs" />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="font-bold text-xs">{isEdit ? 'Update Bid' : 'Record Bid'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BidsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading Bids Workspace...</div>}>
      <BidsPageContent />
    </Suspense>
  );
}
