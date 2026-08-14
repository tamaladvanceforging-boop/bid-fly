import { create } from 'zustand'

export interface ActivityLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'IMPORT' | 'EXPORT'
  entityType: 'Tender' | 'Bid' | 'Vendor' | 'Datasheet' | 'Automation' | 'Sheet'
  entityId?: string
  entityTitle: string
  details?: string
  userName: string
  timestamp: string // ISO date
}

interface ActivityState {
  activities: ActivityLog[]
  lastDeletedItem: { entityType: string; data: any } | null
  
  // Actions
  logActivity: (
    action: ActivityLog['action'],
    entityType: ActivityLog['entityType'],
    entityTitle: string,
    details?: string,
    entityId?: string
  ) => void
  setLastDeleted: (entityType: string, data: any) => void
  clearLastDeleted: () => void
  clearActivities: () => void
}

const STORAGE_KEY = 'bidfly_activity_logs'

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'act-1',
    action: 'CREATE',
    entityType: 'Datasheet',
    entityTitle: 'GEM/2026/B/7793438 - Turbine Integral Piping',
    details: 'Submitted bid quote of ₹2,84,00,000 for BHEL',
    userName: 'Tamal Roy Chowdhury',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'act-2',
    action: 'UPDATE',
    entityType: 'Tender',
    entityTitle: 'CPWD Multi-Specialty Hospital Block',
    details: 'Status changed from Draft to Open',
    userName: 'Tamal Roy Chowdhury',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'act-3',
    action: 'CREATE',
    entityType: 'Vendor',
    entityTitle: 'Larsen & Toubro Ltd (L&T Heavy Civil)',
    details: 'Empaneled as Tier-1 EPC Vendor with 4.9 rating',
    userName: 'Tamal Roy Chowdhury',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
]

function getInitialLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return INITIAL_LOGS
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: getInitialLogs(),
  lastDeletedItem: null,

  logActivity: (action, entityType, entityTitle, details, entityId) => {
    const newLog: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      action,
      entityType,
      entityTitle,
      details,
      entityId,
      userName: 'Tamal Roy Chowdhury',
      timestamp: new Date().toISOString()
    }
    const updated = [newLog, ...get().activities].slice(0, 100) // Keep last 100 actions
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
    set({ activities: updated })
  },

  setLastDeleted: (entityType, data) => {
    set({ lastDeletedItem: { entityType, data } })
  },

  clearLastDeleted: () => {
    set({ lastDeletedItem: null })
  },

  clearActivities: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    set({ activities: [] })
  }
}))
