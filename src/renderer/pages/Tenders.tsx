import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Gavel, Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye,
  Download, Calendar, Building2, Tag, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, FileUp, Check, DollarSign, MapPin, Mail, Phone, ExternalLink
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader } from '@renderer/components/ui/card'
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
import { cn, formatCurrency, formatDate, formatRelativeTime, isOverdue, downloadFile } from '@shared/utils'
import type { Tender, TenderStatus, TenderPriority } from '@shared/types'
import { TenderCreateSchema, type TenderCreateInput, type PaginationParams } from '@shared/schemas'
import { useAppStore } from '@renderer/stores/app.store'
import { useActivityStore } from '@renderer/stores/activity.store'
import { ConfirmDeleteDialog } from '@renderer/components/ui/ConfirmDeleteDialog'
import { realtimeSync } from '@shared/utils/sync.service'
import { ExportMenu } from '@renderer/components/ui/export-menu'

const STATUS_BADGE: Record<TenderStatus, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  open: 'success',
  closed: 'destructive',
  awarded: 'default',
  draft: 'secondary',
  submitted: 'warning'
}

const PRIORITY_BADGE: Record<TenderPriority, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  critical: 'destructive'
}

export default function TendersPage() {
  const location = useLocation()
  const addToast = useAppStore(s => s.addToast)
  const logActivity = useActivityStore(s => s.logActivity)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [jumpPageInput, setJumpPageInput] = useState('1')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Tender | null>(null)
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Real-time broadcast sync listener
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'TENDER_MUTATED') {
        load()
      }
    })
    return unsubscribe
  }, [])

  // Handle URL query parameters (e.g. from global search or dashboard button)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    const action = params.get('action')
    if (q) setSearch(q)
    if (action === 'create') setCreateOpen(true)
  }, [location.search])

  const load = async () => {
    if (!window.bidfly?.tender) return
    setLoading(true)
    const params: any = { page, limit, sortBy: 'updated_at', sortOrder: 'desc' }
    if (search) params.search = search
    const f: Record<string, string> = {}
    if (statusFilter !== 'all') f.status = statusFilter
    if (priorityFilter !== 'all') f.priority = priorityFilter
    if (Object.keys(f).length) params.filters = f
    const res = await window.bidfly.tender.list(params)
    setLoading(false)
    if (res?.success && res.data) {
      setTenders(res.data.items)
      setTotal(res.data.total)
    } else if (res && !res.success) {
      addToast({ title: 'Failed to load tenders', description: res.error, variant: 'error' })
    }
  }

  useEffect(() => {
    load()
  }, [page, limit, statusFilter, priorityFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function handleDeleteConfirmed() {
    if (!tenderToDelete || !window.bidfly?.tender) return
    const id = tenderToDelete.id
    const title = tenderToDelete.title
    const res = await window.bidfly.tender.delete(id)
    if (res?.success) {
      logActivity('DELETE', 'Tender', tenderToDelete.tenderNumber, `Deleted tender: ${title}`, id)
      realtimeSync.broadcast('TENDER_MUTATED')
      addToast({ title: 'Tender deleted', description: title, variant: 'success' })
      load()
    } else {
      addToast({ title: 'Delete failed', description: res?.error, variant: 'error' })
    }
    setTenderToDelete(null)
  }

  function handleExportCSV() {
    if (tenders.length === 0) {
      addToast({ title: 'No tenders to export', variant: 'warning' })
      return
    }
    const headers = ['Tender Number', 'Title', 'Organization', 'Category', 'Value', 'Currency', 'Status', 'Priority', 'Publish Date', 'Deadline', 'Location', 'Contact']
    const rows = tenders.map(t => [
      `"${t.tenderNumber}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.organization.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.value,
      t.currency,
      t.status,
      t.priority,
      t.publishDate,
      t.submissionDeadline,
      `"${(t.submissionLocation || '').replace(/"/g, '""')}"`,
      `"${(t.contactPerson || '').replace(/"/g, '""')}"`
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `bidfly_tenders_${new Date().toISOString().slice(0, 10)}.csv`)
    addToast({ title: 'Tenders exported to CSV', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenders Workspace</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {total.toLocaleString()} tender{total !== 1 ? 's' : ''} total • Discover, evaluate, and track submissions
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <ExportMenu
            title="Tenders Workspace Master Directory"
            columns={[
              { header: 'Tender No', key: 'tenderNumber' },
              { header: 'Title', key: 'title' },
              { header: 'Organization', key: 'organization' },
              { header: 'Category', key: 'category' },
              { header: 'Estimated Value', key: 'value', formatter: (v: number) => formatCurrency(v) },
              { header: 'Status', key: 'status', formatter: (v: string) => v.toUpperCase() },
              { header: 'Priority', key: 'priority', formatter: (v: string) => v.toUpperCase() },
              { header: 'Deadline', key: 'submissionDeadline', formatter: (v: string) => formatDate(v) }
            ]}
            data={tenders}
          />
          <Button size="sm" onClick={() => { setSelected(null); setCreateOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> New Tender
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by number, title, org..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {(['draft', 'open', 'submitted', 'awarded', 'closed'] as const).map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {(['low', 'medium', 'high', 'critical'] as const).map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(statusFilter !== 'all' || priorityFilter !== 'all' || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setPage(1) }}>
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
                  <th className="py-3 px-4 font-medium text-muted-foreground">Tender</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Organization</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground text-right">Value</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Deadline</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Priority</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">Loading tenders...</td></tr>
                ) : tenders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Gavel className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-base font-medium text-muted-foreground mb-1">No tenders found</p>
                      <p className="text-sm text-muted-foreground/70 mb-4">
                        {search || statusFilter !== 'all' || priorityFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first tender to get started'}
                      </p>
                      <Button size="sm" onClick={() => { setSelected(null); setCreateOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" /> New Tender
                      </Button>
                    </td>
                  </tr>
                ) : tenders.map(t => {
                  const overdue = isOverdue(t.submissionDeadline)
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div onClick={() => { setSelected(t); setViewOpen(true) }} className="cursor-pointer group">
                          <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">{t.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.tenderNumber}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 opacity-60 shrink-0" />
                          <span className="line-clamp-1">{t.organization}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="gap-1 font-normal whitespace-nowrap">
                          <Tag className="h-3 w-3" /> {t.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                        {formatCurrency(t.value, t.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className={cn('h-3.5 w-3.5 shrink-0', overdue ? 'text-destructive' : 'text-muted-foreground')} />
                          <div>
                            <p className={cn('font-medium whitespace-nowrap', overdue ? 'text-destructive' : '')}>{formatDate(t.submissionDeadline, 'date')}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(t.submissionDeadline)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={STATUS_BADGE[t.status]}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={PRIORITY_BADGE[t.priority]}>
                          {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setSelected(t); setViewOpen(true) }}>
                              <Eye className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelected(t); setCreateOpen(true) }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit tender
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelected(t); setViewOpen(true) }}>
                              <FileUp className="h-4 w-4 mr-2" /> View documents
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setTenderToDelete(t)}
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {tenders.length ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} of {total} tenders
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Per page:</span>
                <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1) }}>
                  <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1} title="First page">
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Previous page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Page {page} of {totalPages}</span>
                </div>

                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} title="Next page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last page">
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-1.5 pl-2 border-l">
                <span className="text-xs text-muted-foreground">Go to:</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPageInput}
                  onChange={e => setJumpPageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const p = parseInt(jumpPageInput, 10)
                      if (!Number.isNaN(p) && p >= 1 && p <= totalPages) {
                        setPage(p)
                      }
                    }
                  }}
                  className="h-7 w-12 text-xs font-mono text-center p-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={!!tenderToDelete}
        onOpenChange={open => { if (!open) setTenderToDelete(null) }}
        title="Delete Tender Record"
        description="Are you sure you want to delete this tender and all its associated bid references from your database?"
        itemName={tenderToDelete ? `${tenderToDelete.tenderNumber} — ${tenderToDelete.title}` : undefined}
        onConfirm={handleDeleteConfirmed}
      />

      <TenderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={selected && createOpen ? selected : undefined}
        onClose={() => setSelected(null)}
        onSaved={() => { load(); setCreateOpen(false); setSelected(null); }}
      />

      <TenderViewDialog open={viewOpen} onOpenChange={setViewOpen} tender={selected} onEdit={(t) => { setSelected(t); setCreateOpen(true) }} />
    </div>
  )
}

