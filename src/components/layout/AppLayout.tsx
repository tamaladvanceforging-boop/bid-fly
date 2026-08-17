"use client";

import { usePathname } from 'next/navigation';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from './Toaster';
import { ParticleBackground } from '@/components/ui/ParticleBackground';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return (
      <div className="relative min-h-screen w-screen overflow-x-hidden bg-background text-foreground select-text">
        <ParticleBackground />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      <ParticleBackground />
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden z-10">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 scroll-smooth">
          <div className="mx-auto w-full max-w-[1600px] animate-in fade-in-0 slide-in-from-bottom-2 pb-12 select-text">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
export default AppLayout;
