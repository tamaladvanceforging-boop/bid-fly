import { useEffect, useMemo, useState } from 'react'
import {
  Trophy, Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye,
  CheckCircle2, XCircle, Clock, Award, Download, Building2, Gavel, Percent
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Badge } from '@renderer/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@renderer/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@renderer/components/ui/select'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Separator } from '@renderer/components/ui/separator'
import { cn, formatCurrency, formatDate, downloadFile } from '@shared/utils'
import type { Bid, BidStatus, Tender, Vendor } from '@shared/types'
import { BidCreateSchema, type BidCreateInput, type PaginationParams } from '@shared/schemas'
import { useAppStore } from '@renderer/stores/app.store'
import { useActivityStore } from '@renderer/stores/activity.store'
import { ConfirmDeleteDialog } from '@renderer/components/ui/ConfirmDeleteDialog'

const STATUS_BADGE: Record<BidStatus, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  pending: 'warning',
  won: 'success',
  lost: 'destructive',
  disqualified: 'secondary'
}

export default function BidsPage() {
  const addToast = useAppStore(s => s.addToast)
  const logActivity = useActivityStore(s => s.logActivity)
  const [bids, setBids] = useState<Bid[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tenderFilter, setTenderFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Bid | null>(null)
  const [bidToDelete, setBidToDelete] = useState<Bid | null>(null)
  const [summary, setSummary] = useState<{ total: number; won: number; lost: number; pending: number; totalValue: number; wonValue: number } | null>(null)

  const load = async () => {
    if (!window.bidfly?.bid) return
    const params: PaginationParams & { tenderId?: string; filters?: Record<string, string> } = { page, limit }
    if (search) params.search = search
    if (statusFilter !== 'all') params.filters = { status: statusFilter }
    if (tenderFilter !== 'all') params.tenderId = tenderFilter
    const [res, sres, tres, vres] = await Promise.all([
      window.bidfly.bid.list(params),
      window.bidfly.bid.getSummary(),
      window.bidfly.tender.list({ limit: 100 }),
      window.bidfly.vendor.list({ limit: 100 })
    ])
    if (res?.success && res.data) {
      setBids(res.data.items)
      setTotal(res.data.total)
    }
    if (sres?.success && sres.data) setSummary(sres.data)
    if (tres?.success && tres.data) setTenders(tres.data.items)
    if (vres?.success && vres.data) setVendors(vres.data.items)
  }

  useEffect(() => {
    load()
  }, [page, statusFilter, tenderFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  const tenderMap = useMemo(() => new Map(tenders.map(t => [t.id, t])), [tenders])

  async function handleDeleteConfirmed() {
    if (!bidToDelete || !window.bidfly?.bid) return
    const id = bidToDelete.id
    const bidNumber = bidToDelete.bidNumber
    const res = await window.bidfly.bid.delete(id)
    if (res?.success) {
      logActivity('DELETE', 'Bid', bidNumber, `Deleted proposal for ${bidToDelete.bidderName}`, id)
      addToast({ title: 'Bid deleted', description: bidNumber, variant: 'success' })
      load()
    } else {
      addToast({ title: 'Delete failed', description: res?.error, variant: 'error' })
    }
    setBidToDelete(null)
  }

  function handleExportCSV() {
    if (bids.length === 0) {
      addToast({ title: 'No bids to export', variant: 'warning' })
      return
    }
    const headers = ['Bid Number', 'Tender', 'Bidder Name', 'Bid Value', 'Currency', 'Status', 'Technical Score', 'Financial Score', 'Overall Score', 'Winning', 'Submission Date']
    const rows = bids.map(b => {
      const t = tenderMap.get(b.tenderId)
      return [
        `"${b.bidNumber}"`,
        `"${(t ? t.title : b.tenderId).replace(/"/g, '""')}"`,
        `"${b.bidderName.replace(/"/g, '""')}"`,
        b.bidValue,
        b.currency,
        b.status,
        b.technicalScore ?? '',
        b.financialScore ?? '',
        b.overallScore ?? '',
        b.isWinning ? 'YES' : 'NO',
        b.submissionDate
      ]
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `bidfly_bids_${new Date().toISOString().slice(0, 10)}.csv`)
    addToast({ title: 'Bids exported to CSV', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bids & Evaluations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track competitor and partner proposals, score matrices & win/loss outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => { setSelected(null); setCreateOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Submit / Record Bid
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Bids Logged</p>
              <p className="text-2xl font-bold mt-1">{summary?.total ?? 0}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-500">
              <Gavel className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Won Contracts</p>
              <p className="text-2xl font-bold mt-1 text-emerald-500">{summary?.won ?? 0}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Under Evaluation</p>
              <p className="text-2xl font-bold mt-1 text-amber-500">{summary?.pending ?? 0}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Won Contract Value</p>
              <p className="text-2xl font-bold mt-1 text-violet-500">{summary ? formatCurrency(summary.wonValue) : '₹0'}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-500">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bidder name, bid #..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tenderFilter} onValueChange={v => { setTenderFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Tender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenders</SelectItem>
                  {tenders.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.tenderNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(statusFilter !== 'all' || tenderFilter !== 'all' || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setTenderFilter('all'); setPage(1) }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="py-3 px-4 font-medium text-muted-foreground">Bid Info</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Associated Tender</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Bidder / Contractor</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground text-right">Bid Value</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground text-center">Tech / Fin Score</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground text-center">Overall</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {bids.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-base font-medium text-muted-foreground mb-1">No bids found</p>
                      <p className="text-sm text-muted-foreground/70 mb-4">
                        Record your first bid proposal to track technical and financial scoring.
                      </p>
                      <Button size="sm" onClick={() => { setSelected(null); setCreateOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" /> Record Bid
                      </Button>
                    </td>
                  </tr>
                ) : bids.map(b => {
                  const t = tenderMap.get(b.tenderId)
                  return (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div onClick={() => { setSelected(b); setViewOpen(true) }} className="cursor-pointer group">
                          <p className="font-medium group-hover:text-primary transition-colors">{b.bidNumber}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(b.submissionDate, 'date')}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-[200px]">
                          <p className="font-medium text-xs line-clamp-1">{t?.title || b.tenderId}</p>
                          <p className="text-xs text-muted-foreground">{t?.tenderNumber}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 opacity-60 shrink-0" />
                          <span className="line-clamp-1">{b.bidderName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                        {formatCurrency(b.bidValue, b.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        <span className="font-medium text-blue-500">{b.technicalScore ?? '—'}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="font-medium text-emerald-500">{b.financialScore ?? '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {b.overallScore ? (
                          <Badge variant="outline" className="font-bold">
                            {b.overallScore.toFixed(1)}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={STATUS_BADGE[b.status]} className="capitalize">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setSelected(b); setViewOpen(true) }}>
                              <Eye className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelected(b); setCreateOpen(true) }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit bid
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setBidToDelete(b)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={!!bidToDelete}
        onOpenChange={open => { if (!open) setBidToDelete(null) }}
        title="Delete Bid Record"
        description="Are you sure you want to delete this contractor bid proposal? This will remove all associated technical scores and financial quotes."
        itemName={bidToDelete ? `${bidToDelete.bidNumber} — ${bidToDelete.bidderName}` : undefined}
        onConfirm={handleDeleteConfirmed}
      />

      <BidFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={selected && createOpen ? selected : undefined}
        tenders={tenders}
        vendors={vendors}
        onClose={() => setSelected(null)}
        onSaved={() => { load(); setCreateOpen(false); setSelected(null) }}
      />

      <BidViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        bid={selected}
        tender={selected ? tenderMap.get(selected.tenderId) : null}
      />
    </div>
  )
}

function BidFormDialog({
  open, onOpenChange, initial, tenders, vendors, onClose, onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Bid
  tenders: Tender[]
  vendors: Vendor[]
  onClose: () => void
  onSaved: () => void
}) {
  const addToast = useAppStore(s => s.addToast)
  const isEdit = !!initial

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<BidCreateInput>({
    resolver: zodResolver(BidCreateSchema),
    defaultValues: {
      tenderId: tenders[0]?.id || '',
      bidNumber: `BID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      bidderName: '',
      bidValue: 0,
      currency: 'INR',
      submissionDate: new Date().toISOString().slice(0, 16),
      status: 'pending',
      technicalScore: undefined,
      financialScore: undefined,
      overallScore: undefined,
      isWinning: false,
      notes: ''
    }
  })

  const techScore = watch('technicalScore')
  const finScore = watch('financialScore')

  // Auto calculate overall score when tech or fin score changes
  useEffect(() => {
    if (techScore !== undefined && finScore !== undefined && !Number.isNaN(techScore) && !Number.isNaN(finScore)) {
      // 70% technical + 30% financial QCBS model
      const calc = Number((techScore * 0.7 + finScore * 0.3).toFixed(2))
      setValue('overallScore', calc)
    }
  }, [techScore, finScore, setValue])

  useEffect(() => {
    if (open && initial) {
      setValue('tenderId', initial.tenderId)
      setValue('bidNumber', initial.bidNumber)
      setValue('bidderName', initial.bidderName)
      setValue('bidValue', initial.bidValue)
      setValue('currency', initial.currency)
      setValue('submissionDate', initial.submissionDate.slice(0, 16))
      setValue('status', initial.status)
      setValue('technicalScore', initial.technicalScore)
      setValue('financialScore', initial.financialScore)
      setValue('overallScore', initial.overallScore)
      setValue('isWinning', initial.isWinning)
      setValue('notes', initial.notes || '')
    } else if (open) {
      reset({
        tenderId: tenders[0]?.id || '',
        bidNumber: `BID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        bidderName: vendors[0]?.name || '',
        bidValue: 0,
        currency: 'INR',
        submissionDate: new Date().toISOString().slice(0, 16),
        status: 'pending',
        technicalScore: 85,
        financialScore: 80,
        overallScore: 83.5,
        isWinning: false,
        notes: ''
      })
    }
  }, [open, initial, tenders, vendors])

  async function onSubmit(data: BidCreateInput) {
    if (!window.bidfly?.bid) return
    let res
    if (isEdit && initial) {
      res = await window.bidfly.bid.update({ ...data, id: initial.id })
    } else {
      res = await window.bidfly.bid.create(data)
    }
    if (res?.success) {
      useActivityStore.getState().logActivity(
        isEdit ? 'UPDATE' : 'CREATE',
        'Bid',
        data.bidNumber,
        `${isEdit ? 'Updated' : 'Recorded'} bid quote of ₹${data.bidValue.toLocaleString()} by ${data.bidderName}`,
        isEdit ? initial?.id : (res.data as any)?.id
      )
      addToast({
        title: isEdit ? 'Bid updated' : 'Bid recorded',
        description: data.bidNumber,
        variant: 'success'
      })
      onSaved()
    } else {
      addToast({ title: 'Save failed', description: res?.error, variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); onOpenChange(v) }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bid Proposal' : 'Record New Bid Proposal'}</DialogTitle>
          <DialogDescription>
            Enter bidder details, financial proposal value, and technical scoring metrics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="h-[55vh] pr-4 -mr-4">
            <div className="space-y-4">
              <div>
                <Label>Associated Tender *</Label>
                <Select value={watch('tenderId')} onValueChange={v => setValue('tenderId', v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select tender" /></SelectTrigger>
                  <SelectContent>
                    {tenders.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.tenderNumber} - {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tenderId && <p className="text-xs text-destructive mt-1">{errors.tenderId.message as string}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Bid Proposal Number *</Label>
                  <Input {...register('bidNumber')} placeholder="e.g. BID-2026-CPWD-01" />
                  {errors.bidNumber && <p className="text-xs text-destructive mt-1">{errors.bidNumber.message as string}</p>}
                </div>
                <div>
                  <Label>Bidder / Contractor Name *</Label>
                  <Input {...register('bidderName')} placeholder="e.g. Larsen & Toubro Ltd." />
                  {errors.bidderName && <p className="text-xs text-destructive mt-1">{errors.bidderName.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Bid Quote / Submitted Value (₹) *</Label>
                    {watch('bidValue') > 0 && (
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {formatCurrency(watch('bidValue'))}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="any"
                    {...register('bidValue', { valueAsNumber: true })}
                    placeholder="e.g. 28400000"
                    className="font-mono text-sm font-semibold mt-1"
                  />
                  {errors.bidValue && <p className="text-xs text-destructive mt-1">{errors.bidValue.message as string}</p>}
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={watch('currency')} onValueChange={v => setValue('currency', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['INR', 'USD', 'EUR', 'GBP'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Submission Date *</Label>
                  <Input type="datetime-local" {...register('submissionDate')} />
                </div>
              </div>

              <Separator />

              <h4 className="text-sm font-semibold">Evaluation Scores (QCBS Model 70:30)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Technical Score (0-100)</Label>
                  <Input type="number" step="0.1" min="0" max="100" {...register('technicalScore', { valueAsNumber: true })} placeholder="e.g. 92.5" />
                </div>
                <div>
                  <Label>Financial Score (0-100)</Label>
                  <Input type="number" step="0.1" min="0" max="100" {...register('financialScore', { valueAsNumber: true })} placeholder="e.g. 88.0" />
                </div>
                <div>
                  <Label>Overall QCBS Score</Label>
                  <Input type="number" step="0.1" min="0" max="100" {...register('overallScore', { valueAsNumber: true })} placeholder="Auto-calculated" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Evaluation Status</Label>
                  <Select value={watch('status')} onValueChange={v => setValue('status', v as BidStatus, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="won">Won / Awarded</SelectItem>
                      <SelectItem value="lost">Lost / Outbid</SelectItem>
                      <SelectItem value="disqualified">Disqualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Winning Contractor?</Label>
                  <Select value={watch('isWinning') ? 'yes' : 'no'} onValueChange={v => setValue('isWinning', v === 'yes')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes (L1 / Awarded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Evaluation Notes & Justification</Label>
                <Textarea rows={3} {...register('notes')} placeholder="Technical compliance deviations, price schedule breakdown, bank guarantee status..." />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Record Bid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BidViewDialog({
  open, onOpenChange, bid, tender
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  bid: Bid | null
  tender: Tender | null | undefined
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {bid && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span>{bid.bidNumber}</span>
                <Badge variant={STATUS_BADGE[bid.status]} className="capitalize">{bid.status}</Badge>
                {bid.isWinning && <Badge variant="success">L1 Winner</Badge>}
              </DialogTitle>
              <DialogDescription>
                Submitted for {tender?.title || bid.tenderId} ({tender?.tenderNumber})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground">Bidder Contractor</p>
                  <p className="font-semibold text-sm mt-1">{bid.bidderName}</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground">Financial Quote</p>
                  <p className="font-bold text-sm text-primary mt-1">{formatCurrency(bid.bidValue, bid.currency)}</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground">Submission Date</p>
                  <p className="font-semibold text-sm mt-1">{formatDate(bid.submissionDate, 'date')}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evaluation Matrix</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground">Technical</p>
                    <p className="text-xl font-bold text-blue-500 mt-1">{bid.technicalScore ?? '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground">Financial</p>
                    <p className="text-xl font-bold text-emerald-500 mt-1">{bid.financialScore ?? '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground">Composite QCBS</p>
                    <p className="text-xl font-bold text-primary mt-1">{bid.overallScore ?? '—'}</p>
                  </div>
                </div>
              </div>

              {bid.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Evaluation Remarks</p>
                  <p className="text-sm p-3 rounded-lg bg-muted/30 border whitespace-pre-wrap">{bid.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
