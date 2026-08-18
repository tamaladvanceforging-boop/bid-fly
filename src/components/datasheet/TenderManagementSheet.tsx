import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Download, Upload, Plus, Trash2, Search, Filter, RefreshCw,
  Building2, CheckCircle2, AlertCircle, Clock, FileSpreadsheet,
  Edit2, Save, MoreHorizontal, ArrowUpDown, ChevronDown, Sparkles,
  RotateCcw, History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useActivityStore } from '@/stores/activity.store'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { formatCurrency, formatDate, downloadFile, cn } from '@/lib/utils'

export interface TenderRowItem {
  id: string
  slNo: number
  division: string // e.g. 'AF', 'AEC', or other company code
  tenderId: string // e.g. 'GEM/2026/B/7793438'
  portal: string // 'GeM', 'CPP', 'FLANGES', etc.
  departmentName: string // 'BHEL', 'Bhilai Steel Plant', 'NFL', 'IOCL', 'BPCL', etc.
  tenderTitle: string
  startDate: string
  endDate: string
  daysLeft: string // '0', '3', '5', '13', '17', 'Closed'
  submissionDate: string
  tenderStatus: 'Lapsed' | 'Submitted' | 'Ongoing' | 'Not Started' | 'Awarded'
  remarks: string
  remarks2: string
  result: string // 'L1', 'L2', 'Under Evaluation', 'Won', 'Lost', '(blank)'
  submittedValue: number // e.g. 28400000
}

// Initial empty dataset for fresh workspaces
export const INITIAL_EXCEL_ROWS: TenderRowItem[] = []

const LOCAL_STORAGE_KEY = 'bidfly_tender_datasheet_rows'

