import { create } from 'zustand'
import type { User, UserRole, LoginInput, RegisterInput } from '@shared/types'
import { useAppStore } from './app.store'

export interface CompanyEntity {
  id: string
  code: string // e.g. 'AF', 'AEC', 'LT', 'TCS'
  name: string // e.g. 'Advance Forging Pvt Ltd', 'Advance Engineering Corp'
  color: string // e.g. 'bg-blue-500'
  isDefault?: boolean
}

export type UserProfile = User

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  activeCompanyCode: string // 'ALL' or specific company code e.g. 'AF'
  companies: CompanyEntity[]
  error: string | null
  loading: boolean
  rememberMe: boolean
  
  // Role & Permission Checks
  canDelete: () => boolean
  canManageUsers: () => boolean
  canEditSettings: () => boolean
  canEditData: () => boolean

  // Actions
  loginAsync: (input: LoginInput & { rememberMe?: boolean }) => Promise<boolean>
  registerAsync: (input: RegisterInput) => Promise<boolean>
  logout: () => void
  updateProfileAsync: (updates: Partial<UserProfile>) => Promise<boolean>
  addCompany: (code: string, name: string, color?: string) => void
  removeCompany: (id: string) => void
  setActiveCompanyCode: (code: string) => void
  clearError: () => void
  setRememberMe: (val: boolean) => void
}

const DEFAULT_COMPANIES: CompanyEntity[] = []

const SAVED_AUTH_KEY = 'bidfly_auth_session'
const SAVED_COMPANIES_KEY = 'bidfly_companies_list'
const SAVED_REMEMBER_KEY = 'bidfly_remember_creds'

function getInitialCompanies(): CompanyEntity[] {
  try {
    const raw = localStorage.getItem(SAVED_COMPANIES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Filter out legacy dummy companies
      const cleaned = parsed.filter((c: CompanyEntity) => c.code !== 'AF' && c.code !== 'AEC' && c.code !== 'LT')
      return cleaned
    }
  } catch {}
  return DEFAULT_COMPANIES
}

function getInitialSession(): { user: UserProfile | null; isAuthenticated: boolean } {
  try {
    const raw = localStorage.getItem(SAVED_AUTH_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { user: parsed, isAuthenticated: true }
    }
  } catch {}
  return { user: null, isAuthenticated: false }
}