interface FormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Tender
  onClose: () => void
  onSaved: () => void
}

function TenderFormDialog({ open, onOpenChange, initial, onClose, onSaved }: FormDialogProps) {
  const addToast = useAppStore(s => s.addToast)
  const logActivity = useActivityStore(s => s.logActivity)
  const isEdit = !!initial

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch
  } = useForm<TenderCreateInput>({
    resolver: zodResolver(TenderCreateSchema),
    defaultValues: {
      tenderNumber: '',
      title: '',
      description: '',
      organization: '',
      category: 'Civil Works',
      value: 0,
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
  })

  useEffect(() => {
    if (open && initial) {
      setValue('tenderNumber', initial.tenderNumber)
      setValue('title', initial.title)
      setValue('description', initial.description || '')
      setValue('organization', initial.organization)
      setValue('category', initial.category)
      setValue('value', initial.value)
      setValue('currency', initial.currency)
      setValue('status', initial.status)
      setValue('priority', initial.priority)
      setValue('publishDate', initial.publishDate.slice(0, 16))
      setValue('submissionDeadline', initial.submissionDeadline.slice(0, 16))
      setValue('submissionLocation', initial.submissionLocation || '')
      setValue('contactPerson', initial.contactPerson || '')
      setValue('contactEmail', initial.contactEmail || '')
      setValue('contactPhone', initial.contactPhone || '')
      setValue('notes', initial.notes || '')
    } else if (open) {
      reset({
        tenderNumber: `TND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: '',
        description: '',
        organization: '',
        category: 'Civil Works',
        value: 0,
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
      })
    }
  }, [open, initial])

  async function onSubmit(data: TenderCreateInput) {
    try {
      if (!window.bidfly?.tender) return
      let res
      if (isEdit && initial) {
        res = await window.bidfly.tender.update({ ...data, id: initial.id })
      } else {
        res = await window.bidfly.tender.create(data)
      }
      if (res?.success) {
        logActivity(
          isEdit ? 'UPDATE' : 'CREATE',
          'Tender',
          data.tenderNumber,
          `${isEdit ? 'Updated' : 'Created'} tender "${data.title}" for ${data.organization}`,
          isEdit ? initial?.id : (res.data as any)?.id
        )
        realtimeSync.broadcast('TENDER_MUTATED')
        addToast({
          title: isEdit ? 'Tender updated' : 'Tender created',
          description: data.title,
          variant: 'success'
        })
        onSaved()
      } else {
        addToast({ title: 'Save failed', description: res?.error, variant: 'error' })
      }
    } catch (e) {
      addToast({ title: 'Unexpected error', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); onOpenChange(v) }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tender Record' : 'Create New Tender'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update tender information, dates, and budget details.' : 'Fill in the tender metadata, issuing authority, and submission deadline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <ScrollArea className="h-[60vh] pr-4 -mr-4">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tender Number *</Label>
                  <Input {...register('tenderNumber')} className={errors.tenderNumber ? 'border-destructive' : ''} placeholder="e.g. CPWD/2026/CIVIL/8841" />
                  {errors.tenderNumber && <p className="text-xs text-destructive mt-1">{errors.tenderNumber.message as string}</p>}
                </div>
                <div>
                  <Label>Issuing Organization *</Label>
                  <Input {...register('organization')} className={errors.organization ? 'border-destructive' : ''} placeholder="e.g. Central Public Works Department" />
                  {errors.organization && <p className="text-xs text-destructive mt-1">{errors.organization.message as string}</p>}
                </div>
              </div>

              <div>
                <Label>Tender Title *</Label>
                <Input {...register('title')} className={errors.title ? 'border-destructive' : ''} placeholder="e.g. Construction of Multi-Specialty Hospital Block" />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message as string}</p>}
              </div>

              <div>
                <Label>Scope & Description</Label>
                <Textarea rows={3} {...register('description')} placeholder="Detailed scope of work, technical specifications, and milestones..." />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={watch('category')} onValueChange={v => setValue('category', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Civil Works', 'IT & Software', 'Consulting', 'Supply & Procurement', 'Services', 'Manufacturing', 'Infrastructure', 'Healthcare', 'Education', 'Other'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select value={watch('status')} onValueChange={v => setValue('status', v as TenderStatus, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['draft', 'open', 'submitted', 'awarded', 'closed'] as const).map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority Level *</Label>
                  <Select value={watch('priority')} onValueChange={v => setValue('priority', v as TenderPriority, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['low', 'medium', 'high', 'critical'] as const).map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Estimated Value (₹) *</Label>
                  <Input type="number" step="any" {...register('value', { valueAsNumber: true })} placeholder="0" />
                  {errors.value && <p className="text-xs text-destructive mt-1">{errors.value.message as string}</p>}
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={watch('currency')} onValueChange={v => setValue('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Submission Location / Portal</Label>
                  <Input {...register('submissionLocation')} placeholder="e.g. GeM Portal / New Delhi" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Publish Date *</Label>
                  <Input type="datetime-local" {...register('publishDate')} />
                </div>
                <div>
                  <Label>Submission Deadline *</Label>
                  <Input type="datetime-local" {...register('submissionDeadline')} />
                  {errors.submissionDeadline && <p className="text-xs text-destructive mt-1">{errors.submissionDeadline.message as string}</p>}
                </div>
              </div>

              <Separator />

              <h4 className="text-sm font-semibold">Contact & Authority Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input {...register('contactPerson')} placeholder="e.g. Er. Rajeshwar Sharma" />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input type="email" {...register('contactEmail')} placeholder="e.g. contact@dept.gov.in" />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input {...register('contactPhone')} placeholder="e.g. +91 11 2338 0000" />
                </div>
              </div>

              <div>
                <Label>Internal Evaluation Notes</Label>
                <Textarea rows={3} {...register('notes')} placeholder="EMD terms, pre-bid queries, tender fee, joint-venture requirements..." />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Tender'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TenderViewDialog({
  open, onOpenChange, tender, onEdit
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  tender: Tender | null
  onEdit: (t: Tender) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {tender && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-xl">{tender.title}</DialogTitle>
                  <DialogDescription className="mt-1">
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="secondary">{tender.tenderNumber}</Badge>
                      <Badge variant={STATUS_BADGE[tender.status]}>{tender.status.toUpperCase()}</Badge>
                      <Badge variant={PRIORITY_BADGE[tender.priority]}>{tender.priority.toUpperCase()} PRIORITY</Badge>
                    </div>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4 -mr-4">
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground font-medium">Estimated Budget</p>
                      <p className="font-bold text-base mt-1 text-primary">{formatCurrency(tender.value, tender.currency)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground font-medium">Category</p>
                      <p className="font-bold text-base mt-1">{tender.category}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground font-medium">Published Date</p>
                      <p className="font-semibold text-sm mt-1">{formatDate(tender.publishDate, 'date')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground font-medium">Deadline</p>
                      <p className="font-semibold text-sm mt-1 text-rose-500">{formatDate(tender.submissionDeadline, 'date')}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issuing Authority</p>
                    <p className="text-sm font-medium">{tender.organization}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Official</p>
                    <p className="text-sm font-medium">{tender.contactPerson || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Official Email</p>
                    <p className="text-sm font-mono">{tender.contactEmail || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone / Hotline</p>
                    <p className="text-sm font-mono">{tender.contactPhone || '—'}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submission Location</p>
                    <p className="text-sm">{tender.submissionLocation || '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Scope Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{tender.description || 'No description provided.'}</p>
                </div>

                {tender.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Internal Evaluation Notes</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">{tender.notes}</p>
                  </div>
                )}

                {tender.documents && tender.documents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attached Documents ({tender.documents.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {tender.documents.map((d: string) => (
                        <div key={d} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs font-medium">
                          <FileUp className="h-3.5 w-3.5 text-primary" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tender.tags && tender.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tender.tags.map((t: string) => <Badge key={t} variant="outline" className="gap-1"><Tag className="h-3 w-3" />{t}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
              <Button variant="outline" onClick={() => { onOpenChange(false); onEdit(tender) }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Tender
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
