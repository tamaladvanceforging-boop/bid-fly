import type {
  Tender, Bid, Vendor, Alert, AutomationRule,
  AppSettings, DataEntrySheet, DashboardStats, Report, IpcResponse
} from '@shared/types'
import type {
  TenderCreateInput, TenderUpdateInput,
  BidCreateInput, BidUpdateInput,
  VendorCreateInput, VendorUpdateInput, PaginationParams
} from '@shared/schemas'
import { generateId, nowISO } from '@shared/utils'

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

const INITIAL_SETTINGS: AppSettings = {
  id: 'default',
  theme: 'system',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  language: 'en',
  emailNotifications: true,
  desktopNotifications: true,
  deadlineReminderHours: 24,
  tenderSources: ['Tender24x7', 'TenderKart', 'CPPPortal', 'Government e-Marketplace (GeM)', 'Indian Railways e-Procurement'],
  apiKeys: {},
  createdAt: nowISO(),
  updatedAt: nowISO()
}

const INITIAL_TENDERS: Tender[] = []
const INITIAL_BIDS: Bid[] = []
const INITIAL_VENDORS: Vendor[] = []
const INITIAL_ALERTS: Alert[] = []
const INITIAL_AUTOMATION: AutomationRule[] = []
const INITIAL_SHEETS: DataEntrySheet[] = []

class BrowserStorageManager {
  private get<T>(key: string, def: T): T {
    try {
      const raw = localStorage.getItem(`bidfly_${key}`)
      return raw ? (JSON.parse(raw) as T) : def
    } catch {
      return def
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`bidfly_${key}`, JSON.stringify(val))
    } catch (e) {
      console.warn('LocalStorage save failed', e)
    }
  }

  getTenders(): Tender[] { return this.get('tenders', INITIAL_TENDERS) }
  setTenders(v: Tender[]): void { this.set('tenders', v) }

  getBids(): Bid[] { return this.get('bids', INITIAL_BIDS) }
  setBids(v: Bid[]): void { this.set('bids', v) }

  getVendors(): Vendor[] { return this.get('vendors', INITIAL_VENDORS) }
  setVendors(v: Vendor[]): void { this.set('vendors', v) }

  getAlerts(): Alert[] { return this.get('alerts', INITIAL_ALERTS) }
  setAlerts(v: Alert[]): void { this.set('alerts', v) }

  getAutomation(): AutomationRule[] { return this.get('automation', INITIAL_AUTOMATION) }
  setAutomation(v: AutomationRule[]): void { this.set('automation', v) }

  getSheets(): DataEntrySheet[] { return this.get('sheets', INITIAL_SHEETS) }
  setSheets(v: DataEntrySheet[]): void { this.set('sheets', v) }

  getSettings(): AppSettings { return this.get('settings', INITIAL_SETTINGS) }
  setSettings(v: AppSettings): void { this.set('settings', v) }

  resetToSampleData(): void {
    this.setTenders(INITIAL_TENDERS)
    this.setBids(INITIAL_BIDS)
    this.setVendors(INITIAL_VENDORS)
    this.setAlerts(INITIAL_ALERTS)
    this.setAutomation(INITIAL_AUTOMATION)
    this.setSheets(INITIAL_SHEETS)
    this.setSettings(INITIAL_SETTINGS)
  }
}

const store = new BrowserStorageManager()