export function getSavedCredentials(): { email?: string; password?: string } | null {
  try {
    const raw = localStorage.getItem(SAVED_REMEMBER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialSession = getInitialSession()
  const initialCompanies = getInitialCompanies()

  return {
    user: initialSession.user,
    isAuthenticated: initialSession.isAuthenticated,
    activeCompanyCode: 'ALL',
    companies: initialCompanies,
    error: null,
    loading: false,
    rememberMe: !!getSavedCredentials(),

    canDelete: () => {
      const role = get().user?.role
      return role === 'admin' || role === 'bid_manager'
    },

    canManageUsers: () => {
      return get().user?.role === 'admin'
    },

    canEditSettings: () => {
      const role = get().user?.role
      return role === 'admin' || role === 'bid_manager'
    },

    canEditData: () => {
      const role = get().user?.role
      return role === 'admin' || role === 'bid_manager' || role === 'freelancer'
    },

    clearError: () => set({ error: null }),
    setRememberMe: (val: boolean) => set({ rememberMe: val }),

    loginAsync: async (input: LoginInput & { rememberMe?: boolean }) => {
      set({ loading: true, error: null })
      try {
        let user: UserProfile | null = null
        if (window.bidfly?.auth?.login) {
          const res = await window.bidfly.auth.login(input)
          if (res.success && res.data) {
            user = res.data.user
          } else {
            const err = res.error || 'Invalid email or password.'
            set({ error: err, loading: false })
            useAppStore.getState().addToast({ title: 'Authentication Failed', description: err, variant: 'error' })
            return false
          }
        } else {
          // Fallback
          user = {
            id: 'usr_' + Math.random().toString(36).slice(2, 9),
            name: input.name || (input.email.split('@')[0].toUpperCase() + ' (Lead)'),
            email: input.email,
            role: input.role || 'ceo',
            designation: input.designation || 'Chief Executive Officer (CEO)',
            assignedCompanies: get().companies.map(c => c.code)
          }
        }

        if (user) {
          localStorage.setItem(SAVED_AUTH_KEY, JSON.stringify(user))
          if (input.rememberMe) {
            localStorage.setItem(SAVED_REMEMBER_KEY, JSON.stringify({ email: input.email, password: input.password }))
          } else {
            localStorage.removeItem(SAVED_REMEMBER_KEY)
          }
          set({ user, isAuthenticated: true, loading: false, rememberMe: !!input.rememberMe })
          useAppStore.getState().addToast({ title: 'Welcome to BidFly', description: `Authenticated as ${user.name} (${user.designation || user.role}).`, variant: 'success' })
          return true
        }

        set({ error: 'Login failed', loading: false })
        useAppStore.getState().addToast({ title: 'Authentication Failed', description: 'Login attempt failed.', variant: 'error' })
        return false
      } catch (err: any) {
        const errMsg = err.message || 'Login failed'
        set({ error: errMsg, loading: false })
        useAppStore.getState().addToast({ title: 'Authentication Error', description: errMsg, variant: 'error' })
        return false
      }
    },

    registerAsync: async (input: RegisterInput) => {
      set({ loading: true, error: null })
      try {
        if (window.bidfly?.auth?.register) {
          const res = await window.bidfly.auth.register(input)
          if (res.success && res.data) {
            const user = res.data.user
            localStorage.setItem(SAVED_AUTH_KEY, JSON.stringify(user))
            set({ user, isAuthenticated: true, loading: false })
            useAppStore.getState().addToast({ title: 'Account Created', description: `Welcome ${user.name}! Your workspace is active.`, variant: 'success' })
            return true
          } else {
            const err = res.error || 'Registration failed'
            set({ error: err, loading: false })
            useAppStore.getState().addToast({ title: 'Registration Error', description: err, variant: 'error' })
            return false
          }
        } else {
          const user: UserProfile = {
            id: 'usr_' + Math.random().toString(36).slice(2, 9),
            name: input.name,
            email: input.email,
            role: input.role || 'ceo',
            designation: input.designation || 'Chief Executive Officer (CEO)',
            assignedCompanies: get().companies.map(c => c.code)
          }
          localStorage.setItem(SAVED_AUTH_KEY, JSON.stringify(user))
          set({ user, isAuthenticated: true, loading: false })
          useAppStore.getState().addToast({ title: 'Account Created', description: `Welcome ${user.name}! Your workspace is active.`, variant: 'success' })
          return true
        }
      } catch (err: any) {
        const errMsg = err.message || 'Registration failed'
        set({ error: errMsg, loading: false })
        useAppStore.getState().addToast({ title: 'Registration Error', description: errMsg, variant: 'error' })
        return false
      }
    },

    logout: () => {
      try {
        localStorage.removeItem(SAVED_AUTH_KEY)
      } catch {}
      set({ user: null, isAuthenticated: false, activeCompanyCode: 'ALL', error: null })
      useAppStore.getState().addToast({ title: 'Signed Out', description: 'You have safely signed out of your workspace.', variant: 'default' })
    },

    updateProfileAsync: async (updates: Partial<UserProfile>) => {
      const current = get().user
      if (!current) return false
      set({ loading: true, error: null })
      try {
        if (window.bidfly?.auth?.updateProfile) {
          const res = await window.bidfly.auth.updateProfile(current.id, updates)
          if (res.success && res.data) {
            const updated = res.data
            localStorage.setItem(SAVED_AUTH_KEY, JSON.stringify(updated))
            set({ user: updated, loading: false })
            useAppStore.getState().addToast({ title: 'Profile Updated', description: 'Your account details have been saved.', variant: 'success' })
            return true
          }
        }
        const updated = { ...current, ...updates }
        localStorage.setItem(SAVED_AUTH_KEY, JSON.stringify(updated))
        set({ user: updated, loading: false })
        useAppStore.getState().addToast({ title: 'Profile Updated', description: 'Your account details have been saved.', variant: 'success' })
        return true
      } catch (err: any) {
        const errMsg = err.message || 'Failed to update profile'
        set({ error: errMsg, loading: false })
        useAppStore.getState().addToast({ title: 'Update Error', description: errMsg, variant: 'error' })
        return false
      }
    },

    addCompany: (code: string, name: string, color = 'bg-primary') => {
      const trimmedCode = code.trim().toUpperCase()
      const trimmedName = name.trim()
      if (!trimmedCode || !trimmedName) return
      
      const newComp: CompanyEntity = {
        id: 'comp_' + Math.random().toString(36).slice(2, 9),
        code: trimmedCode,
        name: trimmedName,
        color
      }
      const updated = [...get().companies, newComp]
      try {
        localStorage.setItem(SAVED_COMPANIES_KEY, JSON.stringify(updated))
      } catch {}
      set({ companies: updated })
    },

    removeCompany: (id: string) => {
      const updated = get().companies.filter(c => c.id !== id)
      try {
        localStorage.setItem(SAVED_COMPANIES_KEY, JSON.stringify(updated))
      } catch {}
      set({ companies: updated })
    },

    setActiveCompanyCode: (code: string) => {
      set({ activeCompanyCode: code })
    }
  }
})
