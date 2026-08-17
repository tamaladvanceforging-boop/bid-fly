import { ExportFormat } from '@/lib/types';

export interface ExportColumn {
  header: string;
  key: string;
  formatter?: (val: any, row: any) => string;
}

export function exportData<T extends Record<string, any>>(
  title: string,
  columns: ExportColumn[],
  data: T[],
  format: ExportFormat
) {
  if (!data || data.length === 0) {
    if (typeof window !== 'undefined') alert('No data records available to export.');
    return;
  }

  const formattedRows = data.map(row => {
    const obj: Record<string, string> = {};
    columns.forEach(col => {
      const rawVal = row[col.key];
      obj[col.header] = col.formatter ? col.formatter(rawVal, row) : (rawVal ?? '');
    });
    return obj;
  });

  switch (format) {
    case 'csv':
      exportToCsv(title, columns.map(c => c.header), formattedRows);
      break;
    case 'excel':
      exportToExcel(title, columns.map(c => c.header), formattedRows);
      break;
    case 'word':
      exportToWord(title, columns.map(c => c.header), formattedRows);
      break;
    case 'pdf':
    case 'print':
      printOrSavePdf(title, columns.map(c => c.header), formattedRows, format === 'pdf');
      break;
  }
}

function exportToCsv(title: string, headers: string[], rows: Record<string, string>[]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(title: string, headers: string[], rows: Record<string, string>[]) {
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  tableHtml += `<head><meta charset="utf-8"/><style>table{border-collapse:collapse;width:100%;}th{background:#1e293b;color:#ffffff;font-weight:bold;padding:10px;border:1px solid #cbd5e1;}td{padding:8px;border:1px solid #cbd5e1;}</style></head><body>`;
  tableHtml += `<h2>${title}</h2><p>Generated: ${new Date().toLocaleString()}</p>`;
  tableHtml += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

  rows.forEach(row => {
    tableHtml += `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`;
  });

  tableHtml += `</tbody></table></body></html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToWord(title: string, headers: string[], rows: Record<string, string>[]) {
  let wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
  wordHtml += `<head><meta charset="utf-8"/><title>${title}</title><style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;width:100%;margin-top:20px;}th{background:#0f172a;color:#ffffff;padding:8px;border:1px solid #94a3b8;}td{padding:8px;border:1px solid #cbd5e1;}</style></head><body>`;
  wordHtml += `<h1 style="color:#0284c7;">BidFly Enterprise Suite</h1>`;
  wordHtml += `<h2>${title}</h2>`;
  wordHtml += `<p style="font-size:12px;color:#64748b;">Export Timestamp: ${new Date().toLocaleString()}</p>`;
  wordHtml += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

  rows.forEach(row => {
    wordHtml += `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`;
  });

  wordHtml += `</tbody></table></body></html>`;

  const blob = new Blob([wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printOrSavePdf(title: string, headers: string[], rows: Record<string, string>[], isPdf: boolean) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  let html = `<!DOCTYPE html><html><head><title>${title}</title>`;
  html += `<style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; }
    .subtitle { font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; border: 1px solid #334155; font-weight: 600; }
    td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background-color: #f8fafc; }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style></head><body>`;

  html += `<div class="header">
    <div>
      <div class="title">${title}</div>
      <div class="subtitle">BidFly Enterprise Commercial Suite</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; font-weight: bold;">CONFIDENTIAL REPORT</div>
      <div class="subtitle">${new Date().toLocaleString()}</div>
    </div>
  </div>`;

  html += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(row => {
    html += `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`;
  });
  html += `</tbody></table>`;

  html += `<script>window.onload = function() { window.print(); };</script></body></html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
