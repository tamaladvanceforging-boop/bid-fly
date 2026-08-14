import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, Table2, BarChart3,
  Workflow, Bell, Settings, ChevronLeft, ChevronRight, Menu,
  Gavel, Sparkles
} from 'lucide-react'
import { cn } from '@shared/utils'
import { Button } from '@renderer/components/ui/button'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Separator } from '@renderer/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useUIStore } from '@renderer/stores/app.store'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenders', label: 'Tenders', icon: Gavel, badge: true },
  { to: '/bids', label: 'Bids & Scoring', icon: FileText },
  { to: '/data-entry', label: 'Tender Datasheet', icon: Table2 },
  { to: '/vendors', label: 'Vendors', icon: Users },
  { to: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/automation', label: 'Automation', icon: Workflow }
]

function SidebarNav() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen)
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    !sidebarOpen && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </TooltipTrigger>
              {!sidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          )
        })}
      </nav>
    </TooltipProvider>
  )
}

function SidebarBottom() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen)
  const location = useLocation()
  const isSettings = location.pathname.startsWith('/settings')
  const Icon1 = Bell
  const Icon2 = Settings

  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border/60 p-2">
      <NavLink
        to="/alerts"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all',
          location.pathname === '/alerts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          !sidebarOpen && 'justify-center px-2'
        )}
      >
        <Icon1 className="h-4 w-4 shrink-0" />
        {sidebarOpen && <span>Alerts & Deadlines</span>}
      </NavLink>
      <NavLink
        to="/settings"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all',
          isSettings ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          !sidebarOpen && 'justify-center px-2'
        )}
      >
        <Icon2 className="h-4 w-4 shrink-0" />
        {sidebarOpen && <span>Settings</span>}
      </NavLink>

      {sidebarOpen && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-muted/40 border text-[11px] text-muted-foreground">
          <p className="font-bold text-foreground truncate">BidFly Enterprise</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Dev by Tamal Roy Chowdhury</p>
        </div>
      )}
    </div>
  )
}

import { BidFlyLogo } from '@renderer/components/ui/Logo'

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border/60 bg-card/40 backdrop-blur-sm transition-all duration-200 ease-out sticky top-0 h-screen',
          sidebarOpen ? 'w-64' : 'w-[72px]'
        )}
      >
        <div className="flex h-16 items-center justify-between px-3.5 border-b border-border/60 shrink-0">
          <BidFlyLogo showText={sidebarOpen} size="md" subtitle="Enterprise Suite" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', !sidebarOpen && 'hidden')}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {!sidebarOpen && (
          <div className="px-2 py-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="w-full h-8 text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 py-2">
          <SidebarNav />
        </ScrollArea>
        <SidebarBottom />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm animate-in fade-in-0"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card md:hidden transition-transform duration-200',
          mobileSidebarOpen ? 'translate-x-0 animate-in slide-in-from-left' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <BidFlyLogo showText={true} size="md" subtitle="Enterprise Suite" />
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          <SidebarNav />
        </ScrollArea>
        <Separator />
        <SidebarBottom />
      </aside>
    </>
  )
}
