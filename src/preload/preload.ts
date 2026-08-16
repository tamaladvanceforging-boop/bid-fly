import { contextBridge, ipcRenderer } from 'electron'
import type {
  IpcResponse, Tender, Bid, Vendor, Alert, AutomationRule,
  AppSettings, DataEntrySheet, DashboardStats, Report, User,
  AuthSession, LoginInput, RegisterInput
} from '@shared/types'
import type { EnvConfig } from '@shared/config/env.config'
import type {
  TenderCreateInput, TenderUpdateInput,
  BidCreateInput, BidUpdateInput,
  VendorCreateInput, VendorUpdateInput, PaginationParams
} from '@shared/schemas'

type ListResult<T> = { items: T[]; total: number; page: number; limit: number }

async function invoke<T>(channel: string, ...args: unknown[]): Promise<IpcResponse<T>> {
  return (await ipcRenderer.invoke(channel, ...args)) as IpcResponse<T>
}

const api = {
  // App & Env
  hello: () => invoke<string>('app:hello'),
  getStats: () => invoke<DashboardStats>('app:getStats'),
  getEnv: () => invoke<EnvConfig>('env:get'),

  // Auth
  auth: {
    login: (data: LoginInput) => invoke<AuthSession>('auth:login', data),
    register: (data: RegisterInput) => invoke<AuthSession>('auth:register', data),
    getProfile: (id: string) => invoke<User>('auth:getProfile', id),
    updateProfile: (id: string, updates: Partial<User>) => invoke<User>('auth:updateProfile', id, updates),
    changePassword: (id: string, oldPass: string, newPass: string) => invoke<boolean>('auth:changePassword', id, oldPass, newPass)
  },

  // Tenders
  tender: {
    create: (data: TenderCreateInput) => invoke<Tender>('tender:create', data),
    getById: (id: string) => invoke<Tender>('tender:getById', id),
    list: (params?: PaginationParams) => invoke<ListResult<Tender>>('tender:list', params),
    update: (data: TenderUpdateInput) => invoke<Tender>('tender:update', data),
    delete: (id: string) => invoke<boolean>('tender:delete', id),
    getCategories: () => invoke<{ category: string; count: number }[]>('tender:getCategories'),
    getOrganizations: () => invoke<{ organization: string; count: number }[]>('tender:getOrganizations'),
    getMonthlyTrend: () => invoke<{ month: string; count: number; value: number }[]>('tender:getMonthlyTrend')
  },

  // Bids
  bid: {
    create: (data: BidCreateInput) => invoke<Bid>('bid:create', data),
    getById: (id: string) => invoke<Bid>('bid:getById', id),
    list: (params?: PaginationParams & { tenderId?: string }) => invoke<ListResult<Bid>>('bid:list', params),
    update: (data: BidUpdateInput) => invoke<Bid>('bid:update', data),
    delete: (id: string) => invoke<boolean>('bid:delete', id),
    getByTender: (tenderId: string) => invoke<Bid[]>('bid:getByTender', tenderId),
    getSummary: () => invoke<{
      total: number; won: number; lost: number; pending: number;
      totalValue: number; wonValue: number
    }>('bid:getSummary')
  },

  // Vendors
  vendor: {
    create: (data: VendorCreateInput) => invoke<Vendor>('vendor:create', data),
    getById: (id: string) => invoke<Vendor>('vendor:getById', id),
    list: (params?: PaginationParams) => invoke<ListResult<Vendor>>('vendor:list', params),
    update: (data: VendorUpdateInput) => invoke<Vendor>('vendor:update', data),
    delete: (id: string) => invoke<boolean>('vendor:delete', id)
  },

  // Alerts
  alert: {
    list: (opts?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      invoke<ListResult<Alert>>('alert:list', opts),
    markRead: (id: string) => invoke<boolean>('alert:markRead', id),
    markAllRead: () => invoke<number>('alert:markAllRead'),
    delete: (id: string) => invoke<boolean>('alert:delete', id)
  },

  // Automation
  automation: {
    list: () => invoke<AutomationRule[]>('automation:list'),
    getById: (id: string) => invoke<AutomationRule>('automation:getById', id),
    create: (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) =>
      invoke<AutomationRule>('automation:create', data),
    update: (id: string, data: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>) =>
      invoke<AutomationRule>('automation:update', id, data),
    delete: (id: string) => invoke<boolean>('automation:delete', id),
    toggle: (id: string, enabled: boolean) => invoke<boolean>('automation:toggle', id, enabled)
  },

  // Settings
  settings: {
    get: () => invoke<AppSettings>('settings:get'),
    update: (data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>) =>
      invoke<AppSettings>('settings:update', data)
  },

  // Data Entry Sheets
  sheet: {
    list: () => invoke<DataEntrySheet[]>('sheet:list'),
    getById: (id: string) => invoke<DataEntrySheet>('sheet:getById', id),
    create: (data: Omit<DataEntrySheet, 'id' | 'createdAt' | 'updatedAt'>) =>
      invoke<DataEntrySheet>('sheet:create', data),
    update: (id: string, data: Partial<Omit<DataEntrySheet, 'id' | 'createdAt'>>) =>
      invoke<DataEntrySheet>('sheet:update', id, data),
    delete: (id: string) => invoke<boolean>('sheet:delete', id)
  },

  // Reports
  report: {
    generate: (name: string, type: Report['type'], filters?: Record<string, unknown>) =>
      invoke<Report>('report:generate', name, type, filters),
    list: () => invoke<Report[]>('report:list')
  }
} as const

export type BidFlyAPI = typeof api

contextBridge.exposeInMainWorld('bidfly', api)
