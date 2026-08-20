"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from './Toaster';
import { useAuthStore } from '@/stores/auth.store';
import WelcomePage from '@/app/login/page';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === '/login';

  // Prevent flash before hydration
  if (!mounted) {
    return (
      <div className="min-h-screen w-screen bg-[#090d16] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user is NOT authenticated, default directly to the futuristic Welcome / Landing page
  if (!isAuthenticated || isAuthPage) {
    return (
      <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#090d16] text-foreground select-text">
        <main className="relative z-10 min-h-screen">
          <WelcomePage />
        </main>
        <Toaster />
      </div>
    );
  }

  // If user IS authenticated, render full enterprise workspace
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
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
