import { Bell, Menu, Moon, Sun, Search, User, Settings, Building2, LogOut, Check, Wifi, WifiOff, RefreshCw, Trash2, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'
import { Avatar, AvatarFallback } from '@renderer/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup
} from '@renderer/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@renderer/components/ui/popover'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { useAppStore, useThemeStore, useUIStore } from '@renderer/stores/app.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import { formatRelativeTime } from '@shared/utils'
import { realtimeSync, type NetworkSyncStatus } from '@shared/utils/sync.service'

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Dashboard',
  '/tenders': 'Tenders',
  '/bids': 'Bids',
  '/vendors': 'Vendors',
  '/data-entry': 'Tender Datasheet & BOQ',
  '/reports': 'Reports',
  '/automation': 'Automation',
  '/alerts': 'Alerts',
  '/settings': 'Settings'
}

function getBreadcrumb(path: string): string[] {
  if (BREADCRUMB_MAP[path]) return [BREADCRUMB_MAP[path]]
  const parts = path.split('/').filter(Boolean)
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme, resolvedTheme } = useThemeStore()
  const setMobile = useUIStore(s => s.setMobileSidebarOpen)
  const { alerts, unreadCount, fetchAlerts, markAlertRead, markAllAlertsRead, addToast } = useAppStore()
  const { user, companies, activeCompanyCode, setActiveCompanyCode, addCompany, removeCompany, logout } = useAuthStore()

  const [alertsOpen, setAlertsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [syncState, setSyncState] = useState<{ status: NetworkSyncStatus; pendingCount: number }>({ status: 'online', pendingCount: 0 })
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [newCompanyCode, setNewCompanyCode] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompanyCode.trim() || !newCompanyName.trim()) return
    addCompany(newCompanyCode.trim(), newCompanyName.trim())
    setNewCompanyCode('')
    setNewCompanyName('')
    addToast({ title: 'Company Added', description: `${newCompanyName} has been registered.`, variant: 'success' })
  }

  const handleDeleteCompany = (id: string, name: string, code: string) => {
    removeCompany(id)
    if (activeCompanyCode === code) {
      setActiveCompanyCode('ALL')
    }
    addToast({ title: 'Company Removed', description: `${name} has been removed.`, variant: 'default' })
  }

  useEffect(() => {
    const unsub = realtimeSync.subscribeStatus((status, pendingCount) => {
      setSyncState({ status, pendingCount })
    })
    return unsub
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const breadcrumb = useMemo(() => getBreadcrumb(location.pathname), [location.pathname])

  const sortedAlerts = useMemo(() =>
    [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    [alerts]
  )

  function toggleTheme() {
    const next: Parameters<typeof setTheme>[0] =
      theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
    setTheme(next)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/tenders?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  function handleLogout() {
    logout()
    addToast({ title: 'Logged out successfully', description: 'Session ended.', variant: 'default' })
  }

  const activeCompObj = companies.find(c => c.code === activeCompanyCode)

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-3 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={() => setMobile(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden sm:flex flex-col gap-0.5 shrink-0">
          <h1 className="text-base font-semibold leading-tight tracking-tight">
            {breadcrumb[breadcrumb.length - 1]}
          </h1>
          <p className="text-xs text-muted-foreground leading-tight">
            BidFly • {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Multi-Company / Client Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 ml-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>{activeCompanyCode === 'ALL' ? 'All Companies' : `${activeCompanyCode} - ${activeCompObj?.name.split(' ')[0] || ''}`}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase font-bold">
              Active Entity / Company
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setActiveCompanyCode('ALL')} className="text-xs">
              <span className="flex-1">All Companies (Combined)</span>
              {activeCompanyCode === 'ALL' && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {companies.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No companies created yet.
              </div>
            ) : (
              companies.map(c => (
                <DropdownMenuItem key={c.id} onClick={() => setActiveCompanyCode(c.code)} className="text-xs">
                  <span className="font-bold mr-1.5">{c.code}:</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  {activeCompanyCode === c.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCompanyModalOpen(true)} className="text-xs text-primary font-medium cursor-pointer">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Manage & Add Companies
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 max-w-md mx-auto hidden lg:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tenders, bids, vendors... (press Enter)"
              className="pl-9 bg-muted/40 border-transparent focus:border-input text-xs"
            />
          </form>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Network LAN Sync Status Pill */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              addToast({ title: 'Synchronizing...', description: 'Triggering manual network & queue sync.', variant: 'default' })
              const res = await realtimeSync.triggerManualSync()
              addToast({ title: 'Network Sync Complete', description: `Flushed ${res.flushedCount} pending queue items. Sync status active.`, variant: 'success' })
            }}
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] h-8 px-2.5 btn-spring font-medium"
            title="Click to force manual network & database sync"
          >
            {syncState.status === 'online' ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">LAN Active</span>
              </>
            ) : syncState.status === 'syncing' ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                <span className="text-blue-500 font-semibold">Syncing...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Offline ({syncState.pendingCount})
                </span>
              </>
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="shrink-0">
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Popover open={alertsOpen} onOpenChange={setAlertsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Alerts">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 justify-center rounded-full text-[10px] leading-none"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Alerts</h4>
                  {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={async () => {
                      await markAllAlertsRead()
                    }}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-80">
                {sortedAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No alerts</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  sortedAlerts.map(a => (
                    <div
                      key={a.id}
                      className={`px-4 py-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${!a.isRead ? 'bg-muted/30' : ''}`}
                      onClick={() => {
                        if (!a.isRead) markAlertRead(a.id)
                        navigate('/alerts')
                        setAlertsOpen(false)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {!a.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                          <span className="text-xs font-medium text-muted-foreground">{a.severity.toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(a.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                      {a.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</p>}
                    </div>
                  ))
                )}
              </ScrollArea>
              <div className="p-2 border-t text-center">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { navigate('/alerts'); setAlertsOpen(false) }}>
                  View all alerts
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BF'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BF'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold truncate">{user?.name || 'Tamal Roy Chowdhury'}</p>
                    <p className="text-[10px] text-primary font-semibold truncate">
                      {user?.designation || (user?.role === 'ceo' ? 'Chief Executive Officer (CEO)' : 'Executive Manager')}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'tamal@advanceforging.com'}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="h-4 w-4 mr-2" /> Profile & Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" /> Application Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive font-medium cursor-pointer" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out / Exit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Manage Companies Dialog */}
      <Dialog open={companyModalOpen} onOpenChange={setCompanyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold">Manage Company Entities</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Add your organizations or remove entities. Switch between them anytime from the header.
            </DialogDescription>
          </DialogHeader>

          {/* Add New Company Form */}
          <form onSubmit={handleAddCompany} className="p-3.5 rounded-xl bg-muted/40 border space-y-3">
            <p className="text-xs font-bold text-foreground">+ Register New Company</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Short Code</Label>
                <Input
                  placeholder="e.g. AF"
                  value={newCompanyCode}
                  onChange={e => setNewCompanyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="h-8 text-xs font-mono uppercase font-bold"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-muted-foreground">Company Full Name</Label>
                <Input
                  placeholder="e.g. Advance Forging Pvt Ltd"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full h-8 text-xs font-semibold gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Company
            </Button>
          </form>

          {/* Existing Companies List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered Companies ({companies.length})</p>
            {companies.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No companies registered yet. Create one above.</p>
            ) : (
              companies.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card/60 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="font-mono font-bold text-xs shrink-0">{c.code}</Badge>
                    <span className="text-xs font-medium truncate">{c.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDeleteCompany(c.id, c.name, c.code)}
                    title="Delete Company"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setCompanyModalOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
