import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { AppLayout } from '@renderer/components/layout/AppLayout'
import { useAppStore, useThemeStore } from '@renderer/stores/app.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import { createBrowserMockAPI } from '@renderer/mock/browserMock'
import WelcomePage from '@renderer/pages/Welcome'
import Dashboard from '@renderer/pages/Dashboard'
import Tenders from '@renderer/pages/Tenders'
import Bids from '@renderer/pages/Bids'
import Vendors from '@renderer/pages/Vendors'
import DataEntry from '@renderer/pages/DataEntry'
import Reports from '@renderer/pages/Reports'
import Automation from '@renderer/pages/Automation'
import Alerts from '@renderer/pages/Alerts'
import Settings from '@renderer/pages/Settings'
import { Loader2 } from 'lucide-react'
import { BidFlyLogo } from '@renderer/components/ui/Logo'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-95">
        <BidFlyLogo size="xl" showText={true} subtitle="Enterprise Bid Management & Tender Suite" />
        <div className="flex items-center gap-2.5 text-muted-foreground mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-mono">Initializing secure local workspace...</span>
        </div>
      </div>
    </div>
  )
}

export function App() {
  const fetchSettings = useAppStore(s => s.fetchSettings)
  const initTheme = useThemeStore(s => s.initTheme)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function boot() {
      try {
        if (typeof window !== 'undefined' && !window.bidfly) {
          window.bidfly = createBrowserMockAPI() as any
        }
        if (typeof window !== 'undefined' && window.bidfly?.hello) {
          await window.bidfly.hello()
        }
        const res = await window.bidfly?.settings?.get()
        initTheme(res?.success && res.data ? res.data.theme : 'system')
        await fetchSettings()
      } catch (e) {
        initTheme('system')
      } finally {
        setTimeout(() => setLoading(false), 250)
      }
    }
    boot()
  }, [fetchSettings, initTheme])

  if (loading) return <LoadingScreen />

  // If user is NOT logged in, show Welcome / Landing / Auth Page
  if (!isAuthenticated) {
    return (
      <TooltipProvider delayDuration={150}>
        <WelcomePage />
      </TooltipProvider>
    )
  }

  // If logged in, show full application with Navigation & Dashboard
  return (
    <TooltipProvider delayDuration={150}>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tenders" element={<Tenders />} />
            <Route path="/bids" element={<Bids />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </TooltipProvider>
  )
}

export default App
