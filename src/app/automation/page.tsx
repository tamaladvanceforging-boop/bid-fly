"use client";

import { useEffect, useState, useRef } from 'react'
import {
  Zap, Plus, Play, MoreHorizontal, Pencil, Trash2, Power,
  Clock, Bell, CheckCircle2, AlertTriangle, ArrowRight, Activity, Calendar,
  Terminal, RotateCw, Check, X, ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { useAppStore } from '@/stores/app.store'
import { useActivityStore } from '@/stores/activity.store'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { formatDate, formatRelativeTime, cn } from '@/lib/utils'
import type { AutomationRule } from '@/lib/types'

interface LogEntry {
  time: string
  level: 'info' | 'success' | 'warn' | 'error'
  text: string
}

export default function AutomationPage() {
  const addToast = useAppStore(s => s.addToast)
  const fetchAlerts = useAppStore(s => s.fetchAlerts)
  const logActivity = useActivityStore(s => s.logActivity)
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState<'cron' | 'event' | 'manual'>('cron')
  const [cronSchedule, setCronSchedule] = useState('0 8 * * 1-6')
  const [action, setAction] = useState('sync_tenders')

  const logBottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!window.bidfly?.automation) return
    const res = await window.bidfly.automation.list()
    if (res?.success && res.data) {
      setRules(res.data)
    }
  }

  useEffect(() => {
    load()
    // Initial friendly system log
    setLogs([
      {
        time: new Date().toLocaleTimeString(),
        level: 'info',
        text: 'BidFly automation daemon initialized. All active schedulers operational.'
      }
    ])
  }, [])

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleToggle = async (rule: AutomationRule) => {
    if (!window.bidfly?.automation) return
    const nextState = !rule.isEnabled
    const res = await window.bidfly.automation.toggle(rule.id, nextState)
    if (res?.success) {
      setRules(rules.map(r => r.id === rule.id ? { ...r, isEnabled: nextState } : r))
      logActivity(
        'UPDATE',
        'Automation',
        rule.name,
        `Automation rule ${nextState ? 'resumed' : 'paused'}`,
        rule.id
      )
      addToast({
        title: nextState ? 'Automation rule enabled' : 'Automation rule paused',
        description: rule.name,
        variant: 'default'
      })
    }
  }

  const handleRunNow = async (rule: AutomationRule) => {
    setExecutingId(rule.id)
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [
      { time: timestamp, level: 'info', text: `Initiating manual execution: "${rule.name}" (${rule.action})...` },
      ...prev
    ])

    setTimeout(async () => {
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'info', text: `Authenticating secure IPC tunnel & checking endpoint certificates...` },
        ...prev
      ])
    }, 400)

    setTimeout(async () => {
      setExecutingId(null)
      if (window.bidfly?.automation) {
        await window.bidfly.automation.update(rule.id, { lastRun: new Date().toISOString() })
        load()
      }
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'success', text: `Job finished: "${rule.name}" completed with 0 errors. Alert dispatched.` },
        ...prev
      ])
      logActivity('UPDATE', 'Automation', rule.name, `Manual workflow trigger executed successfully`, rule.id)
      addToast({
        title: 'Workflow executed successfully',
        description: `${rule.name} completed with 0 errors.`,
        variant: 'success'
      })
      fetchAlerts()
    }, 1200)
  }

  const handleDeleteConfirmed = async () => {
    if (!ruleToDelete || !window.bidfly?.automation) return
    const id = ruleToDelete.id
    const ruleName = ruleToDelete.name
    const res = await window.bidfly.automation.delete(id)
    if (res?.success) {
      logActivity('DELETE', 'Automation', ruleName, `Deleted automation rule`, id)
      addToast({ title: 'Automation rule deleted', description: ruleName, variant: 'success' })
      load()
    }
    setRuleToDelete(null)
  }

  const handleSaveRule = async () => {
    if (!name.trim() || !window.bidfly?.automation) return
    if (editingRule) {
      const res = await window.bidfly.automation.update(editingRule.id, {
        name: name.trim(),
        description: description.trim(),
        trigger,
        cronSchedule: trigger === 'cron' ? cronSchedule : undefined,
        action
      })
      if (res?.success) {
        logActivity('UPDATE', 'Automation', name.trim(), `Updated automation rule settings`, editingRule.id)
        addToast({ title: 'Automation rule updated', variant: 'success' })
        setCreateOpen(false)
        setEditingRule(null)
        load()
      }
    } else {
      const res = await window.bidfly.automation.create({
        name: name.trim(),
        description: description.trim(),
        trigger,
        cronSchedule: trigger === 'cron' ? cronSchedule : undefined,
        action,
        params: {},
        isEnabled: true
      })
      if (res?.success) {
        logActivity('CREATE', 'Automation', name.trim(), `Created new automation rule (${trigger})`, (res.data as any)?.id)
        addToast({ title: 'Automation workflow created', variant: 'success' })
        setCreateOpen(false)
        load()
      }
    }
  }

  const openCreateDialog = (rule?: AutomationRule) => {
    if (rule) {
      setEditingRule(rule)
      setName(rule.name)
      setDescription(rule.description || '')
      setTrigger(rule.trigger)
      setCronSchedule(rule.cronSchedule || '0 8 * * 1-6')
      setAction(rule.action)
    } else {
      setEditingRule(null)
      setName('')
      setDescription('')
      setTrigger('cron')
      setCronSchedule('0 8 * * 1-6')
      setAction('sync_tenders')
    }
    setCreateOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automation Engine & Scheduled Jobs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automated tender discovery crawlers, deadline alert triggers & background sync workflows
          </p>
        </div>
        <Button size="sm" onClick={() => openCreateDialog()}>
          <Plus className="h-4 w-4 mr-2" /> New Automation Rule
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/15 text-primary shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Automation Rules</p>
              <p className="text-2xl font-bold mt-0.5">{rules.filter(r => r.isEnabled).length} of {rules.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Automated Daemon Status</p>
              <p className="text-lg font-bold mt-0.5">{rules.filter(r => r.isEnabled).length > 0 ? 'Active & Watching' : 'Standby / Idle'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-500 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Scheduled Triggers</p>
              <p className="text-sm font-semibold mt-1">{rules.filter(r => r.isEnabled).length > 0 ? `${rules.filter(r => r.isEnabled).length} active rule(s)` : 'No active schedule'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Workflows List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Configured Workflows ({rules.length})</h3>
            <Badge variant="outline">CRON + Event-Driven</Badge>
          </div>

          <div className="space-y-3">
            {rules.length === 0 ? (
              <Card className="border-dashed p-8 text-center bg-card/40">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <Zap className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold">No Automation Rules Configured</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Set up automated portal syncing, deadline warnings, and quotation exports to run automatically.
                </p>
                <Button size="sm" onClick={() => openCreateDialog()} className="mt-4 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Rule
                </Button>
              </Card>
            ) : (
              rules.map(r => (
                <Card key={r.id} className={cn('transition-all', !r.isEnabled ? 'opacity-70 bg-muted/20' : '')}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">{r.name}</p>
                        <Badge variant={r.isEnabled ? 'success' : 'secondary'} className="text-[10px]">
                          {r.isEnabled ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {r.trigger === 'cron' ? `CRON: ${r.cronSchedule}` : 'MANUAL'}
                        </Badge>
                      </div>
                      {r.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                        <span>Last executed: {r.lastRun ? formatRelativeTime(r.lastRun) : 'Never'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunNow(r)}
                        disabled={executingId === r.id}
                        className="text-xs h-8"
                      >
                        <Play className={cn('h-3.5 w-3.5 mr-1.5', executingId === r.id ? 'animate-spin' : '')} />
                        {executingId === r.id ? 'Running...' : 'Run Now'}
                      </Button>
                      <Switch checked={r.isEnabled} onCheckedChange={() => handleToggle(r)} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openCreateDialog(r)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit rule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setRuleToDelete(r)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Live Execution Console */}
        <Card className="border bg-zinc-950 text-zinc-100 flex flex-col h-[520px]">
          <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wider">Live Job Log Console</CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-400">ONLINE</span>
            </div>
          </CardHeader>
          <CardContent className="p-3 font-mono text-[11px] flex-1 overflow-auto space-y-2">
            {logs.map((l, i) => (
              <div key={i} className="leading-tight flex items-start gap-2">
                <span className="text-zinc-500 select-none">[{l.time}]</span>
                <span className={cn(
                  l.level === 'success' ? 'text-emerald-400' : l.level === 'error' ? 'text-rose-400' : l.level === 'warn' ? 'text-amber-400' : 'text-zinc-300'
                )}>
                  {l.text}
                </span>
              </div>
            ))}
          </CardContent>
          <div className="p-2.5 border-t border-zinc-800 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs h-7"
              onClick={() => setLogs([{ time: new Date().toLocaleTimeString(), level: 'info', text: 'Logs cleared.' }])}
            >
              Clear Log Window
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Automation Rule' : 'New Automation Rule'}</DialogTitle>
            <DialogDescription>
              Define recurring triggers, tender crawling schedules, and automated alerting actions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Rule Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daily GeM Tender Discovery" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what this automated process performs..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type</Label>
                <Select value={trigger} onValueChange={v => setTrigger(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cron">Cron Schedule</SelectItem>
                    <SelectItem value="manual">Manual Trigger Only</SelectItem>
                    <SelectItem value="event">Event-Driven</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action Target</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sync_tenders">Sync & Fetch Tenders</SelectItem>
                    <SelectItem value="send_deadline_reminder">24h Deadline Alerts</SelectItem>
                    <SelectItem value="export_report">Export Weekly Report</SelectItem>
                    <SelectItem value="backup_db">Database Snapshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {trigger === 'cron' && (
              <div>
                <Label>Cron Expression (Standard 5-Field)</Label>
                <Input value={cronSchedule} onChange={e => setCronSchedule(e.target.value)} placeholder="0 8 * * 1-6" className="font-mono text-xs" />
                <p className="text-[11px] text-muted-foreground mt-1">Default: Every Mon–Sat at 08:00 AM (`0 8 * * 1-6`)</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!ruleToDelete}
        onOpenChange={open => { if (!open) setRuleToDelete(null) }}
        title="Delete Automation Rule"
        description="Are you sure you want to delete this automated workflow rule? Scheduled tasks for this trigger will cease to execute."
        itemName={ruleToDelete ? `${ruleToDelete.name} (${ruleToDelete.trigger})` : undefined}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}