export default function TenderManagementSheet() {
  const addToast = useAppStore(s => s.addToast)
  const { companies, addCompany, removeCompany } = useAuthStore()
  const { activities, logActivity } = useActivityStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [rows, setRows] = useState<TenderRowItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  // Slicer Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog State
  const [addRowOpen, setAddRowOpen] = useState(false)
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)
  const [activityLogsOpen, setActivityLogsOpen] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<TenderRowItem | null>(null)
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ row: TenderRowItem; index: number } | null>(null)
  const [newCompCode, setNewCompCode] = useState('')
  const [newCompName, setNewCompName] = useState('')
  const [inlineCompCode, setInlineCompCode] = useState('')
  const [inlineCompName, setInlineCompName] = useState('')
  const [createCompanyInline, setCreateCompanyInline] = useState(false)

  // New Row Form
  const [newRow, setNewRow] = useState<Partial<TenderRowItem>>({
    division: '',
    tenderId: '',
    portal: 'GeM',
    departmentName: '',
    tenderTitle: '',
    startDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    endDate: '',
    daysLeft: '7',
    submissionDate: '',
    tenderStatus: 'Ongoing',
    remarks: '',
    remarks2: '',
    result: '',
    submittedValue: 0
  })

  // Save to localStorage
  const saveRows = (newRows: TenderRowItem[]) => {
    setRows(newRows)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRows))
    } catch {}
  }

  // Calculate Dynamic KPI Summaries
  const companySums = useMemo(() => {
    const sums: Record<string, number> = {}
    companies.forEach(c => { sums[c.code] = 0 })
    
    rows.forEach(r => {
      if (r.submittedValue && r.division) {
        sums[r.division] = (sums[r.division] || 0) + r.submittedValue
      }
    })
    return sums
  }, [rows, companies])

  const grandTotalSubmitted = useMemo(() => {
    return rows.reduce((acc, r) => acc + (r.submittedValue || 0), 0)
  }, [rows])

  // Extract unique departments for Slicer
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>()
    rows.forEach(r => { if (r.departmentName) set.add(r.departmentName) })
    return Array.from(set).sort()
  }, [rows])

  // Filtered rows based on Slicers and Search
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (selectedDept !== 'ALL' && r.departmentName !== selectedDept) return false
      if (selectedStatus !== 'ALL' && r.tenderStatus !== selectedStatus) return false
      if (selectedDivision !== 'ALL' && r.division !== selectedDivision) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          r.tenderId.toLowerCase().includes(q) ||
          r.departmentName.toLowerCase().includes(q) ||
          r.tenderTitle.toLowerCase().includes(q) ||
          r.portal.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q) ||
          r.remarks2.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [rows, selectedDept, selectedStatus, selectedDivision, searchQuery])

  // Handlers
  const handleCellEdit = (id: string, field: keyof TenderRowItem, value: any) => {
    const target = rows.find(r => r.id === id)
    if (field === 'tenderId') {
      const trimmed = String(value).trim()
      const duplicate = rows.find(r => r.id !== id && r.tenderId.trim().toLowerCase() === trimmed.toLowerCase())
      if (duplicate) {
        addToast({
          title: 'Duplicate Tender ID Blocked',
          description: `Tender ID "${trimmed}" is already used in row #${duplicate.slNo}. Duplicate entry rejected.`,
          variant: 'error'
        })
        return
      }
    }
    const updated = rows.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value }
      }
      return r
    })
    saveRows(updated)
    if (target && target[field] !== value) {
      logActivity(
        'UPDATE',
        'Datasheet',
        target.tenderId,
        `Modified ${String(field)}: "${target[field]}" → "${value}"`,
        id
      )
    }
  }

  const handleAddNewRow = () => {
    if (!newRow.tenderId || !newRow.tenderTitle) {
      addToast({ title: 'Please provide Tender ID and Title', variant: 'warning' })
      return
    }

    const trimmedId = newRow.tenderId.trim()
    const duplicate = rows.find(r => r.tenderId.trim().toLowerCase() === trimmedId.toLowerCase())
    if (duplicate) {
      addToast({
        title: 'Duplicate Tender ID Blocked',
        description: `Tender ID "${trimmedId}" already exists in datasheet (Row #${duplicate.slNo}). Duplicates are not allowed.`,
        variant: 'error'
      })
      return
    }

    let targetDivision = newRow.division || ''
    if ((companies.length === 0 || createCompanyInline || !targetDivision) && inlineCompCode.trim()) {
      const code = inlineCompCode.trim().toUpperCase()
      const name = inlineCompName.trim() || `${code} Enterprise`
      if (!companies.some(c => c.code === code)) {
        addCompany(code, name)
      }
      targetDivision = code
    } else if (!targetDivision && companies.length > 0) {
      targetDivision = companies[0].code
    }

    const created: TenderRowItem = {
      id: 'row-' + Date.now(),
      slNo: rows.length > 0 ? Math.max(...rows.map(r => r.slNo)) + 1 : 1,
      division: targetDivision || 'DEFAULT',
      tenderId: trimmedId,
      portal: newRow.portal || 'GeM',
      departmentName: newRow.departmentName || 'Authority / Client',
      tenderTitle: newRow.tenderTitle.trim(),
      startDate: newRow.startDate || '',
      endDate: newRow.endDate || '',
      daysLeft: newRow.daysLeft || '7',
      submissionDate: newRow.submissionDate || '',
      tenderStatus: newRow.tenderStatus as any || 'Ongoing',
      remarks: newRow.remarks || '',
      remarks2: newRow.remarks2 || '',
      result: newRow.result || '',
      submittedValue: Number(newRow.submittedValue) || 0
    }
    saveRows([...rows, created])
    setAddRowOpen(false)
    setInlineCompCode('')
    setInlineCompName('')
    setCreateCompanyInline(false)
    logActivity('CREATE', 'Datasheet', created.tenderId, `Added row for ${created.departmentName} (Quote: ₹${created.submittedValue.toLocaleString()})`, created.id)
    addToast({ title: 'Tender row added', description: created.tenderId, variant: 'success' })
  }

  const handleDeleteConfirmed = () => {
    if (!rowToDelete) return
    const idx = rows.findIndex(r => r.id === rowToDelete.id)
    setRecentlyDeleted({ row: rowToDelete, index: idx })
    saveRows(rows.filter(r => r.id !== rowToDelete.id))
    logActivity('DELETE', 'Datasheet', rowToDelete.tenderId, `Deleted tender row for ${rowToDelete.departmentName}`, rowToDelete.id)
    addToast({
      title: 'Tender row deleted',
      description: `${rowToDelete.tenderId} removed. Click "Undo" below to restore.`,
      variant: 'default'
    })
    setRowToDelete(null)
  }

  const handleUndoDelete = () => {
    if (!recentlyDeleted) return
    const next = [...rows]
    next.splice(recentlyDeleted.index, 0, recentlyDeleted.row)
    saveRows(next)
    logActivity('RESTORE', 'Datasheet', recentlyDeleted.row.tenderId, `Restored deleted tender row`, recentlyDeleted.row.id)
    addToast({
      title: 'Tender row restored',
      description: `${recentlyDeleted.row.tenderId} restored back into datasheet`,
      variant: 'success'
    })
    setRecentlyDeleted(null)
  }

  const handleAddNewCompany = () => {
    if (!newCompCode.trim() || !newCompName.trim()) return
    const code = newCompCode.trim().toUpperCase()
    if (companies.some(c => c.code === code)) {
      addToast({
        title: 'Duplicate Company Code',
        description: `A company with code "${code}" already exists in your entity list.`,
        variant: 'error'
      })
      return
    }
    addCompany(code, newCompName.trim())
    setAddCompanyOpen(false)
    logActivity('CREATE', 'Datasheet', code, `Added client entity profile: ${newCompName.trim()}`)
    setNewCompCode('')
    setNewCompName('')
    addToast({ title: 'Company / Client added', description: newCompName, variant: 'success' })
  }

  const handleExportCSV = () => {
    const headers = [
      'SL No', 'AF/AEC', 'Tender ID/ Reference Number', 'Portal', 'Department Name',
      'Tender Title', 'Start Date', 'End Date', "Day's left", 'Submission Date',
      'Tender Status', 'Remarks', 'Remarks 2', 'Result', 'Submitted value'
    ]
    const csvRows = filteredRows.map(r => [
      r.slNo,
      `"${r.division}"`,
      `"${r.tenderId}"`,
      `"${r.portal}"`,
      `"${r.departmentName}"`,
      `"${r.tenderTitle.replace(/"/g, '""')}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      `"${r.daysLeft}"`,
      `"${r.submissionDate}"`,
      `"${r.tenderStatus}"`,
      `"${r.remarks.replace(/"/g, '""')}"`,
      `"${r.remarks2.replace(/"/g, '""')}"`,
      `"${r.result}"`,
      r.submittedValue
    ])
    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `Tender_Management_Sheet_${new Date().toISOString().slice(0, 10)}.csv`)
    addToast({ title: 'Datasheet exported to CSV', variant: 'success' })
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length <= 1) return

        const parsedRows: TenderRowItem[] = []
        lines.slice(1).forEach((line, i) => {
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
          if (cols.length >= 5) {
            parsedRows.push({
              id: 'imp-' + Date.now() + '-' + i,
              slNo: parseInt(cols[0], 10) || i + 1,
              division: cols[1] || 'AF',
              tenderId: cols[2] || `TND-${i}`,
              portal: cols[3] || 'GeM',
              departmentName: cols[4] || 'General',
              tenderTitle: cols[5] || 'Procurement Package',
              startDate: cols[6] || '',
              endDate: cols[7] || '',
              daysLeft: cols[8] || '7',
              submissionDate: cols[9] || '',
              tenderStatus: (cols[10] as any) || 'Ongoing',
              remarks: cols[11] || '',
              remarks2: cols[12] || '',
              result: cols[13] || '',
              submittedValue: parseFloat(cols[14]) || 0
            })
          }
        })
        if (parsedRows.length > 0) {
          saveRows(parsedRows)
          addToast({ title: `Imported ${parsedRows.length} rows successfully`, variant: 'success' })
        }
      } catch {
        addToast({ title: 'Failed to import CSV', variant: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />

      {/* Header Title Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-background border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black tracking-tight">
                Tender Management Datasheet Automation
              </h2>
              <p className="text-xs text-muted-foreground">
                Multi-Company & Entity Bidding Sheet • Exact Excel Slicers & Dynamic KPI Calculation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActivityLogsOpen(true)}>
            <Clock className="h-4 w-4 mr-1.5 text-blue-500" /> Activity History ({activities.length})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddCompanyOpen(true)}>
            <Building2 className="h-4 w-4 mr-1.5" /> + Add Client/Company
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Export Excel/CSV
          </Button>
          <Button size="sm" onClick={() => setAddRowOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Tender Row
          </Button>
        </div>
      </div>

      {/* Undo Banner if recently deleted */}
      {recentlyDeleted && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between animate-in fade-in-0">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Tender <strong>{recentlyDeleted.row.tenderId}</strong> was removed.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 font-bold" onClick={handleUndoDelete}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Undo Delete
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setRecentlyDeleted(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Top Dynamic Metric Cards (Matching Excel Top Header) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {companies.slice(0, 3).map(comp => (
          <Card key={comp.id} className="border bg-card/80 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {comp.code} ({comp.name.split(' ')[0]})
                </p>
                <p className="text-xl font-extrabold tracking-tight mt-1 text-foreground">
                  {formatCurrency(companySums[comp.code] || 0)}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs uppercase font-bold">
                {comp.code}
              </Badge>
            </CardContent>
          </Card>
        ))}

        <Card className="border-2 border-primary/30 bg-primary/5 overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Total Value Submitted</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-primary bg-primary/10 border-primary/20">
                  Live Portfolio
                </Badge>
              </div>
              <p className="text-xl lg:text-2xl font-black tracking-tight mt-1 text-primary">
                {formatCurrency(grandTotalSubmitted)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground font-semibold">{filteredRows.length} Rows</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Excel Slicers (Department Name, Tender Status, Division) */}
      <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
        {/* Slicer 1: Department Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Department Name Slicer:
            </span>
            {selectedDept !== 'ALL' && (
              <button
                onClick={() => setSelectedDept('ALL')}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={selectedDept === 'ALL' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs px-2.5 rounded-lg font-medium"
              onClick={() => setSelectedDept('ALL')}
            >
              All Departments ({rows.length})
            </Button>
            {uniqueDepartments.map(dept => {
              const count = rows.filter(r => r.departmentName === dept).length
              return (
                <Button
                  key={dept}
                  variant={selectedDept === dept ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-2.5 rounded-lg font-medium bg-background"
                  onClick={() => setSelectedDept(dept)}
                >
                  {dept} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        {/* Slicer 2: Tender Status & Division */}
        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Tender Status:</span>
            {['ALL', 'Lapsed', 'Not Started', 'Ongoing', 'Submitted'].map(st => (
              <Button
                key={st}
                variant={selectedStatus === st ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs px-2 rounded-md"
                onClick={() => setSelectedStatus(st)}
              >
                {st}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Company Code:</span>
            <Button
              variant={selectedDivision === 'ALL' ? 'default' : 'outline'}
              size="sm"
              className="h-6 text-xs px-2 rounded-md"
              onClick={() => setSelectedDivision('ALL')}
            >
              All
            </Button>
            {companies.map(c => (
              <Button
                key={c.id}
                variant={selectedDivision === c.code ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs px-2 rounded-md"
                onClick={() => setSelectedDivision(c.code)}
              >
                {c.code}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 15-Column Datasheet Table */}
      <Card className="border shadow-md overflow-hidden">
        {/* Table Search & Count Bar */}
        <div className="py-2.5 px-4 bg-muted/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across all 15 columns..."
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Showing <strong>{filteredRows.length}</strong> of {rows.length} rows</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSelectedDept('ALL')
                setSelectedStatus('ALL')
                setSelectedDivision('ALL')
                setSearchQuery('')
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* 15 Columns Grid */}
        <CardContent className="p-0 overflow-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur text-muted-foreground border-b select-none">
              <tr>
                <th className="py-2.5 px-3 font-bold border-r w-12 text-center">SL No</th>
                <th className="py-2.5 px-3 font-bold border-r w-24 text-center">Company</th>
                <th className="py-2.5 px-3 font-bold border-r min-w-[150px]">Tender ID/ Reference Number</th>
                <th className="py-2.5 px-3 font-bold border-r w-20">Portal</th>
                <th className="py-2.5 px-3 font-bold border-r min-w-[140px]">Department Name</th>
                <th className="py-2.5 px-3 font-bold border-r min-w-[280px]">Tender Title</th>
                <th className="py-2.5 px-3 font-bold border-r w-24">Start Date</th>
                <th className="py-2.5 px-3 font-bold border-r w-24">End Date</th>
                <th className="py-2.5 px-3 font-bold border-r w-24 text-center">Day's left</th>
                <th className="py-2.5 px-3 font-bold border-r w-28">Submission Date</th>
                <th className="py-2.5 px-3 font-bold border-r w-24">Tender Status</th>
                <th className="py-2.5 px-3 font-bold border-r min-w-[140px]">Remarks</th>
                <th className="py-2.5 px-3 font-bold border-r min-w-[130px]">Remarks 2</th>
                <th className="py-2.5 px-3 font-bold border-r w-20">Result</th>
                <th className="py-2.5 px-3 font-bold border-r min-w-[130px] text-right">Submitted value (₹)</th>
                <th className="py-2.5 px-2 font-bold w-10 text-center">Act</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                const daysNum = parseInt(r.daysLeft, 10)
                const isDaysZero = r.daysLeft === '0'
                const isDaysOrange = !Number.isNaN(daysNum) && daysNum > 0 && daysNum <= 3
                const isDaysYellow = !Number.isNaN(daysNum) && daysNum > 3 && daysNum <= 7
                const isDaysGreen = !Number.isNaN(daysNum) && daysNum > 7

                return (
                  <tr
                    key={r.id}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/30 group',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    )}
                  >
                    {/* 1. SL No */}
                    <td className="py-2 px-3 border-r text-center font-mono font-semibold text-muted-foreground">
                      {r.slNo}
                    </td>

                    {/* 2. Company / Entity */}
                    <td className="py-2 px-3 border-r text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono font-bold px-1.5 py-0 uppercase bg-primary/10 text-primary border-primary/20"
                      >
                        {r.division || '—'}
                      </Badge>
                    </td>

                    {/* 3. Tender ID */}
                    <td className="py-2 px-3 border-r font-mono font-medium text-primary">
                      <input
                        type="text"
                        value={r.tenderId}
                        onChange={e => handleCellEdit(r.id, 'tenderId', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 4. Portal */}
                    <td className="py-2 px-3 border-r">
                      <input
                        type="text"
                        value={r.portal}
                        onChange={e => handleCellEdit(r.id, 'portal', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs uppercase font-semibold text-muted-foreground"
                      />
                    </td>

                    {/* 5. Department Name */}
                    <td className="py-2 px-3 border-r font-semibold">
                      <input
                        type="text"
                        value={r.departmentName}
                        onChange={e => handleCellEdit(r.id, 'departmentName', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 6. Tender Title */}
                    <td className="py-2 px-3 border-r">
                      <input
                        type="text"
                        value={r.tenderTitle}
                        onChange={e => handleCellEdit(r.id, 'tenderTitle', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 7. Start Date */}
                    <td className="py-2 px-3 border-r font-mono text-[11px]">
                      <input
                        type="text"
                        value={r.startDate}
                        onChange={e => handleCellEdit(r.id, 'startDate', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 8. End Date */}
                    <td className="py-2 px-3 border-r font-mono text-[11px]">
                      <input
                        type="text"
                        value={r.endDate}
                        onChange={e => handleCellEdit(r.id, 'endDate', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs font-semibold"
                      />
                    </td>

                    {/* 9. Day's left (Colored Badge) */}
                    <td className="py-2 px-3 border-r text-center">
                      <div className={cn(
                        'inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] min-w-[54px]',
                        r.daysLeft === 'Closed' ? 'bg-zinc-500/20 text-zinc-500' :
                        isDaysZero ? 'bg-orange-600 text-white animate-pulse' :
                        isDaysOrange ? 'bg-amber-500 text-white font-bold' :
                        isDaysYellow ? 'bg-yellow-400 text-black font-semibold' :
                        isDaysGreen ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {r.daysLeft}
                      </div>
                    </td>

                    {/* 10. Submission Date */}
                    <td className="py-2 px-3 border-r font-mono text-[11px]">
                      <input
                        type="text"
                        value={r.submissionDate}
                        onChange={e => handleCellEdit(r.id, 'submissionDate', e.target.value)}
                        placeholder="—"
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 11. Tender Status */}
                    <td className="py-2 px-3 border-r">
                      <Badge
                        variant={
                          r.tenderStatus === 'Submitted' ? 'success' :
                          r.tenderStatus === 'Ongoing' ? 'warning' :
                          r.tenderStatus === 'Lapsed' ? 'destructive' : 'secondary'
                        }
                        className="text-[10px] font-semibold"
                      >
                        {r.tenderStatus}
                      </Badge>
                    </td>

                    {/* 12. Remarks */}
                    <td className="py-2 px-3 border-r text-muted-foreground">
                      <input
                        type="text"
                        value={r.remarks}
                        onChange={e => handleCellEdit(r.id, 'remarks', e.target.value)}
                        placeholder="Remarks..."
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 13. Remarks 2 */}
                    <td className="py-2 px-3 border-r text-muted-foreground">
                      <input
                        type="text"
                        value={r.remarks2}
                        onChange={e => handleCellEdit(r.id, 'remarks2', e.target.value)}
                        placeholder="Remarks 2..."
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs"
                      />
                    </td>

                    {/* 14. Result */}
                    <td className="py-2 px-3 border-r font-semibold text-center">
                      <input
                        type="text"
                        value={r.result}
                        onChange={e => handleCellEdit(r.id, 'result', e.target.value)}
                        placeholder="(blank)"
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-xs text-center"
                      />
                    </td>

                    {/* 15. Submitted value */}
                    <td className="py-2 px-3 border-r text-right font-mono font-bold text-primary">
                      {r.submittedValue > 0 ? (
                        formatCurrency(r.submittedValue)
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2 px-1 text-center">
                      <button
                        onClick={() => setRowToDelete(r)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Delete row"
                      >
                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Footer Summary Row */}
            <tfoot className="sticky bottom-0 bg-muted font-bold border-t-2">
              <tr>
                <td colSpan={14} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                  Grand Total Submitted Value ({filteredRows.length} items):
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-primary">
                  {formatCurrency(filteredRows.reduce((a, b) => a + (b.submittedValue || 0), 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Dialog: Add New Tender Row */}
      <Dialog open={addRowOpen} onOpenChange={setAddRowOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tender Management Row</DialogTitle>
            <DialogDescription>
              Insert a new opportunity into the Tender Management Datasheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Company / Entity Selection & Quick Creator */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Company / Client Entity *</Label>
                {companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCreateCompanyInline(!createCompanyInline)}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    {createCompanyInline ? '← Select Existing Company' : '+ Create New Company'}
                  </button>
                )}
              </div>

              {companies.length === 0 || createCompanyInline ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Company Code (e.g. ABC, TCS, AF)</Label>
                      <Input
                        value={inlineCompCode}
                        onChange={e => setInlineCompCode(e.target.value.toUpperCase())}
                        placeholder="e.g. ABC"
                        className="h-8 text-xs font-mono font-bold uppercase mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Company Full Name</Label>
                      <Input
                        value={inlineCompName}
                        onChange={e => setInlineCompName(e.target.value)}
                        placeholder="e.g. ABC Enterprise Ltd"
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    {companies.length === 0 ? 'No company exists yet. Enter code and name above to create your first entity.' : 'This company will be automatically created and saved for future selection.'}
                  </p>
                </div>
              ) : (
                <div>
                  <Select value={newRow.division || companies[0]?.code} onValueChange={v => setNewRow({ ...newRow, division: v })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select company entity" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.code}>
                          <span className="font-bold mr-1.5">{c.code}:</span> {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <Label>Portal (GeM / CPP / etc.)</Label>
                <Input
                  value={newRow.portal}
                  onChange={e => setNewRow({ ...newRow, portal: e.target.value })}
                  placeholder="GeM"
                />
              </div>

            <div>
              <Label>Tender ID / Reference Number *</Label>
              <Input
                value={newRow.tenderId}
                onChange={e => setNewRow({ ...newRow, tenderId: e.target.value })}
                placeholder="e.g. GEM/2026/B/7899999"
              />
            </div>

            <div>
              <Label>Department / Issuing Client *</Label>
              <Input
                value={newRow.departmentName}
                onChange={e => setNewRow({ ...newRow, departmentName: e.target.value })}
                placeholder="e.g. BHEL, IOCL, Bhilai Steel Plant"
              />
            </div>

            <div className="col-span-2">
              <Label>Tender Scope / Title *</Label>
              <Input
                value={newRow.tenderTitle}
                onChange={e => setNewRow({ ...newRow, tenderTitle: e.target.value })}
                placeholder="e.g. Turbine Integral Piping (Carbon Steel)"
              />
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                value={newRow.startDate}
                onChange={e => setNewRow({ ...newRow, startDate: e.target.value })}
                placeholder="DD-MM-YYYY"
              />
            </div>

            <div>
              <Label>End Date (Submission Deadline)</Label>
              <Input
                value={newRow.endDate}
                onChange={e => setNewRow({ ...newRow, endDate: e.target.value })}
                placeholder="DD-MM-YYYY"
              />
            </div>

            <div>
              <Label>Day's Left (Countdown)</Label>
              <Input
                value={newRow.daysLeft}
                onChange={e => setNewRow({ ...newRow, daysLeft: e.target.value })}
                placeholder="e.g. 5 or Closed"
              />
            </div>

            <div>
              <Label>Tender Status</Label>
              <Select value={newRow.tenderStatus} onValueChange={v => setNewRow({ ...newRow, tenderStatus: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Lapsed">Lapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Submitted Value (₹)</Label>
              <Input
                type="number"
                value={newRow.submittedValue || ''}
                onChange={e => setNewRow({ ...newRow, submittedValue: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 28400000"
              />
            </div>

            <div>
              <Label>Submission Date (if submitted)</Label>
              <Input
                value={newRow.submissionDate}
                onChange={e => setNewRow({ ...newRow, submissionDate: e.target.value })}
                placeholder="DD-MM-YYYY"
              />
            </div>

            <div>
              <Label>Remarks</Label>
              <Input
                value={newRow.remarks}
                onChange={e => setNewRow({ ...newRow, remarks: e.target.value })}
                placeholder="e.g. Rate Receive"
              />
            </div>

            <div>
              <Label>Remarks 2</Label>
              <Input
                value={newRow.remarks2}
                onChange={e => setNewRow({ ...newRow, remarks2: e.target.value })}
                placeholder="e.g. Extend days"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setAddRowOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNewRow}>Add Tender Row</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add New Client / Company Profile & Management */}
      <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Companies / Client Profiles</DialogTitle>
            <DialogDescription>
              Add multiple entities or remove existing profiles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-muted/40 border space-y-3">
              <p className="text-xs font-bold text-foreground">+ Add New Company</p>
              <div>
                <Label>Company Short Code *</Label>
                <Input
                  value={newCompCode}
                  onChange={e => setNewCompCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TCS"
                  maxLength={6}
                  className="uppercase font-mono text-xs h-8"
                />
              </div>
              <div>
                <Label>Company Full Name *</Label>
                <Input
                  value={newCompName}
                  onChange={e => setNewCompName(e.target.value)}
                  placeholder="e.g. Tata Consultancy Services"
                  className="text-xs h-8"
                />
              </div>
              <Button size="sm" className="w-full h-8 text-xs font-semibold" onClick={handleAddNewCompany}>
                Save Company
              </Button>
            </div>

            {/* List of existing companies */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered Companies ({companies.length})</p>
              {companies.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No companies added yet.</p>
              ) : (
                companies.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="font-mono font-bold text-xs">{c.code}</Badge>
                      <span className="text-xs truncate">{c.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeCompany(c.id)}
                      title="Delete Company"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddCompanyOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Before Deletion */}
      <ConfirmDeleteDialog
        open={!!rowToDelete}
        onOpenChange={open => { if (!open) setRowToDelete(null) }}
        title="Delete Tender Row"
        description="Are you sure you want to remove this tender record from the datasheet? You can also undo this action immediately after deleting."
        itemName={rowToDelete ? `${rowToDelete.tenderId} — ${rowToDelete.tenderTitle} (${rowToDelete.departmentName})` : undefined}
        onConfirm={handleDeleteConfirmed}
      />

      {/* Activity Log & Audit Trail Dialog */}
      <Dialog open={activityLogsOpen} onOpenChange={setActivityLogsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 font-bold">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Activity History & Audit Trail</DialogTitle>
                <DialogDescription>
                  Real-time timestamps of additions, updates, deletions and restores in this workspace
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-80 pr-3 my-2">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No activity records yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activities.map(act => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <span className="font-bold text-foreground truncate">{act.entityTitle}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">{act.entityType}</Badge>
                      </div>
                      {act.details && <p className="text-[11px] text-muted-foreground">{act.details}</p>}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {new Date(act.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="font-mono text-[10px] font-bold text-primary">
                        {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button size="sm" onClick={() => setActivityLogsOpen(false)}>Close Activity Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
