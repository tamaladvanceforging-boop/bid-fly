import { create } from 'zustand'

export interface CompanyEntity {
  id: string
  code: string // e.g. 'AF', 'AEC', 'LT', 'TCS'
  name: string // e.g. 'Advance Forging Pvt Ltd', 'Advance Engineering Corp'
  color: string // e.g. 'bg-blue-500'
  isDefault?: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'bid_manager' | 'analyst' | 'freelancer'
  avatar?: string
  assignedCompanies: string[] // Company codes or IDs
}

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  activeCompanyCode: string // 'ALL' or specific company code e.g. 'AF'
  companies: CompanyEntity[]
  
  // Actions
  login: (email: string, role?: UserProfile['role'], name?: string) => void
  logout: () => void
  addCompany: (code: string, name: string, color?: string) => void
  removeCompany: (id: string) => void
  setActiveCompanyCode: (code: string) => void
}

const DEFAULT_COMPANIES: CompanyEntity[] = [
  { id: 'c1', code: 'AF', name: 'Advance Forging Pvt Ltd', color: 'bg-blue-500', isDefault: true },
  { id: 'c2', code: 'AEC', name: 'Advance Engineering Corp', color: 'bg-emerald-500', isDefault: true },
  { id: 'c3', code: 'LT', name: 'Larsen & Toubro Ltd (Client)', color: 'bg-violet-500' }
]

const SAVED_AUTH_KEY = 'bidfly_auth_session'
const SAVED_COMPANIES_KEY = 'bidfly_companies_list'

function getInitialCompanies(): CompanyEntity[] {
  try {
    const raw = localStorage.getItem(SAVED_COMPANIES_KEY)
    if (raw) return JSON.parse(raw)
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

export const useAuthStore = create<AuthState>((set, get) => {
  const initialSession = getInitialSession()
  const initialCompanies = getInitialCompanies()

  return {
    user: initialSession.user,
    isAuthenticated: initialSession.isAuthenticated,
    activeCompanyCode: 'ALL',
    companies: initialCompanies,

    login: (email: string, role: UserProfile['role'] = 'bid_manager', name = 'Tamal (Advance Forging)') => {
      const userProfile: UserProfile = {
        id: 'usr_' + Math.random().toString(36).slice(2, 9),
        name: name || (email.split('@')[0].toUpperCase() + ' (Lead)'),
        email,
        role,
        assignedCompanies: get().companies.map(c => c.code)
      }
      try {
        localStorage.setItem(SAVED_AUTH_KEY, JSON.stringify(userProfile))
      } catch {}
      set({ user: userProfile, isAuthenticated: true })
    },

    logout: () => {
      try {
        localStorage.removeItem(SAVED_AUTH_KEY)
      } catch {}
      set({ user: null, isAuthenticated: false, activeCompanyCode: 'ALL' })
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
