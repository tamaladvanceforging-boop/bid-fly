import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from './Toaster'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] animate-in fade-in-0 slide-in-from-bottom-2">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
