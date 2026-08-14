import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Table as TableIcon, Plus, Save, Trash2, Download, Upload,
  Calculator, FileSpreadsheet, Eye, RefreshCw, ChevronDown, Check,
  HelpCircle, Sparkles, Percent, DollarSign, Hash, Layers, LayoutGrid
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { cn, downloadFile } from '@shared/utils'
import type { DataEntrySheet, Tender } from '@shared/types'
import { useAppStore } from '@renderer/stores/app.store'
import TenderManagementSheet from '@renderer/components/datasheet/TenderManagementSheet'

function colIndexToName(col: number): string {
  let name = ''
  let num = col
  while (num >= 0) {
    name = String.fromCharCode((num % 26) + 65) + name
    num = Math.floor(num / 26) - 1
  }
  return name
}

function nameToColIndex(name: string): number {
  let col = 0
  const upper = name.toUpperCase()
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64)
  }
  return col - 1
}

// Safe formula computation engine
function evaluateFormula(
  formula: string,
  cells: Record<string, { value: string }>,
  visited = new Set<string>()
): string {
  if (!formula.startsWith('=')) return formula
  const expression = formula.slice(1).trim()

  const getCellValue = (cellRef: string): number => {
    const match = cellRef.match(/^([A-Za-z]+)(\d+)$/)
    if (!match) return 0
    const colName = match[1].toUpperCase()
    const rowNum = parseInt(match[2], 10) - 1
    const colIdx = nameToColIndex(colName)
    const key = `${rowNum}:${colIdx}`
    if (visited.has(key)) return 0
    const cell = cells[key]
    if (!cell || !cell.value) return 0
    if (cell.value.startsWith('=')) {
      const nextVisited = new Set(visited).add(key)
      const res = evaluateFormula(cell.value, cells, nextVisited)
      return parseFloat(res.replace(/,/g, '')) || 0
    }
    const cleanNum = cell.value.replace(/[^0-9.-]+/g, '')
    return parseFloat(cleanNum) || 0
  }

  // Handle SUM(A1:A5)
  const sumMatch = expression.match(/^SUM\(([A-Za-z]+\d+):([A-Za-z]+\d+)\)$/i)
  if (sumMatch) {
    const [c1, r1] = [nameToColIndex(sumMatch[1].match(/[A-Za-z]+/)![0]), parseInt(sumMatch[1].match(/\d+/)![0], 10) - 1]
    const [c2, r2] = [nameToColIndex(sumMatch[2].match(/[A-Za-z]+/)![0]), parseInt(sumMatch[2].match(/\d+/)![0], 10) - 1]
    let total = 0
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
        total += getCellValue(`${colIndexToName(c)}${r + 1}`)
      }
    }
    return total.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  }

  // Handle AVG / AVERAGE(A1:A5)
  const avgMatch = expression.match(/^(?:AVG|AVERAGE)\(([A-Za-z]+\d+):([A-Za-z]+\d+)\)$/i)
  if (avgMatch) {
    const [c1, r1] = [nameToColIndex(avgMatch[1].match(/[A-Za-z]+/)![0]), parseInt(avgMatch[1].match(/\d+/)![0], 10) - 1]
    const [c2, r2] = [nameToColIndex(avgMatch[2].match(/[A-Za-z]+/)![0]), parseInt(avgMatch[2].match(/\d+/)![0], 10) - 1]
    let total = 0
    let count = 0
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
        total += getCellValue(`${colIndexToName(c)}${r + 1}`)
        count++
      }
    }
    return count > 0 ? (total / count).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'
  }

  // Handle arithmetic expressions
  try {
    const substituted = expression.replace(/([A-Za-z]+\d+)/g, (ref) => {
      return String(getCellValue(ref))
    })
    if (/^[0-9+\-*/().\s]+$/.test(substituted)) {
      const fn = new Function(`return (${substituted})`)
      const res = fn()
      if (typeof res === 'number' && !Number.isNaN(res)) {
        return res.toLocaleString('en-IN', { maximumFractionDigits: 2 })
      }
    }
  } catch {
    return '#ERR!'
  }

  return '#VALUE!'
}

