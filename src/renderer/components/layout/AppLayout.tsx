import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from './Toaster'
import { ParticleBackground } from '@renderer/components/ui/ParticleBackground'

export function AppLayout() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      <ParticleBackground />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden z-10">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 scroll-smooth">
          <div className="mx-auto w-full max-w-[1600px] animate-in fade-in-0 slide-in-from-bottom-2 pb-12 select-text">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
