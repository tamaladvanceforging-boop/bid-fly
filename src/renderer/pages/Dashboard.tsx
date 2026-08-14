import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Gavel, Trophy, TrendingUp, AlertTriangle, Clock, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, ExternalLink, Plus, Filter,
  CheckCircle2, Sparkles, Activity, Layers, ArrowRight, ShieldCheck, ChevronRight,
  PieChart as PieIcon, BarChart3, LineChart as LineIcon
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Progress } from '@renderer/components/ui/progress'
import { useAppStore, useThemeStore } from '@renderer/stores/app.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useActivityStore, type ActivityLog } from '@renderer/stores/activity.store'
import { formatCurrency, formatDate, formatRelativeTime, cn } from '@shared/utils'
import type { Tender, Bid } from '@shared/types'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: string; positive: boolean }
  gradient: string
  iconBg: string
}

function StatCard({ title, value, subtitle, icon: Icon, trend, gradient, iconBg }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group">
      {/* Subtle top gradient accent line */}
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
        {trend && (
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              {trend.positive ? (
                <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  <span>{trend.value}</span>
                </div>
              ) : (
                <div className="flex items-center text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                  <span>{trend.value}</span>
                </div>
              )}
              <span className="text-muted-foreground font-normal ml-0.5">vs last cycle</span>
            </div>
            <span className="text-[10px] text-muted-foreground/70 font-mono">LIVE SYNC</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Vibrant modern palette for Donut Pie Chart
const PIE_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1'  // Indigo
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { stats, fetchStats, fetchSettings, fetchAlerts } = useAppStore()
  const { companies, activeCompanyCode } = useAuthStore()
  const resolvedTheme = useThemeStore(s => s.resolvedTheme)

  const [tenders, setTenders] = useState<Tender[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [monthly, setMonthly] = useState<{ month: string; count: number; value: number }[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [activeTab, setActiveTab] = useState('pipeline')

  useEffect(() => {
    fetchSettings()
    fetchStats()
    fetchAlerts()
    loadData()
  }, [])

  async function loadData() {
    if (!window.bidfly?.tender) return
    const [tres, bres, mres, cres] = await Promise.all([
      window.bidfly.tender.list({ limit: 6, sortBy: 'submission_deadline', sortOrder: 'asc', filters: { status: 'open' } }),
      window.bidfly.bid.list({ limit: 10 }),
      window.bidfly.tender.getMonthlyTrend(),
      window.bidfly.tender.getCategories()
    ])
    if (tres?.success && tres.data) setTenders(tres.data.items)
    if (bres?.success && bres.data) setBids(bres.data.items)
    if (mres?.success && mres.data) setMonthly(mres.data.slice().reverse())
    if (cres?.success && cres.data) setCategories(cres.data.slice(0, 6))
  }

  const pieData = useMemo(() =>
    categories.map(c => ({ name: c.category, value: c.count })),
    [categories]
  )

  const totalTendersInSectors = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0)
  }, [pieData])

  const tooltipStyle = {
    borderRadius: 12,
    border: resolvedTheme === 'dark' ? '1px solid #27272a' : '1px solid #e4e4e7',
    backgroundColor: resolvedTheme === 'dark' ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    color: resolvedTheme === 'dark' ? '#f4f4f5' : '#09090b',
    boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
    backdropFilter: 'blur(8px)',
    padding: '10px 14px',
    fontSize: '12px'
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-card border border-primary/20 p-6 lg:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30 font-bold px-2.5 py-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1.5" /> Commercial Executive Suite
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {activeCompanyCode === 'ALL' ? 'Multi-Company Mode' : `Active: ${activeCompanyCode}`}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              Tender Intelligence & Bid Automation Center
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real-time monitoring across GeM, CPP Portal & Corporate RFPs. 15-column live datasheet, QCBS scoring matrices and predictive win analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/data-entry')} className="shadow-xs font-semibold">
              <Layers className="h-4 w-4 mr-2 text-amber-500" /> Tender Datasheet
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')} className="shadow-xs font-semibold">
              <FileText className="h-4 w-4 mr-2 text-blue-500" /> Analytics
            </Button>
            <Button size="sm" onClick={() => navigate('/tenders?action=create')} className="font-bold shadow-md shadow-primary/20">
              <Plus className="h-4 w-4 mr-1.5" /> Create Tender / Bid
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tenders Tracked"
          value={stats?.totalTenders ? stats.totalTenders.toString() : '12'}
          subtitle="Across GeM, CPWD, NHAI, IOCL"
          icon={Gavel}
          gradient="from-blue-500 to-cyan-400"
          iconBg="bg-blue-500/15 text-blue-500"
          trend={{ value: '+14.2%', positive: true }}
        />
        <StatCard
          title="Open Submissions"
          value={stats?.openTenders ? stats.openTenders.toString() : '6'}
          subtitle="Active bidding countdown"
          icon={Clock}
          gradient="from-amber-500 to-yellow-400"
          iconBg="bg-amber-500/15 text-amber-500"
          trend={{ value: '+8.5%', positive: true }}
        />
        <StatCard
          title="Contracts Won (L1)"
          value={stats?.wonBids ? stats.wonBids.toString() : '4'}
          subtitle="Awarded LOA contracts"
          icon={Trophy}
          gradient="from-emerald-500 to-teal-400"
          iconBg="bg-emerald-500/15 text-emerald-500"
          trend={{ value: '+24.0%', positive: true }}
        />
        <StatCard
          title="Total Pipeline Value"
          value={stats ? formatCurrency(stats.totalValue) : '₹7.28 Cr'}
          subtitle="Cumulative contract estimates"
          icon={DollarSign}
          gradient="from-indigo-500 to-purple-500"
          iconBg="bg-indigo-500/15 text-indigo-500"
          trend={{ value: '+18.3%', positive: true }}
        />
      </div>

      {/* Modern High-Impact Graphs Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left 2 Cols: Area / Bar Charts */}
        <Card className="lg:col-span-2 border shadow-md overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b bg-muted/20">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-bold">Procurement Volume & Pipeline Trajectory</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Monthly tender identification pace & total cumulative contract value (₹)
              </CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="pipeline" className="text-xs px-3">Area Trend</TabsTrigger>
                <TabsTrigger value="bars" className="text-xs px-3">Volume Bars</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'pipeline' ? (
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#27272a' : '#f4f4f5'} />
                    <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis className="text-xs" axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`} />
                    <ReTooltip
                      formatter={(val: number) => [formatCurrency(val), 'Cumulative Value']}
                      contentStyle={tooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="url(#lineGrad)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#areaGradient)"
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                      name="Pipeline Value"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={monthly}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#27272a' : '#f4f4f5'} />
                    <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis className="text-xs" axisLine={false} tickLine={false} />
                    <ReTooltip
                      formatter={(val: number) => [`${val} Opportunities`, 'Published Tenders']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      name="Tender Count"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Donut Pie Chart with Centered HUD */}
        <Card className="border shadow-md overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base font-bold">Sector Distribution</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Opportunity share by industry segment
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col items-center justify-center relative">
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke={resolvedTheme === 'dark' ? '#18181b' : '#ffffff'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut HUD Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl font-black tracking-tight text-foreground">{totalTendersInSectors}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Sectors</span>
              </div>
            </div>

            {/* Custom Sector Badges */}
            <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-3 border-t">
              {pieData.slice(0, 4).map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="truncate text-muted-foreground text-[11px]">{p.name}</span>
                  </div>
                  <span className="font-bold text-[11px]">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        {/* Urgent Deadlines */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold">Priority Submission Deadlines</CardTitle>
              <CardDescription className="text-xs">Upcoming tenders requiring proposal finalization</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/tenders')} className="h-8 text-xs font-semibold">
              View All Tenders <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[320px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-4 font-bold">Tender / Scope</th>
                    <th className="py-2.5 px-4 font-bold">Client / Dept</th>
                    <th className="py-2.5 px-4 font-bold text-right">Value (₹)</th>
                    <th className="py-2.5 px-4 font-bold">Deadline</th>
                    <th className="py-2.5 px-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map(t => (
                    <tr
                      key={t.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate('/tenders')}
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-xs line-clamp-1 hover:text-primary transition-colors">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{t.tenderNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground">{t.organization}</td>
                      <td className="py-3 px-4 text-right font-bold text-xs tabular-nums text-primary">
                        {formatCurrency(t.value, t.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(t.submissionDeadline, 'date')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success" className="text-[10px] uppercase font-bold">
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Bids Feed */}
        <Card className="lg:col-span-2 border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-sm font-bold">Recent Bid Submissions & Scores</CardTitle>
            <CardDescription className="text-xs">Competitive QCBS evaluation log</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 flex-1 space-y-3">
            {bids.slice(0, 4).map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate('/bids')}
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <p className="font-bold text-xs truncate">{b.bidderName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{b.bidNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-xs text-primary">{formatCurrency(b.bidValue, b.currency)}</p>
                  <Badge variant={b.status === 'won' ? 'success' : 'secondary'} className="text-[10px] capitalize font-bold mt-0.5">
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-3 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs font-semibold" onClick={() => navigate('/bids')}>
              Open Bids & Scoring Matrix <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Live Audit Trail & Activity Log Card */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-muted/10">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-bold">Audit Trail & Activity History</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Live chronological log of all additions, updates, deletions and restores with exact date & time
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/data-entry')} className="h-8 text-xs font-semibold">
            Open Tender Datasheet <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {useActivityStore.getState().activities.slice(0, 3).map((act: ActivityLog) => (
              <div
                key={act.id}
                className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      act.action === 'CREATE' ? 'success' :
                      act.action === 'DELETE' ? 'destructive' :
                      act.action === 'RESTORE' ? 'warning' : 'secondary'
                    }
                    className="text-[10px] font-bold uppercase"
                  >
                    {act.action}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(act.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-foreground truncate">{act.entityTitle}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{act.details || act.entityType}</p>
                </div>
                <div className="pt-1 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>By: {act.userName}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{act.entityType}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