export function createBrowserMockAPI() {
  return {
    hello: async () => ok('BidFly Browser Mock v1.0.0'),
    getEnv: async () => ok({
      appTitle: 'BidFly Enterprise Suite',
      appVersion: '1.0.0',
      apiUrl: 'http://localhost:3000',
      geminiApiKey: '',
      openaiApiKey: '',
      gemPortalKey: 'gem_live_key_demo12345',
      tender247Key: 't24_secret_demo67890',
      cpppPortalKey: 'cppp_api_token_sample',
      databaseUrl: 'database/bidfly.db',
      authSessionTimeout: 86400
    }),

    auth: {
      login: async (input: { email: string; password?: string; role?: any; name?: string }) => {
        const user = {
          id: 'usr_' + Math.random().toString(36).slice(2, 9),
          name: input.name || (input.email.split('@')[0].toUpperCase() + ' (Lead)'),
          email: input.email,
          role: input.role || 'bid_manager',
          assignedCompanies: ['AF', 'AEC', 'LT']
        }
        return ok({
          user,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString()
        })
      },
      register: async (input: { name: string; email: string; password?: string; role?: any }) => {
        const user = {
          id: 'usr_' + Math.random().toString(36).slice(2, 9),
          name: input.name,
          email: input.email,
          role: input.role || 'bid_manager',
          assignedCompanies: ['AF', 'AEC', 'LT']
        }
        return ok({
          user,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString()
        })
      },
      getProfile: async (id: string) => {
        return ok({
          id,
          name: 'Tamal Roy Chowdhury',
          email: 'tamal@advanceforging.com',
          role: 'ceo' as const,
          designation: 'Chief Executive Officer (CEO)',
          assignedCompanies: ['AF', 'AEC', 'LT']
        })
      },
      updateProfile: async (id: string, updates: any) => {
        return ok({
          id,
          name: updates.name || 'Tamal Roy Chowdhury',
          email: updates.email || 'tamal@advanceforging.com',
          role: updates.role || 'ceo',
          designation: updates.designation || 'Chief Executive Officer (CEO)',
          assignedCompanies: updates.assignedCompanies || ['AF', 'AEC', 'LT'],
          avatar: updates.avatar || ''
        })
      },
      changePassword: async () => ok(true)
    },

    getStats: async (): Promise<IpcResponse<DashboardStats>> => {
      const tenders = store.getTenders()
      const bids = store.getBids()
      const alerts = store.getAlerts()
      const openTenders = tenders.filter(t => t.status === 'open').length
      const activeBids = bids.filter(b => b.status === 'pending').length
      const wonBids = bids.filter(b => b.status === 'won' || b.isWinning).length
      const totalValue = tenders.reduce((acc, t) => acc + (t.value || 0), 0)
      const pendingAlerts = alerts.filter(a => !a.isRead).length
      const upcomingDeadlines = tenders.filter(t => t.status === 'open' && new Date(t.submissionDeadline).getTime() > Date.now()).length

      return ok({
        totalTenders: tenders.length,
        activeTenders: openTenders,
        openTenders,
        submittedBids: activeBids,
        activeBids,
        wonBids,
        totalValue,
        totalBidValue: totalValue,
        wonBidValue: bids.filter(b => b.status === 'won').reduce((acc, b) => acc + (b.bidValue || 0), 0),
        activeVendors: store.getVendors().length,
        pendingAlerts,
        upcomingDeadlines
      })
    },

    tender: {
      create: async (data: TenderCreateInput) => {
        const list = store.getTenders()
        const item: Tender = {
          id: generateId(),
          tenderNumber: data.tenderNumber,
          title: data.title,
          organization: data.organization,
          category: data.category,
          value: data.value,
          currency: data.currency ?? 'INR',
          status: data.status ?? 'draft',
          priority: data.priority ?? 'medium',
          publishDate: data.publishDate,
          submissionDeadline: data.submissionDeadline,
          documents: data.documents ?? [],
          tags: data.tags ?? [],
          notes: data.notes ?? '',
          description: data.description ?? '',
          submissionLocation: data.submissionLocation ?? '',
          contactPerson: data.contactPerson ?? '',
          contactEmail: data.contactEmail ?? '',
          contactPhone: data.contactPhone ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setTenders(list)
        return ok(item)
      },

      getById: async (id: string) => {
        const item = store.getTenders().find(t => t.id === id)
        return item ? ok(item) : { success: false, error: 'Tender not found' }
      },

      list: async (params: PaginationParams = {}) => {
        const { page = 1, limit = 50, search, filters, sortBy = 'created_at', sortOrder = 'desc' } = params
        let items = store.getTenders()
        if (search && search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.tenderNumber.toLowerCase().includes(q) ||
            t.organization.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
          )
        }
        if (filters) {
          if (filters.status) items = items.filter(t => t.status === filters.status)
          if (filters.priority) items = items.filter(t => t.priority === filters.priority)
          if (filters.category) items = items.filter(t => t.category === filters.category)
          if (filters.organization) items = items.filter(t => t.organization === filters.organization)
        }
        items.sort((a, b) => {
          let av = (a as any)[sortBy] ?? a.createdAt
          let bv = (b as any)[sortBy] ?? b.createdAt
          if (typeof av === 'string') av = av.toLowerCase()
          if (typeof bv === 'string') bv = bv.toLowerCase()
          if (av < bv) return sortOrder === 'asc' ? -1 : 1
          if (av > bv) return sortOrder === 'asc' ? 1 : -1
          return 0
        })
        const total = items.length
        const paged = items.slice((page - 1) * limit, page * limit)
        return ok({ items: paged, total, page, limit })
      },

      update: async (data: TenderUpdateInput) => {
        const list = store.getTenders()
        const idx = list.findIndex(t => t.id === data.id)
        if (idx === -1) return { success: false, error: 'Tender not found' }
        const merged: Tender = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setTenders(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getTenders().filter(t => t.id !== id)
        store.setTenders(list)
        return ok(true)
      },

      getCategories: async () => {
        const map = new Map<string, number>()
        store.getTenders().forEach(t => {
          map.set(t.category, (map.get(t.category) ?? 0) + 1)
        })
        return ok(Array.from(map.entries()).map(([category, count]) => ({ category, count })))
      },

      getOrganizations: async () => {
        const map = new Map<string, number>()
        store.getTenders().forEach(t => {
          map.set(t.organization, (map.get(t.organization) ?? 0) + 1)
        })
        return ok(Array.from(map.entries()).map(([organization, count]) => ({ organization, count })))
      },

      getMonthlyTrend: async () => {
        const map = new Map<string, { count: number; value: number }>()
        store.getTenders().forEach(t => {
          const m = t.publishDate.slice(0, 7)
          const curr = map.get(m) ?? { count: 0, value: 0 }
          map.set(m, { count: curr.count + 1, value: curr.value + (t.value || 0) })
        })
        const res = Array.from(map.entries()).map(([month, data]) => ({ month, ...data }))
        res.sort((a, b) => b.month.localeCompare(a.month))
        return ok(res.slice(0, 12))
      }
    },

    bid: {
      create: async (data: BidCreateInput) => {
        const list = store.getBids()
        const item: Bid = {
          id: generateId(),
          tenderId: data.tenderId,
          bidNumber: data.bidNumber,
          bidderName: data.bidderName,
          bidValue: data.bidValue,
          currency: data.currency ?? 'INR',
          submissionDate: data.submissionDate,
          status: data.status ?? 'pending',
          technicalScore: data.technicalScore,
          financialScore: data.financialScore,
          overallScore: data.overallScore,
          isWinning: data.isWinning ?? false,
          documents: data.documents ?? [],
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setBids(list)
        return ok(item)
      },

      getById: async (id: string) => {
        const item = store.getBids().find(b => b.id === id)
        return item ? ok(item) : { success: false, error: 'Bid not found' }
      },

      list: async (params: PaginationParams & { tenderId?: string } = {}) => {
        const { page = 1, limit = 50, search, filters, tenderId } = params
        let items = store.getBids()
        if (tenderId) items = items.filter(b => b.tenderId === tenderId)
        if (search && search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(b => b.bidderName.toLowerCase().includes(q) || b.bidNumber.toLowerCase().includes(q))
        }
        if (filters?.status) items = items.filter(b => b.status === filters.status)
        const total = items.length
        const paged = items.slice((page - 1) * limit, page * limit)
        return ok({ items: paged, total, page, limit })
      },

      update: async (data: BidUpdateInput) => {
        const list = store.getBids()
        const idx = list.findIndex(b => b.id === data.id)
        if (idx === -1) return { success: false, error: 'Bid not found' }
        const merged: Bid = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setBids(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getBids().filter(b => b.id !== id)
        store.setBids(list)
        return ok(true)
      },

      getByTender: async (tenderId: string) => {
        return ok(store.getBids().filter(b => b.tenderId === tenderId))
      },

      getSummary: async () => {
        const bids = store.getBids()
        const won = bids.filter(b => b.status === 'won' || b.isWinning).length
        const lost = bids.filter(b => b.status === 'lost').length
        const pending = bids.filter(b => b.status === 'pending').length
        const totalValue = bids.reduce((acc, b) => acc + (b.bidValue || 0), 0)
        const wonValue = bids.filter(b => b.status === 'won' || b.isWinning).reduce((acc, b) => acc + (b.bidValue || 0), 0)
        return ok({ total: bids.length, won, lost, pending, totalValue, wonValue })
      }
    },

    vendor: {
      create: async (data: VendorCreateInput) => {
        const list = store.getVendors()
        const item: Vendor = {
          id: generateId(),
          name: data.name,
          registrationNumber: data.registrationNumber ?? '',
          taxId: data.taxId ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          country: data.country ?? '',
          pincode: data.pincode ?? '',
          contactPerson: data.contactPerson ?? '',
          categories: data.categories ?? [],
          certifications: data.certifications ?? [],
          rating: data.rating,
          status: data.status ?? 'active',
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setVendors(list)
        return ok(item)
      },

      getById: async (id: string) => {
        const item = store.getVendors().find(v => v.id === id)
        return item ? ok(item) : { success: false, error: 'Vendor not found' }
      },

      list: async (params: PaginationParams = {}) => {
        const { page = 1, limit = 50, search, filters } = params
        let items = store.getVendors()
        if (search && search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.email.toLowerCase().includes(q) ||
            v.registrationNumber.toLowerCase().includes(q) ||
            v.contactPerson.toLowerCase().includes(q)
          )
        }
        if (filters?.status) items = items.filter(v => v.status === filters.status)
        const total = items.length
        const paged = items.slice((page - 1) * limit, page * limit)
        return ok({ items: paged, total, page, limit })
      },

      update: async (data: VendorUpdateInput) => {
        const list = store.getVendors()
        const idx = list.findIndex(v => v.id === data.id)
        if (idx === -1) return { success: false, error: 'Vendor not found' }
        const merged: Vendor = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setVendors(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getVendors().filter(v => v.id !== id)
        store.setVendors(list)
        return ok(true)
      }
    },

    alert: {
      list: async (opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}) => {
        const { page = 1, limit = 50, unreadOnly = false } = opts
        let items = store.getAlerts()
        if (unreadOnly) items = items.filter(a => !a.isRead)
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return ok({ items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit })
      },

      markRead: async (id: string) => {
        const list = store.getAlerts().map(a => a.id === id ? { ...a, isRead: true } : a)
        store.setAlerts(list)
        return ok(true)
      },

      markAllRead: async () => {
        const list = store.getAlerts().map(a => ({ ...a, isRead: true }))
        store.setAlerts(list)
        return ok(list.length)
      },

      delete: async (id: string) => {
        const list = store.getAlerts().filter(a => a.id !== id)
        store.setAlerts(list)
        return ok(true)
      }
    },

    automation: {
      list: async () => ok(store.getAutomation()),

      getById: async (id: string) => {
        const item = store.getAutomation().find(a => a.id === id)
        return item ? ok(item) : { success: false, error: 'Automation rule not found' }
      },

      create: async (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getAutomation()
        const item: AutomationRule = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setAutomation(list)
        return ok(item)
      },

      update: async (id: string, data: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>) => {
        const list = store.getAutomation()
        const idx = list.findIndex(a => a.id === id)
        if (idx === -1) return { success: false, error: 'Automation rule not found' }
        const merged: AutomationRule = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setAutomation(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getAutomation().filter(a => a.id !== id)
        store.setAutomation(list)
        return ok(true)
      },

      toggle: async (id: string, enabled: boolean) => {
        const list = store.getAutomation().map(a => a.id === id ? { ...a, isEnabled: enabled, updatedAt: nowISO() } : a)
        store.setAutomation(list)
        return ok(true)
      }
    },

    settings: {
      get: async () => ok(store.getSettings()),
      update: async (data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>) => {
        const curr = store.getSettings()
        const merged: AppSettings = { ...curr, ...data, updatedAt: nowISO() }
        store.setSettings(merged)
        return ok(merged)
      }
    },

    sheet: {
      list: async () => ok(store.getSheets()),

      getById: async (id: string) => {
        const item = store.getSheets().find(s => s.id === id)
        return item ? ok(item) : { success: false, error: 'Sheet not found' }
      },

      create: async (data: Omit<DataEntrySheet, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getSheets()
        const item: DataEntrySheet = {
          id: generateId(),
          ...data,
          cells: data.cells ?? {},
          columnHeaders: data.columnHeaders ?? [],
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setSheets(list)
        return ok(item)
      },

      update: async (id: string, data: Partial<Omit<DataEntrySheet, 'id' | 'createdAt'>>) => {
        const list = store.getSheets()
        const idx = list.findIndex(s => s.id === id)
        if (idx === -1) return { success: false, error: 'Sheet not found' }
        const merged: DataEntrySheet = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setSheets(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getSheets().filter(s => s.id !== id)
        store.setSheets(list)
        return ok(true)
      }
    },

    report: {
      generate: async (name: string, type: Report['type'], filters: Record<string, unknown> = {}) => {
        return ok({
          id: generateId(),
          name,
          type,
          filters,
          generatedAt: nowISO()
        })
      },
      list: async () => ok([])
    },

    resetSampleData: () => {
      store.resetToSampleData()
    }
  }
}
