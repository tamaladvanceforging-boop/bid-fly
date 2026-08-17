import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileCode, Printer, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { exportData, ExportColumn } from '@/lib/utils/export.service'
import { ExportFormat } from '@/lib/types'

interface ExportMenuProps<T extends Record<string, any>> {
  title: string
  columns: ExportColumn[]
  data: T[]
  variant?: 'outline' | 'default' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ExportMenu<T extends Record<string, any>>({
  title,
  columns,
  data,
  variant = 'outline',
  size = 'sm',
  className = ''
}: ExportMenuProps<T>) {
  const [lastExported, setLastExported] = useState<string | null>(null)

  const handleExport = (format: ExportFormat) => {
    exportData(title, columns, data, format)
    setLastExported(format.toUpperCase())
    setTimeout(() => setLastExported(null), 3000)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`gap-1.5 text-xs font-semibold cursor-pointer ${className}`}>
          <Download className="h-3.5 w-3.5 text-primary" />
          <span>{lastExported ? `Exported ${lastExported}` : 'Export / Print'}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase font-bold">
          Download & Print Formats
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('excel')} className="text-xs cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
          Excel Spreadsheet (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} className="text-xs cursor-pointer">
          <FileCode className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
          CSV Raw Dataset (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('word')} className="text-xs cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
          Word Document (.doc)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="text-xs cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-rose-600 dark:text-rose-400" />
          PDF Document (.pdf)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('print')} className="text-xs cursor-pointer font-medium">
          <Printer className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
          Direct Print / Save Preview
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
