import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'date' = 'short'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid date'

  switch (format) {
    case 'long':
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    case 'date':
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    default:
      return d.toLocaleDateString('en-IN', {
        year: '2-digit',
        month: 'short',
        day: '2-digit'
      })
  }
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const sign = diffSec < 0 ? 'ago' : 'left'
  const absSec = Math.abs(diffSec)

  if (absSec < 60) return `${absSec}s ${sign}`
  const absMin = Math.round(absSec / 60)
  if (absMin < 60) return `${absMin}m ${sign}`
  const absHour = Math.round(absMin / 60)
  if (absHour < 24) return `${absHour}h ${sign}`
  const absDay = Math.round(absHour / 24)
  if (absDay < 30) return `${absDay}d ${sign}`
  const absMonth = Math.round(absDay / 30)
  return `${absMonth}mo ${sign}`
}

export function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}${random}`
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function getDaysUntil(date: string | Date): number {
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(date: string | Date): boolean {
  return new Date(date).getTime() < Date.now()
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export function downloadFile(data: Blob, filename: string): void {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
