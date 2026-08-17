"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from "next/navigation";
import {
  FileText, Gavel, Trophy, TrendingUp, AlertTriangle, Clock, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, ExternalLink, Plus, Filter,
  CheckCircle2, Sparkles, Activity, Layers, ArrowRight, ShieldCheck, ChevronRight,
  PieChart as PieIcon, BarChart3, Landmark, FileSpreadsheet, Download, RefreshCw,
  Bell, Building2, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ExportMenu } from '@/components/ui/export-menu';
import { useAppStore, useThemeStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useActivityStore, type ActivityLog } from '@/stores/activity.store';
import { formatCurrency, formatDate, formatRelativeTime, cn } from '@/lib/utils';
import type { Tender, Bid, EMDRecord, Clarification } from '@/lib/types';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: { text: string; variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' };
  gradient: string;
  iconBg: string;
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon: Icon, badge, gradient, iconBg, onClick }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group",
        onClick && "cursor-pointer"
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', gradient)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl lg:text-3xl font-black tracking-tight mt-1 text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground/80 mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110', iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {badge && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted-foreground font-medium">Status</span>
            <Badge variant={badge.variant || 'default'} className="text-[10px] font-bold px-2 py-0.5">
              {badge.text}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, activeCompanyCode } = useAuthStore();
  const addToast = useAppStore(s => s.addToast);
  const logs = useActivityStore(s => s.activities);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [expiringTenders, setExpiringTenders] = useState<Tender[]>([]);
  const [expiringEMDs, setExpiringEMDs] = useState<EMDRecord[]>([]);
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number; value: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined' && window.bidfly) {
        const [statsRes, expRes, trendRes, catRes, emdRes, clarRes] = await Promise.all([
          window.bidfly.getStats(),
          window.bidfly.tender.getExpiringSoon(72),
          window.bidfly.tender.getMonthlyTrend(),
          window.bidfly.tender.getCategories(),
          window.bidfly.emd ? window.bidfly.emd.getExpiringSoon(15) : Promise.resolve({ success: true, data: [] }),
          window.bidfly.clarification ? window.bidfly.clarification.list() : Promise.resolve({ success: true, data: [] })
        ]);

        if (statsRes?.success && statsRes.data) setStats(statsRes.data);
        if (expRes?.success && expRes.data) setExpiringTenders(expRes.data);
        if (trendRes?.success && trendRes.data) setMonthlyData(trendRes.data);
        if (catRes?.success && catRes.data) setCategoryData(catRes.data);
        if (emdRes?.success && emdRes.data) setExpiringEMDs(emdRes.data as EMDRecord[]);
        if (clarRes?.success && clarRes.data) setClarifications(clarRes.data as Clarification[]);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyCode]);

  const exportColumns = useMemo(() => [
    { header: 'Metric', key: 'metric' },
    { header: 'Current Value', key: 'value' },
    { header: 'Details / Scope', key: 'details' }
  ], []);

  const exportRows = useMemo(() => [
    { metric: 'Total Tenders', value: String(stats?.totalTenders || 0), details: `${stats?.activeTenders || 0} Active, ${stats?.archivedTenders || 0} Archived` },
    { metric: 'Active Bids', value: String(stats?.submittedBids || 0), details: `Total Pipeline: ₹${((stats?.totalBidValue || 0) / 100000).toFixed(2)} Lakhs` },
    { metric: 'EMD / BG Locked Amount', value: `₹${((stats?.totalLockedEMD || 0) / 100000).toFixed(2)} Lakhs`, details: `${stats?.expiringEMDCount || 0} Guarantees Expiring Soon` },
    { metric: 'Tracked Competitors', value: String(stats?.totalCompetitors || 0), details: `Average Market Discount: ${stats?.avgMarketDiscount || 7.8}%` },
    { metric: 'QCBS Average Score', value: `${stats?.qcbsAverageScore || 92.5}/100`, details: '70% Tech + 30% Fin Model' }
  ], [stats]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Universal Quick Navigation Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              Enterprise Bid Command Center
            </span>
            <span className="text-xs text-muted-foreground">• Entity: <strong>{activeCompanyCode === 'ALL' ? 'Combined Portfolio' : activeCompanyCode}</strong></span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Commercial Lead'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated tender discovery, cost estimation, EMD guarantees & competitor intelligence
          </p>
        </div>

        {/* Quick Launch Buttons (Direct PDF Manual requirement) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => router.push('/tenders?action=create' as any)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs text-xs h-9 gap-1.5"
          >
            <Plus className="h-4 w-4" /> [New Tender]
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/bids?action=create' as any)}
            className="font-bold text-xs h-9 gap-1.5 border-primary/30 hover:bg-primary/5"
          >
            <Gavel className="h-4 w-4 text-primary" /> [New Bid Proposal]
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/sheets' as any)}
            className="font-bold text-xs h-9 gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> [Tender Datasheet]
          </Button>
          <ExportMenu
            title="BidFly_Executive_Summary"
            columns={exportColumns}
            data={exportRows}
            variant="outline"
            className="h-9 text-xs font-semibold gap-1.5"
          />
        </div>
      </div>

      {/* 4 Key Metric Summary Cards (Section 2 of User Manual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Tenders */}
        <StatCard
          title="Total Tenders"
          value={String(stats?.totalTenders ?? 0)}
          subtitle={`${stats?.activeTenders ?? 0} Active • ${stats?.archivedTenders ?? 0} Archived`}
          icon={Gavel}
          badge={{ text: `${stats?.activeTenders ?? 0} In Progress`, variant: 'default' }}
          gradient="from-blue-600 to-cyan-500"
          iconBg="bg-blue-500/10 text-blue-500"
          onClick={() => router.push('/tenders' as any)}
        />

        {/* 2. Active Bids */}
        <StatCard
          title="Active Bids"
          value={String(stats?.submittedBids ?? 0)}
          subtitle={`₹${((stats?.totalBidValue ?? 0) / 10000000).toFixed(2)} Cr Pipeline`}
          icon={FileText}
          badge={{ text: `${stats?.submittedBids ?? 0} Proposals Live`, variant: (stats?.submittedBids ?? 0) > 0 ? 'warning' : 'outline' }}
          gradient="from-amber-500 to-orange-500"
          iconBg="bg-amber-500/10 text-amber-500"
          onClick={() => router.push('/bids' as any)}
        />

        {/* 3. EMD Total Value (₹) */}
        <StatCard
          title="EMD / BG Total Value"
          value={formatCurrency(stats?.totalLockedEMD ?? 0)}
          subtitle={`${stats?.expiringEMDCount ?? 0} Guarantee Expiring (<15d)`}
          icon={Landmark}
          badge={{
            text: (stats?.expiringEMDCount ?? 0) > 0 ? 'Action Required' : 'Guarantees Valid',
            variant: (stats?.expiringEMDCount ?? 0) > 0 ? 'destructive' : 'success'
          }}
          gradient="from-emerald-500 to-teal-500"
          iconBg="bg-emerald-500/10 text-emerald-500"
          onClick={() => router.push('/bids?tab=emd' as any)}
        />

        {/* 4. Total Competitors */}
        <StatCard
          title="Total Competitors"
          value={String(stats?.totalCompetitors ?? 0)}
          subtitle={`Avg Discount: ${stats?.avgMarketDiscount ?? 0}% (L1–L4)`}
          icon={Users}
          badge={{ text: 'Spread: 3.5%–5.0%', variant: 'outline' }}
          gradient="from-purple-600 to-pink-500"
          iconBg="bg-purple-500/10 text-purple-500"
          onClick={() => router.push('/competitors' as any)}
        />
      </div>

      {/* Urgent EMD / Guarantee Expiry Alert Engine Banner */}
      {expiringEMDs.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    EMD & Bank Guarantee Expiry Watchlist ({expiringEMDs.length} Pending Renewal)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {expiringEMDs[0].bankName} guarantee of {formatCurrency(expiringEMDs[0].amount)} for {expiringEMDs[0].tenderNumber} expires on{' '}
                    <strong>{formatDate(expiringEMDs[0].expiryDate)}</strong> ({formatRelativeTime(expiringEMDs[0].expiryDate)}).
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/bids?tab=emd' as any)}
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8"
              >
                Manage Guarantees <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tender Lifecycle Stage Quick Stats (Technical, Financial, Awarded) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Technical Stage</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{stats?.technicalStageCount ?? 0} Tenders</p>
          </div>
          <Badge variant="outline" className="text-blue-500 bg-blue-500/10 border-blue-500/20 text-[10px]">T-Eval</Badge>
        </div>
        <div className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Financial Stage</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{stats?.financialStageCount ?? 0} Tenders</p>
          </div>
          <Badge variant="outline" className="text-amber-500 bg-amber-500/10 border-amber-500/20 text-[10px]">L1 Check</Badge>
        </div>
        <div className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Awarded / Won</p>
            <p className="text-lg font-bold text-emerald-500 mt-0.5">{stats?.awardedTendersCount ?? 0} Contracts</p>
          </div>
          <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 text-[10px]">LOA Issued</Badge>
        </div>
        <div className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">QCBS Composite</p>
            <p className="text-lg font-bold text-purple-500 mt-0.5">{stats?.qcbsAverageScore ?? 0} / 100</p>
          </div>
          <Badge variant="outline" className="text-purple-500 bg-purple-500/10 border-purple-500/20 text-[10px]">70:30 Model</Badge>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Bar Chart */}
        <Card className="lg:col-span-2 shadow-xs border">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Procurement Volume & Pipeline Trajectory
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly aggregate tender published value and bid submission pipeline
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {`FY ${new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1}-${((new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1) + 1).toString().slice(-2)}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {monthlyData.length > 0 ? (
              <div className="h-64 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `₹${(v / 10000000).toFixed(1)}Cr`}
                    />
                    <ReTooltip
                      formatter={(val: any) => [`₹${(Number(val) / 100000).toFixed(2)} Lakhs`, 'Value']}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl my-2 bg-muted/10">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground">No procurement volume recorded yet</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 max-w-xs">
                  Create or import tenders into the platform to track monthly financial trajectories.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/tenders?action=create' as any)}
                  className="mt-3 text-xs h-7 gap-1 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Record Opportunity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right 1 Col: Category / Sector Distribution */}
        <Card className="shadow-xs border">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-indigo-500" />
              Tender Portals & Domains
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown by issuing authority & GeM / CPPP
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {categoryData.length > 0 ? (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="category"
                      >
                        {categoryData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {categoryData.map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground truncate max-w-[140px]">{c.category}</span>
                      </div>
                      <span className="font-bold text-foreground">{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-60 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl bg-muted/10">
                <PieIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground">No domain categories logged</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 max-w-xs">
                  Category splits will generate automatically across GeM, CPPP, and Railways tenders.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Grid: Pre-Bid Corrigenda Feed & Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-Bid Queries & Corrigenda Log */}
        <Card className="shadow-xs border">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                Clarification & Addenda Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                Pre-bid meeting queries, department corrigenda and amendments
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/tenders' as any)}
              className="text-xs h-7 text-primary font-semibold"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-3">
              {clarifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p>No pre-bid queries or corrigenda logged.</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">Pre-bid meeting addenda & client clarifications appear here.</p>
                </div>
              ) : (
                clarifications.slice(0, 3).map(c => (
                  <div key={c.id} className="p-3 rounded-xl border bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">
                        {c.clauseReference || c.tenderNumber}
                      </Badge>
                      <Badge
                        variant={c.status === 'answered' ? 'success' : c.status === 'submitted' ? 'warning' : 'secondary'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{c.querySubject}</p>
                    {c.authorityResponse && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-md font-medium">
                        ✓ {c.authorityResponse}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Operational Activity Log */}
        <Card className="shadow-xs border">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Live Commercial Activity Log
              </CardTitle>
              <CardDescription className="text-xs">
                Audited timeline of bid submissions, EMD renewals & tender updates
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <ScrollArea className="h-56 pr-2">
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    <Activity className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-muted-foreground">No commercial activity recorded yet</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Actions like drafting bids, logging EMD bank guarantees, and tender creation will be timestamped here in real-time.
                    </p>
                  </div>
                ) : (
                  logs.slice(0, 5).map((log: ActivityLog) => (
                    <div key={log.id} className="p-2.5 rounded-lg border bg-card/60 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">{log.action}</Badge>
                          <span className="font-bold text-foreground truncate">{log.entityTitle}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(log.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
