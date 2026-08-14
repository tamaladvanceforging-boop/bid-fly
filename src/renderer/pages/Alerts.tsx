import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Trash2, Filter, AlertTriangle, Info,
  CheckCircle2, XCircle, ChevronRight, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@renderer/components/ui/select'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { useAppStore } from '@renderer/stores/app.store'
import { formatRelativeTime, formatDate, cn } from '@shared/utils'
import type { Alert } from '@shared/types'

const SEVERITY_ICONS: Record<Alert['severity'], React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2
}

const SEVERITY_COLORS: Record<Alert['severity'], string> = {
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  error: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const { alerts, unreadCount, fetchAlerts, markAlertRead, markAllAlertsRead, addToast } = useAppStore()
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const filtered = alerts.filter(a => {
    if (unreadOnly && a.isRead) return false
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    return true
  })

  const handleDelete = async (id: string) => {
    if (!window.bidfly?.alert) return
    const res = await window.bidfly.alert.delete(id)
    if (res?.success) {
      addToast({ title: 'Alert deleted', variant: 'default' })
      fetchAlerts()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Center & Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} • Submission deadlines, portal sync events & status changes
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={async () => { await markAllAlertsRead(); addToast({ title: 'All alerts marked read', variant: 'success' }) }}>
              <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter Alerts:</span>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="error">Critical / Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Informational</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={unreadOnly ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          Unread Only {unreadCount > 0 && `(${unreadCount})`}
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="py-20 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-base font-medium text-muted-foreground mb-1">No alerts matching your filters</p>
            <p className="text-sm text-muted-foreground/70">You are completely up to date with all notifications.</p>
          </Card>
        ) : (
          filtered.map(a => {
            const Icon = SEVERITY_ICONS[a.severity]
            const colorClass = SEVERITY_COLORS[a.severity]

            return (
              <Card
                key={a.id}
                className={cn(
                  'transition-all hover:shadow-md cursor-pointer border',
                  !a.isRead ? 'bg-muted/30 border-l-4 border-l-primary' : 'bg-card opacity-90'
                )}
                onClick={() => {
                  if (!a.isRead) markAlertRead(a.id)
                  setSelectedAlert(a)
                }}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5 border', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {a.severity}
                        </Badge>
                        {!a.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-tight">{a.title}</p>
                    {a.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {a.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(a.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={!!selectedAlert} onOpenChange={v => { if (!v) setSelectedAlert(null) }}>
        <DialogContent className="max-w-md">
          {selectedAlert && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs uppercase font-bold">
                    {selectedAlert.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(selectedAlert.createdAt, 'long')}</span>
                </div>
                <DialogTitle>{selectedAlert.title}</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-foreground">
                  {selectedAlert.message}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setSelectedAlert(null)}>Close</Button>
                {selectedAlert.tenderId && (
                  <Button onClick={() => { setSelectedAlert(null); navigate('/tenders') }}>
                    View Tender <ExternalLink className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
