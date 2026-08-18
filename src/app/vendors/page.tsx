"use client";

import { useEffect, useState, useRef } from 'react'
import {
  Users, Plus, Search, MoreHorizontal, Pencil, Trash2, Eye,
  Star, Mail, Phone, MapPin, Award, CheckCircle2, XCircle,
  Building, Download, Upload, Filter, Tag,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Building2, ShieldCheck, Check
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn, downloadFile } from '@/lib/utils'
import type { Vendor, VendorStatus } from '@/lib/types'
import { VendorCreateSchema, type VendorCreateInput, type PaginationParams } from '@/lib/schemas'
import { useAppStore } from '@/stores/app.store'
import { useActivityStore } from '@/stores/activity.store'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { realtimeSync } from '@/lib/utils'

const STATUS_BADGE: Record<VendorStatus, 'default' | 'success' | 'destructive' | 'secondary'> = {
  active: 'success',
  inactive: 'secondary',
  blacklisted: 'destructive'
}

export default function VendorsPage() {
  const addToast = useAppStore(s => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [jumpPageInput, setJumpPageInput] = useState('1')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null)
  const logActivity = useActivityStore(s => s.logActivity)

  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'VENDOR_MUTATED') {
        load()
      }
    })
    return unsubscribe
  }, [])

  const load = async () => {
    if (!window.bidfly?.vendor) return
    const params: any = { page, limit, sortBy: 'name', sortOrder: 'asc' }
    if (search) params.search = search
    if (statusFilter !== 'all') params.filters = { status: statusFilter }
    const res = await window.bidfly.vendor.list(params)
    if (res?.success && res.data) {
      setVendors(res.data.items)
      setTotal(res.data.total)
    }
  }

  useEffect(() => {
    load()
  }, [page, limit, statusFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleDeleteConfirmed() {
    if (!vendorToDelete || !window.bidfly?.vendor) return
    const id = vendorToDelete.id
    const name = vendorToDelete.name
    const res = await window.bidfly.vendor.delete(id)
    if (res?.success) {
      logActivity('DELETE', 'Vendor', name, `Removed vendor/contractor profile from database`, id)
      realtimeSync.broadcast('VENDOR_MUTATED')
      addToast({ title: 'Vendor removed', description: name, variant: 'success' })
      load()
    } else {
      addToast({ title: 'Delete failed', description: res?.error, variant: 'error' })
    }
    setVendorToDelete(null)
  }

  function handleExportCSV() {
    if (vendors.length === 0) {
      addToast({ title: 'No vendors to export', variant: 'warning' })
      return
    }
    const headers = ['Name', 'Registration #', 'Tax ID / GST', 'Email', 'Phone', 'Contact Person', 'City', 'State', 'Categories', 'Rating', 'Status']
    const rows = vendors.map(v => [
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.registrationNumber}"`,
      `"${v.taxId}"`,
      `"${v.email}"`,
      `"${v.phone}"`,
      `"${v.contactPerson}"`,
      `"${v.city}"`,
      `"${v.state}"`,
      `"${(v.categories || []).join('; ')}"`,
      v.rating ?? '',
      v.status
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `bidfly_vendors_${new Date().toISOString().slice(0, 10)}.csv`)
    addToast({ title: 'Vendors exported to CSV', variant: 'success' })
  }

  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length <= 1) {
          addToast({ title: 'CSV file is empty', variant: 'warning' })
          return
        }
        let count = 0
        let skipped = 0
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim())
          if (cols[0] && window.bidfly?.vendor) {
            const res = await window.bidfly.vendor.create({
              name: cols[0],
              registrationNumber: cols[1] || '',
              taxId: cols[2] || '',
              email: cols[3] || '',
              phone: cols[4] || '',
              contactPerson: cols[5] || '',
              city: cols[6] || '',
              state: cols[7] || '',
              categories: cols[8] ? cols[8].split(';').map(c => c.trim()) : [],
              rating: cols[9] ? parseFloat(cols[9]) : undefined,
              status: (cols[10] as any) || 'active',
              notes: '',
              address: '',
              country: 'India',
              pincode: '',
              certifications: []
            })
            if (res.success) {
              count++
            } else {
              skipped++
            }
          }
        }
        if (skipped > 0) {
          addToast({ title: `Imported ${count} vendors (${skipped} duplicates skipped)`, variant: 'warning' })
        } else {
          addToast({ title: `Imported ${count} vendors successfully`, variant: 'success' })
        }
        load()
      } catch (err) {
        addToast({ title: 'Failed to parse CSV', variant: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Empaneled suppliers, EPC contractors, JV partners & rating matrix
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => { setSelected(null); setCreateOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Add Vendor
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
                  placeholder="Search vendor name, email, reg #..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
              {(statusFilter !== 'all' || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1) }}>
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
                  <th className="py-3 px-4 font-medium text-muted-foreground">Vendor Name</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Contact & Email</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Location</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Categories</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground text-center">Rating</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-base font-medium text-muted-foreground mb-1">No vendors found</p>
                      <p className="text-sm text-muted-foreground/70 mb-4">
                        Add empanelled contractors or suppliers to collaborate on tender bidding.
                      </p>
                      <Button size="sm" onClick={() => { setSelected(null); setCreateOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Vendor
                      </Button>
                    </td>
                  </tr>
                ) : vendors.map(v => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div onClick={() => { setSelected(v); setViewOpen(true) }} className="cursor-pointer group">
                        <p className="font-semibold group-hover:text-primary transition-colors">{v.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{v.taxId || v.registrationNumber || 'No Reg #'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-xs">{v.contactPerson || '—'}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{v.email || v.phone || '—'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{v.city ? `${v.city}, ${v.state}` : '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {(v.categories || []).slice(0, 2).map(c => (
                          <Badge key={c} variant="secondary" className="text-xs font-normal">
                            {c}
                          </Badge>
                        ))}
                        {(v.categories?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            +{(v.categories?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {v.rating ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{v.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={v.status === 'active' ? 'success' : v.status === 'blacklisted' ? 'destructive' : 'secondary'} className="capitalize">
                        {v.status}
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
                          <DropdownMenuItem onClick={() => { setSelected(v); setViewOpen(true) }}>
                            <Eye className="h-4 w-4 mr-2" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelected(v); setCreateOpen(true) }}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit vendor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setVendorToDelete(v)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {vendors.length ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} of {total} vendors
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
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
                </div>

                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page >= Math.ceil(total / limit)} title="Next page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(Math.max(1, Math.ceil(total / limit)))} disabled={page >= Math.ceil(total / limit)} title="Last page">
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-1.5 pl-2 border-l">
                <span className="text-xs text-muted-foreground">Go to:</span>
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, Math.ceil(total / limit))}
                  value={jumpPageInput}
                  onChange={e => setJumpPageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const p = parseInt(jumpPageInput, 10)
                      const maxP = Math.max(1, Math.ceil(total / limit))
                      if (!Number.isNaN(p) && p >= 1 && p <= maxP) {
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
        open={!!vendorToDelete}
        onOpenChange={open => { if (!open) setVendorToDelete(null) }}
        title="Delete Vendor Profile"
        description="Are you sure you want to remove this contractor/vendor from your empanelment directory?"
        itemName={vendorToDelete ? `${vendorToDelete.name} (${vendorToDelete.taxId || vendorToDelete.registrationNumber || 'Vendor'})` : undefined}
        onConfirm={handleDeleteConfirmed}
      />

      <VendorFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={selected && createOpen ? selected : undefined}
        onClose={() => setSelected(null)}
        onSaved={() => { load(); setCreateOpen(false); setSelected(null) }}
      />

      <VendorViewDialog open={viewOpen} onOpenChange={setViewOpen} vendor={selected} onEdit={(v) => { setSelected(v); setCreateOpen(true) }} />
    </div>
  )
}

function VendorFormDialog({
  open, onOpenChange, initial, onClose, onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Vendor
  onClose: () => void
  onSaved: () => void
}) {
  const addToast = useAppStore(s => s.addToast)
  const isEdit = !!initial
  const [categoriesText, setCategoriesText] = useState('')
  const [certsText, setCertsText] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<VendorCreateInput>({
    resolver: zodResolver(VendorCreateSchema) as any,
    defaultValues: {
      name: '',
      registrationNumber: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      contactPerson: '',
      categories: [],
      certifications: [],
      rating: 4.5,
      status: 'active',
      notes: ''
    }
  })

  useEffect(() => {
    if (open && initial) {
      setValue('name', initial.name)
      setValue('registrationNumber', initial.registrationNumber || '')
      setValue('taxId', initial.taxId || '')
      setValue('email', initial.email || '')
      setValue('phone', initial.phone || '')
      setValue('address', initial.address || '')
      setValue('city', initial.city || '')
      setValue('state', initial.state || '')
      setValue('country', initial.country || 'India')
      setValue('pincode', initial.pincode || '')
      setValue('contactPerson', initial.contactPerson || '')
      setValue('rating', initial.rating || 4.5)
      setValue('status', initial.status)
      setValue('notes', initial.notes || '')
      setCategoriesText((initial.categories || []).join(', '))
      setCertsText((initial.certifications || []).join(', '))
    } else if (open) {
      reset({
        name: '',
        registrationNumber: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        contactPerson: '',
        categories: [],
        certifications: [],
        rating: 4.5,
        status: 'active',
        notes: ''
      })
      setCategoriesText('Civil Works, EPC')
      setCertsText('ISO 9001:2015')
    }
  }, [open, initial])

  async function onSubmit(data: VendorCreateInput) {
    if (!window.bidfly?.vendor) return
    const formattedData: VendorCreateInput = {
      ...data,
      categories: categoriesText.split(',').map(s => s.trim()).filter(Boolean),
      certifications: certsText.split(',').map(s => s.trim()).filter(Boolean)
    }
    let res
    if (isEdit && initial) {
      res = await window.bidfly.vendor.update({ ...formattedData, id: initial.id })
    } else {
      res = await window.bidfly.vendor.create(formattedData)
    }
    if (res?.success) {
      useActivityStore.getState().logActivity(
        isEdit ? 'UPDATE' : 'CREATE',
        'Vendor',
        data.name,
        `${isEdit ? 'Updated' : 'Empaneled'} vendor/contractor (${formattedData.city || 'India'})`,
        isEdit ? initial?.id : (res.data as any)?.id
      )
      realtimeSync.broadcast('VENDOR_MUTATED')
      addToast({
        title: isEdit ? 'Vendor updated' : 'Vendor added',
        description: data.name,
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
          <DialogTitle>{isEdit ? 'Edit Vendor Details' : 'Empanel New Vendor'}</DialogTitle>
          <DialogDescription>
            Register company credentials, tax registration numbers, and competency tags.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="h-[55vh] pr-4 -mr-4">
            <div className="space-y-4">
              <div>
                <Label>Company / Contractor Legal Name *</Label>
                <Input {...register('name')} placeholder="e.g. Larsen & Toubro Limited" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message as string}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Corporate Registration (CIN / ROC)</Label>
                  <Input {...register('registrationNumber')} placeholder="e.g. L99999MH1946PLC004768" />
                </div>
                <div>
                  <Label>GSTIN / Tax ID</Label>
                  <Input {...register('taxId')} placeholder="e.g. 27AAACL0140P1ZT" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Official Email</Label>
                  <Input type="email" {...register('email')} placeholder="tenders@company.com" />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input {...register('phone')} placeholder="+91 22 6752 0000" />
                </div>
                <div>
                  <Label>Primary Contact Person</Label>
                  <Input {...register('contactPerson')} placeholder="e.g. Rajesh Khurana" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="Mumbai" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input {...register('state')} placeholder="Maharashtra" />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input {...register('pincode')} placeholder="400001" />
                </div>
              </div>

              <div>
                <Label>Registered Office Address</Label>
                <Input {...register('address')} placeholder="e.g. L&T House, Ballard Estate" />
              </div>

              <Separator />

              <div>
                <Label>Industry Categories (comma-separated)</Label>
                <Input value={categoriesText} onChange={e => setCategoriesText(e.target.value)} placeholder="e.g. Civil Works, EPC, Power, Healthcare" />
              </div>

              <div>
                <Label>Certifications & Quality Standards (comma-separated)</Label>
                <Input value={certsText} onChange={e => setCertsText(e.target.value)} placeholder="e.g. ISO 9001:2015, ISO 14001, CMMI Level 5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Empanelment Status</Label>
                  <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Empaneled</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blacklisted">Blacklisted / Disqualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Performance Rating (0.0 to 5.0)</Label>
                  <Input type="number" step="0.1" min="0" max="5" {...register('rating', { valueAsNumber: true })} />
                </div>
              </div>

              <div>
                <Label>Vendor Track Record & Notes</Label>
                <Textarea rows={3} {...register('notes')} placeholder="Equipment fleet size, annual turnover, past performance evaluations..." />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Empanel Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function VendorViewDialog({
  open, onOpenChange, vendor, onEdit
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  vendor: Vendor | null
  onEdit: (v: Vendor) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {vendor && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 text-xl">
                <span>{vendor.name}</span>
                <Badge variant={vendor.status === 'active' ? 'success' : vendor.status === 'blacklisted' ? 'destructive' : 'secondary'} className="capitalize">
                  {vendor.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Empaneled Vendor Profile • Registered {vendor.city ? `${vendor.city}, ${vendor.state}` : 'India'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground">GSTIN / Tax ID</p>
                  <p className="font-mono text-sm font-semibold mt-1">{vendor.taxId || '—'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground">Registration Number</p>
                  <p className="font-mono text-sm font-semibold mt-1">{vendor.registrationNumber || '—'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground">Partner Rating</p>
                  <p className="font-bold text-sm text-amber-500 mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-500" />
                    <span>{vendor.rating ? vendor.rating.toFixed(1) : 'Unrated'} / 5.0</span>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Representative</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Name</span>
                    <span className="font-medium">{vendor.contactPerson || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Email</span>
                    <span className="font-mono text-xs">{vendor.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Phone</span>
                    <span className="font-mono text-xs">{vendor.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {vendor.categories && vendor.categories.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Domain Competencies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.categories.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                  </div>
                </div>
              )}

              {vendor.certifications && vendor.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Certifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.certifications.map(c => <Badge key={c} variant="outline" className="gap-1"><Award className="h-3 w-3" />{c}</Badge>)}
                  </div>
                </div>
              )}

              {vendor.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Evaluation Notes</p>
                  <p className="text-sm p-3 rounded-lg bg-muted/30 border whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
              <Button variant="outline" onClick={() => { onOpenChange(false); onEdit(vendor) }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Vendor
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