export default function DataEntryPage() {
  const addToast = useAppStore(s => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeMainTab, setActiveMainTab] = useState<'datasheet' | 'custom_boq'>('datasheet')
  const [sheets, setSheets] = useState<DataEntrySheet[]>([])
  const [activeSheet, setActiveSheet] = useState<DataEntrySheet | null>(null)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [newSheetName, setNewSheetName] = useState('')
  const [newSheetTender, setNewSheetTender] = useState<string>('none')
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [formulaBar, setFormulaBar] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    if (!window.bidfly?.sheet) return
    const [sres, tres] = await Promise.all([
      window.bidfly.sheet.list(),
      window.bidfly.tender.list({ limit: 100 })
    ])
    if (sres?.success && sres.data) {
      setSheets(sres.data)
      if (sres.data.length > 0 && !activeSheet) {
        loadSheet(sres.data[0].id)
      }
    }
    if (tres?.success && tres.data) setTenders(tres.data.items)
  }

  const loadSheet = async (id: string) => {
    if (!window.bidfly?.sheet) return
    const res = await window.bidfly.sheet.getById(id)
    if (res?.success && res.data) {
      setActiveSheet(res.data)
      setSelectedCell(null)
      setFormulaBar('')
    }
  }

  const handleCellChange = (row: number, col: number, value: string) => {
    if (!activeSheet) return
    const key = `${row}:${col}`
    const nextCells = {
      ...activeSheet.cells,
      [key]: { row, col, value }
    }
    setActiveSheet({ ...activeSheet, cells: nextCells })
  }

  const handleSelectCell = (row: number, col: number) => {
    if (!activeSheet) return
    setSelectedCell({ row, col })
    const key = `${row}:${col}`
    const val = activeSheet.cells[key]?.value || ''
    setFormulaBar(val)
  }

  const handleSaveSheet = async () => {
    if (!activeSheet || !window.bidfly?.sheet) return
    setIsSaving(true)
    const res = await window.bidfly.sheet.update(activeSheet.id, {
      name: activeSheet.name,
      rows: activeSheet.rows,
      cols: activeSheet.cols,
      cells: activeSheet.cells,
      columnHeaders: activeSheet.columnHeaders
    })
    setIsSaving(false)
    if (res?.success) {
      addToast({ title: 'Spreadsheet saved', description: activeSheet.name, variant: 'success' })
    } else {
      addToast({ title: 'Save failed', description: res?.error, variant: 'error' })
    }
  }

  const insertFormulaHelper = (snippet: string) => {
    if (!selectedCell || !activeSheet) return
    const newFormula = snippet
    setFormulaBar(newFormula)
    handleCellChange(selectedCell.row, selectedCell.col, newFormula)
  }

  const handleCreateSheet = async () => {
    if (!newSheetName.trim() || !window.bidfly?.sheet) return
    const res = await window.bidfly.sheet.create({
      name: newSheetName.trim(),
      tenderId: newSheetTender !== 'none' ? newSheetTender : undefined,
      rows: 15,
      cols: 8,
      cells: {
        '0:0': { row: 0, col: 0, value: 'Item No' },
        '0:1': { row: 0, col: 1, value: 'Description' },
        '0:2': { row: 0, col: 2, value: 'Unit' },
        '0:3': { row: 0, col: 3, value: 'Quantity' },
        '0:4': { row: 0, col: 4, value: 'Estimated Rate (₹)' },
        '0:5': { row: 0, col: 5, value: 'Total Amount (₹)' }
      },
      columnHeaders: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    })
    if (res?.success && res.data) {
      addToast({ title: 'Spreadsheet created', variant: 'success' })
      setCreateOpen(false)
      setNewSheetName('')
      load()
      setActiveSheet(res.data)
    }
  }

  const handleDeleteSheet = async (id: string) => {
    if (!window.bidfly?.sheet) return
    const res = await window.bidfly.sheet.delete(id)
    if (res?.success) {
      addToast({ title: 'Spreadsheet deleted', variant: 'success' })
      setActiveSheet(null)
      load()
    }
  }

  const handleExportCSV = () => {
    if (!activeSheet) return
    const rowsList: string[] = []
    for (let r = 0; r < activeSheet.rows; r++) {
      const rowVals: string[] = []
      for (let c = 0; c < activeSheet.cols; c++) {
        const raw = activeSheet.cells[`${r}:${c}`]?.value || ''
        const evaluated = raw.startsWith('=') ? evaluateFormula(raw, activeSheet.cells) : raw
        rowVals.push(`"${evaluated.replace(/"/g, '""')}"`)
      }
      rowsList.push(rowVals.join(','))
    }
    const csvContent = rowsList.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `${activeSheet.name.toLowerCase().replace(/\s+/g, '_')}.csv`)
    addToast({ title: 'Exported sheet to CSV', variant: 'success' })
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSheet) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        const nextCells: Record<string, { row: number; col: number; value: string }> = {}
        const rows = Math.max(activeSheet.rows, lines.length)
        let maxCols = activeSheet.cols

        lines.forEach((line, r) => {
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
          if (cols.length > maxCols) maxCols = cols.length
          cols.forEach((val, c) => {
            nextCells[`${r}:${c}`] = { row: r, col: c, value: val }
          })
        })

        setActiveSheet({
          ...activeSheet,
          rows,
          cols: maxCols,
          cells: nextCells
        })
        addToast({ title: 'Imported CSV into sheet', variant: 'success' })
      } catch (err) {
        addToast({ title: 'Failed to parse CSV', variant: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Top View Selector Tabs */}
      <Tabs value={activeMainTab} onValueChange={v => setActiveMainTab(v as any)}>
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b">
          <TabsList className="grid grid-cols-2 w-full sm:w-[480px]">
            <TabsTrigger value="datasheet" className="gap-2 font-bold text-xs">
              <FileSpreadsheet className="h-4 w-4 text-amber-500" /> Tender Datasheet (15 Cols)
            </TabsTrigger>
            <TabsTrigger value="custom_boq" className="gap-2 font-bold text-xs">
              <Calculator className="h-4 w-4 text-blue-500" /> BOQ & Rate Formula Studio
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Exact 15-Column Tender Management Datasheet */}
        <TabsContent value="datasheet" className="mt-4">
          <TenderManagementSheet />
        </TabsContent>

        {/* Tab 2: Custom BOQ Calculator Studio */}
        <TabsContent value="custom_boq" className="mt-4 space-y-6">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">BOQ & Rate Analysis Formula Studio</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dynamic spreadsheet grid with live formula calculator (`=SUM()`, `=AVG()`, arithmetic)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSheet && (
                <>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Import CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                  <Button size="sm" onClick={handleSaveSheet} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Sheet'}
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Sheet
              </Button>
            </div>
          </div>

          {/* Sheet Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b">
            {sheets.map(s => (
              <div key={s.id} className="flex items-center">
                <Button
                  variant={activeSheet?.id === s.id ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2 rounded-b-none border-b-2 border-transparent font-medium"
                  onClick={() => loadSheet(s.id)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{s.name}</span>
                </Button>
                {activeSheet?.id === s.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteSheet(s.id)}
                    title="Delete sheet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {activeSheet ? (
            <Card className="overflow-hidden border shadow-sm">
              {/* Formula Toolbar */}
              <div className="py-2.5 px-4 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-background border shadow-xs text-primary">
                    {selectedCell ? `${colIndexToName(selectedCell.col)}${selectedCell.row + 1}` : 'A1'}
                  </span>
                  <div className="flex items-center gap-2 flex-1 max-w-xl">
                    <Calculator className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      value={formulaBar}
                      onChange={e => {
                        setFormulaBar(e.target.value)
                        if (selectedCell) {
                          handleCellChange(selectedCell.row, selectedCell.col, e.target.value)
                        }
                      }}
                      placeholder="Formula (e.g. =SUM(A1:A5), =D2*E2, =A1+B1) or literal value"
                      className="h-8 font-mono text-xs bg-background"
                    />
                  </div>
                </div>

                {/* Formula Helper Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase mr-1">Insert Formula:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono px-2"
                    onClick={() => insertFormulaHelper(`=SUM(D2:D${Math.max(2, activeSheet.rows - 1)})`)}
                  >
                    =SUM()
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono px-2"
                    onClick={() => insertFormulaHelper(`=AVG(E2:E${Math.max(2, activeSheet.rows - 1)})`)}
                  >
                    =AVG()
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono px-2"
                    onClick={() => insertFormulaHelper(`=D2*E2`)}
                  >
                    =D2*E2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono px-2"
                    onClick={() => insertFormulaHelper(`=(F2*1.18)`)}
                    title="Add 18% GST"
                  >
                    +18% GST
                  </Button>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setActiveSheet({ ...activeSheet, rows: activeSheet.rows + 5 })}
                  >
                    +5 Rows
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setActiveSheet({ ...activeSheet, cols: activeSheet.cols + 2 })}
                  >
                    +2 Cols
                  </Button>
                </div>
              </div>

              <CardContent className="p-0 overflow-auto max-h-[600px]">
                <table className="w-full border-collapse font-sans text-xs">
                  <thead className="sticky top-0 z-20 bg-muted text-muted-foreground">
                    <tr>
                      <th className="w-12 py-2 px-2 border border-border text-center bg-muted/80">#</th>
                      {Array.from({ length: activeSheet.cols }).map((_, c) => (
                        <th key={c} className="min-w-[140px] py-2 px-3 border border-border font-semibold text-center bg-muted/80">
                          {colIndexToName(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: activeSheet.rows }).map((_, r) => (
                      <tr key={r} className="hover:bg-muted/10">
                        <td className="sticky left-0 z-10 py-1.5 px-2 border border-border text-center font-mono font-medium bg-muted/40 text-muted-foreground select-none">
                          {r + 1}
                        </td>
                        {Array.from({ length: activeSheet.cols }).map((_, c) => {
                          const key = `${r}:${c}`
                          const cell = activeSheet.cells[key]
                          const raw = cell?.value || ''
                          const isFormula = raw.startsWith('=')
                          const displayVal = isFormula ? evaluateFormula(raw, activeSheet.cells) : raw
                          const isSelected = selectedCell?.row === r && selectedCell?.col === c
                          const isHeaderRow = r === 0

                          return (
                            <td
                              key={c}
                              onClick={() => handleSelectCell(r, c)}
                              className={cn(
                                'p-0 border border-border transition-colors',
                                isSelected ? 'ring-2 ring-primary ring-inset z-10' : '',
                                isHeaderRow ? 'bg-muted/20 font-semibold' : ''
                              )}
                            >
                              <input
                                type="text"
                                value={isSelected ? raw : displayVal}
                                onChange={e => handleCellChange(r, c, e.target.value)}
                                onFocus={() => handleSelectCell(r, c)}
                                className={cn(
                                  'w-full h-8 px-2.5 bg-transparent focus:outline-none text-xs truncate',
                                  isFormula && !isSelected ? 'font-mono text-primary font-bold' : '',
                                  isHeaderRow ? 'font-semibold' : ''
                                )}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-16 text-center">
              <TableIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground mb-3">No custom BOQ formula sheet open</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Spreadsheet
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New BOQ Spreadsheet</DialogTitle>
            <DialogDescription>
              Create a rate analysis or bill-of-quantities comparison sheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Sheet Title *</Label>
              <Input
                value={newSheetName}
                onChange={e => setNewSheetName(e.target.value)}
                placeholder="e.g. CPWD Hospital BOQ & Cost Analysis"
              />
            </div>
            <div>
              <Label>Linked Tender (Optional)</Label>
              <Select value={newSheetTender} onValueChange={setNewSheetTender}>
                <SelectTrigger><SelectValue placeholder="Select tender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Standalone)</SelectItem>
                  {tenders.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.tenderNumber} - {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSheet}>Create Sheet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
