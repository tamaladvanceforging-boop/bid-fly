"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Users, Table2, BarChart3,
  Workflow, Bell, Settings, ChevronLeft, ChevronRight,
  Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUIStore, useAppStore } from "@/stores/app.store";
import { BidFlyLogo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenders', label: 'Tenders', icon: Gavel, badge: true },
  { to: '/bids', label: 'Bids & Scoring', icon: FileText },
  { to: '/competitors', label: 'Competitor Intelligence', icon: Users },
  { to: '/sheets', label: 'Tender Datasheet', icon: Table2 },
  { to: '/vendors', label: 'Vendors', icon: Users },
  { to: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/automation', label: 'Automation', icon: Workflow }
];

function SidebarNav() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <Link
                  href={item.to as any}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    !sidebarOpen && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="flex-1 flex items-center justify-between">
                      {item.label}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              {!sidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r border-border/60 bg-card transition-all duration-300 ease-in-out select-none',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Top Header: BidFly Logo + Collapse Toggle Button placed side-by-side */}
      <div className={cn(
        'flex h-16 items-center border-b border-border/60 px-3',
        sidebarOpen ? 'justify-between' : 'justify-center flex-col gap-1 py-2 h-auto'
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <BidFlyLogo size={sidebarOpen ? "md" : "sm"} showText={sidebarOpen} />
        </div>

        {/* Collapse (<) / Expand (>) Button placed right next to BidFly logo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors cursor-pointer"
          title={sidebarOpen ? "Collapse sidebar (<)" : "Expand sidebar (>)"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <SidebarNav />
      </ScrollArea>

      <div className="p-2 border-t border-border/60 flex flex-col gap-1">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/alerts"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all',
                  pathname === '/alerts' && 'bg-primary text-primary-foreground shadow-sm',
                  !sidebarOpen && 'justify-center px-2'
                )}
              >
                <Bell className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Notifications</span>}
              </Link>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">Notifications</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all',
                  pathname === '/settings' && 'bg-primary text-primary-foreground shadow-sm',
                  !sidebarOpen && 'justify-center px-2'
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Settings</span>}
              </Link>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const pathname = usePathname();

  if (!mobileSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-xs">
      <div className="fixed inset-y-0 left-0 w-72 bg-card border-r shadow-2xl flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <BidFlyLogo size="md" showText={true} />
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                href={item.to as any}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
export default Sidebar;
