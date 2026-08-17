"use client";

import { useEffect, useMemo, useState } from 'react'
import {
  FileText, Download, TrendingUp, DollarSign, Trophy, Calendar,
  PieChart as PieIcon, BarChart2, CheckCircle2, Award, Printer, Filter
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ComposedChart
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAppStore, useThemeStore } from '@/stores/app.store'
import { formatCurrency, formatDate, downloadFile, cn } from '@/lib/utils'
import type { Tender, Bid, Vendor } from '@/lib/types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

export default function ReportsPage() {
  const addToast = useAppStore(s => s.addToast)
  const resolvedTheme = useThemeStore(s => s.resolvedTheme)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [timeRange, setTimeRange] = useState('year')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!window.bidfly) return
    const [tres, bres, vres] = await Promise.all([
      window.bidfly.tender.list({ limit: 500 }),
      window.bidfly.bid.list({ limit: 500 }),
      window.bidfly.vendor.list({ limit: 500 })
    ])
    if (tres?.success && tres.data) setTenders(tres.data.items)
    if (bres?.success && bres.data) setBids(bres.data.items)
    if (vres?.success && vres.data) setVendors(vres.data.items)
  }

  // Filtered dataset
  const filteredTenders = useMemo(() => {
    return tenders.filter(t => categoryFilter === 'all' || t.category === categoryFilter)
  }, [tenders, categoryFilter])

  // Monthly summary aggregation
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; published: number; submitted: number; value: number }>()
    filteredTenders.forEach(t => {
      const m = t.publishDate ? t.publishDate.slice(0, 7) : ''
      if (!m) return
      const curr = map.get(m) || { month: m, published: 0, submitted: 0, value: 0 }
      curr.published += 1
      if (t.status === 'submitted' || t.status === 'awarded') curr.submitted += 1
      curr.value += t.value || 0
      map.set(m, curr)
    })
    const res = Array.from(map.values())
    res.sort((a, b) => a.month.localeCompare(b.month))
    return res
  }, [filteredTenders])

  // Category distribution aggregation
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    filteredTenders.forEach(t => {
      if (t.category) {
        map.set(t.category, (map.get(t.category) || 0) + 1)
      }
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredTenders])

  // Win/Loss metrics
  const winLossSummary = useMemo(() => {
    const won = bids.filter(b => b.status === 'won' || b.isWinning).length
    const lost = bids.filter(b => b.status === 'lost').length
    const pending = bids.filter(b => b.status === 'pending').length
    const totalDecided = won + lost
    return {
      won,
      lost,
      pending,
      winRate: totalDecided > 0 ? ((won / totalDecided) * 100).toFixed(1) : '0.0',
      totalValue: tenders.reduce((acc, t) => acc + (t.value || 0), 0)
    }
  }, [bids, tenders])

  const tooltipStyle = {
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    backgroundColor: resolvedTheme === 'dark' ? '#18181b' : '#ffffff',
    color: resolvedTheme === 'dark' ? '#f4f4f5' : '#09090b',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }

  const handleExportCSV = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const headers = ['Report Metric', 'Value', 'Generated At']
      const rows = [
        ['Total Tenders In Pipeline', filteredTenders.length, new Date().toISOString()],
        ['Total Pipeline Value (₹)', winLossSummary.totalValue, new Date().toISOString()],
        ['Total Bids Submitted', bids.length, new Date().toISOString()],
        ['Contracts Won', winLossSummary.won, new Date().toISOString()],
        ['Win Rate (%)', `${winLossSummary.winRate}%`, new Date().toISOString()],
        ['Empaneled Vendors', vendors.length, new Date().toISOString()]
      ]
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      downloadFile(blob, `bidfly_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`)
      setIsGenerating(false)
      addToast({ title: 'Analytics Report Exported', description: 'Downloaded CSV summary', variant: 'success' })
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Executive Analytics & Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive business intelligence, win/loss rates, budget breakdowns & historical yields
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print PDF
          </Button>
          <Button size="sm" onClick={handleExportCSV} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" /> {isGenerating ? 'Generating...' : 'Export Excel / CSV'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Report Filters:</span>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Array.from(new Set(tenders.map(t => t.category))).map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Time Period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="half">Last 6 Months</SelectItem>
            <SelectItem value="year">Current Financial Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Pipeline Budget</p>
            <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(winLossSummary.totalValue)}</p>
            <p className="text-xs text-emerald-500 font-medium mt-1">Across {filteredTenders.length} active opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Historical Win Rate</p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">{winLossSummary.winRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{winLossSummary.won} won out of {winLossSummary.won + winLossSummary.lost} decided</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Empaneled Partners</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">{vendors.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Across {categoryData.length} technical categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Bid Evaluations</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{winLossSummary.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting decision results</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tender Publication & Submission Volume</CardTitle>
            <CardDescription>Monthly comparison of identified tenders vs submitted bids</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No monthly trend records available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="published" name="Tenders Published" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="submitted" name="Bids Submitted" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Allocation by Category</CardTitle>
            <CardDescription>Tender opportunities distribution across industry verticals</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No category records available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Value Opportunities Summary</CardTitle>
          <CardDescription>Major strategic procurement opportunities in current pipeline</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="py-3 px-4 font-medium text-muted-foreground">Tender Reference</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Title & Scope</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Issuing Authority</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-right">Value (₹)</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    No active opportunities in pipeline.
                  </td>
                </tr>
              ) : (
                filteredTenders.slice(0, 5).map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold">{t.tenderNumber}</td>
                    <td className="py-3.5 px-4 font-medium max-w-[280px] truncate">{t.title}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{t.organization}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-primary">{formatCurrency(t.value, t.currency)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.status === 'open' ? 'success' : t.status === 'awarded' ? 'default' : 'secondary'} className="capitalize">
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
