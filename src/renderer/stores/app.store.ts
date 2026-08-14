import { create } from 'zustand'
import type { AppSettings, DashboardStats, Alert } from '@shared/types'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  mobileSidebarOpen: boolean
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: v => set({ sidebarOpen: v }),
  mobileSidebarOpen: false,
  toggleMobileSidebar: () => set({ mobileSidebarOpen: !get().mobileSidebarOpen }),
  setMobileSidebarOpen: v => set({ mobileSidebarOpen: v })
}))

interface ThemeState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (t: Theme) => void
  initTheme: (pref?: AppSettings['theme']) => void
}

function detectSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (t) => {
    const resolved: ResolvedTheme = t === 'system' ? detectSystemTheme() : t
    applyTheme(resolved)
    set({ theme: t, resolvedTheme: resolved })
    if (typeof window !== 'undefined') localStorage.setItem('bidfly-theme', t)
  },
  initTheme: (pref) => {
    let saved: AppSettings['theme'] | null = null
    if (typeof window !== 'undefined') saved = localStorage.getItem('bidfly-theme') as AppSettings['theme'] | null
    const themePref: AppSettings['theme'] = saved ?? pref ?? 'system'
    const resolved: ResolvedTheme = themePref === 'system' ? detectSystemTheme() : themePref
    applyTheme(resolved)
    set({ theme: themePref, resolvedTheme: resolved })
  }
}))

interface AppState {
  loading: boolean
  setLoading: (v: boolean) => void
  stats: DashboardStats | null
  fetchStats: () => Promise<void>
  settings: AppSettings | null
  fetchSettings: () => Promise<void>
  updateSettings: (s: Partial<Omit<AppSettings, 'id' | 'createdAt'>>) => Promise<void>
  alerts: Alert[]
  unreadCount: number
  fetchAlerts: () => Promise<void>
  markAlertRead: (id: string) => Promise<void>
  markAllAlertsRead: () => Promise<void>
  toasts: { id: string; title: string; description?: string; variant?: 'default' | 'success' | 'error' | 'warning' }[]
  addToast: (t: Omit<AppState['toasts'][number], 'id'>) => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: false,
  setLoading: v => set({ loading: v }),
  stats: null,
  fetchStats: async () => {
    if (!window.bidfly?.getStats) return
    const res = await window.bidfly.getStats()
    if (res?.success && res.data) set({ stats: res.data })
  },
  settings: null,
  fetchSettings: async () => {
    if (!window.bidfly?.settings?.get) return
    const res = await window.bidfly.settings.get()
    if (res?.success && res.data) {
      set({ settings: res.data })
      useThemeStore.getState().initTheme(res.data.theme)
    }
  },
  updateSettings: async (s) => {
    if (!window.bidfly?.settings?.update) return
    const res = await window.bidfly.settings.update(s)
    if (res?.success && res.data) {
      set({ settings: res.data })
      if (s.theme) useThemeStore.getState().setTheme(s.theme)
    }
  },
  alerts: [],
  unreadCount: 0,
  fetchAlerts: async () => {
    if (!window.bidfly?.alert?.list) return
    const res = await window.bidfly.alert.list({ limit: 100 })
    if (res?.success && res.data) {
      set({
        alerts: res.data.items,
        unreadCount: res.data.items.filter(a => !a.isRead).length
      })
    }
  },
  markAlertRead: async (id) => {
    if (!window.bidfly?.alert?.markRead) return
    await window.bidfly.alert.markRead(id)
    set({
      alerts: get().alerts.map(a => a.id === id ? { ...a, isRead: true } : a),
      unreadCount: Math.max(0, get().unreadCount - 1)
    })
  },
  markAllAlertsRead: async () => {
    if (!window.bidfly?.alert?.markAllRead) return
    await window.bidfly.alert.markAllRead()
    set({
      alerts: get().alerts.map(a => ({ ...a, isRead: true })),
      unreadCount: 0
    })
  },
  toasts: [],
  addToast: t => {
    const id = Math.random().toString(36).slice(2)
    set({ toasts: [...get().toasts, { id, ...t }] })
    setTimeout(() => get().removeToast(id), 4500)
  },
  removeToast: id => set({ toasts: get().toasts.filter(t => t.id !== id) })
}))
