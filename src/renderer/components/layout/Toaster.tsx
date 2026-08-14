import { useAppStore } from '@renderer/stores/app.store'
import { cn } from '@shared/utils'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  default: Info
}

const VARIANTS: Record<string, string> = {
  success: 'border-emerald-500/50 bg-emerald-500/10 [&>svg]:text-emerald-500',
  error: 'border-destructive/50 bg-destructive/10 [&>svg]:text-destructive',
  warning: 'border-amber-500/50 bg-amber-500/10 [&>svg]:text-amber-500',
  default: 'border-primary/50 bg-primary/10 [&>svg]:text-primary'
}

export function Toaster() {
  const { toasts, removeToast } = useAppStore()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map(t => {
        const Icon = ICONS[t.variant ?? 'default']
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right fade-in-0 zoom-in-95',
              VARIANTS[t.variant ?? 'default']
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
