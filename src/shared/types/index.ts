export type IpcResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'draft' | 'submitted'
export type TenderPriority = 'low' | 'medium' | 'high' | 'critical'
export type BidStatus = 'pending' | 'won' | 'lost' | 'disqualified'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'success'
export type AutomationTrigger = 'cron' | 'event' | 'manual'
export type ReportType = 'summary' | 'detailed' | 'analytics' | 'financial'

export interface Tender {
  id: string
  tenderNumber: string
  title: string
  description: string
  organization: string
  category: string
  value: number
  currency: string
  status: TenderStatus
  priority: TenderPriority
  publishDate: string
  submissionDeadline: string
  submissionLocation: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  documents?: string[]
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Bid {
  id: string
  tenderId: string
  bidNumber: string
  bidderName: string
  bidValue: number
  currency: string
  submissionDate: string
  status: BidStatus
  technicalScore?: number
  financialScore?: number
  overallScore?: number
  isWinning?: boolean
  documents?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  name: string
  registrationNumber: string
  taxId: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  contactPerson: string
  categories?: string[]
  certifications?: string[]
  rating?: number
  status: 'active' | 'inactive' | 'blacklisted'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DataEntryCell {
  row: number
  col: number
  value: string
  formula?: string
  style?: Record<string, unknown>
}

export interface DataEntrySheet {
  id: string
  name: string
  tenderId?: string
  rows: number
  cols: number
  cells: Record<string, DataEntryCell>
  columnHeaders: string[]
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  tenderId?: string
  isRead: boolean
  createdAt: string
}

export interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: AutomationTrigger
  cronSchedule?: string
  action: string
  params: Record<string, unknown>
  isEnabled: boolean
  lastRun?: string
  nextRun?: string
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  name: string
  type: ReportType
  filters: Record<string, unknown>
  generatedAt: string
  filePath?: string
}

export interface DashboardStats {
  totalTenders: number
  openTenders: number
  activeBids: number
  wonBids: number
  totalValue: number
  pendingAlerts: number
  upcomingDeadlines: number
}

export interface AppSettings {
  id: string
  theme: 'light' | 'dark' | 'system'
  currency: string
  timezone: string
  language: string
  emailNotifications: boolean
  desktopNotifications: boolean
  deadlineReminderHours: number
  tenderSources: string[]
  apiKeys: Record<string, string>
  createdAt: string
  updatedAt: string
}
