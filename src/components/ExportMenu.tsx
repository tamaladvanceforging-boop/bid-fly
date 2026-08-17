"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Check } from "lucide-react";
import { Button } from "./shadcnui/button";
import { toast } from "./shadcnui/toast";

interface ExportColumn {
  header: string;
  key: string;
  formatter?: (value: any) => string;
}

interface ExportMenuProps {
  title: string;
  data: any[];
  columns: ExportColumn[];
}

export default function ExportMenu({ title, data, columns }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    if (!data.length) {
      toast.add({ title: "No Data", description: "No records available to export.", type: "warning" });
      return;
    }

    const headers = columns.map(c => `"${c.header}"`).join(",");
    const rows = data.map(item => {
      return columns.map(c => {
        const val = item[c.key];
        const formatted = c.formatter ? c.formatter(val) : (val !== undefined && val !== null ? String(val) : "");
        return `"${formatted.replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsOpen(false);
    toast.add({ title: "Export Complete", description: `Exported ${data.length} records to CSV.`, type: "success" });
  };

  const handleExportJSON = () => {
    if (!data.length) {
      toast.add({ title: "No Data", description: "No records available to export.", type: "warning" });
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsOpen(false);
    toast.add({ title: "Export Complete", description: `Exported ${data.length} records to JSON.`, type: "success" });
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5 text-xs font-semibold cursor-pointer">
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in zoom-in-95">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted cursor-pointer transition-colors">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
            Export as CSV (Excel)
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted cursor-pointer transition-colors">
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            Export as JSON Data
          </button>
        </div>
      )}
    </div>
  );
}
