export type IpcResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export type UserRole = 'ceo' | 'admin' | 'bid_manager' | 'analyst' | 'engineer' | 'freelancer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  designation?: string // e.g. "Chief Executive Officer (CEO)", "Managing Director", "VP - Bidding", "Senior Commercial Engineer"
  companyName?: string
  assignedCompanies?: string[]
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: string
}

export interface LoginInput {
  email: string
  password?: string
  role?: UserRole
  designation?: string
  name?: string
}

export interface RegisterInput {
  name: string
  email: string
  password?: string
  companyName?: string
  designation?: string
  role?: UserRole
}

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'draft' | 'submitted'
export type TenderPriority = 'low' | 'medium' | 'high' | 'critical'
export type BidStatus = 'pending' | 'won' | 'lost' | 'disqualified'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'success'
export type AutomationTrigger = 'cron' | 'event' | 'manual'

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

export type VendorStatus = 'active' | 'inactive' | 'blacklisted'

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
  status: VendorStatus
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
  tenderId?: string
  name: string
  rows: number
  cols: number
  cells: Record<string, DataEntryCell>
  columnHeaders?: string[]
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
  link?: string
  createdAt: string
}

export interface AutomationRule {
  id: string
  name: string
  description?: string
  trigger: AutomationTrigger
  cronSchedule?: string
  cron_schedule?: string
  triggerConfig?: Record<string, unknown>
  action: string
  actionConfig?: Record<string, unknown>
  params?: Record<string, unknown>
  enabled?: boolean
  isEnabled?: boolean
  lastRun?: string
  lastRunAt?: string
  nextRun?: string
  createdAt: string
  updatedAt: string
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
  tenderSources?: string[]
  apiKeys?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'word' | 'print'

export type ClarificationStage = 'pre_bid' | 'post_bid'
export type ClarificationStatus = 'pending_response' | 'clarified' | 'rejected' | 'amendment_issued' | 'under_evaluation'

export interface Clarification {
  id: string
  stage: ClarificationStage
  tenderId: string
  tenderNumber: string
  tenderTitle?: string
  querySubject: string
  clauseReference: string
  clarificationDetails: string
  authorityResponse?: string
  queryDate: string
  status: ClarificationStatus
  reminderDate: string
  reminderHoursBefore?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CompetitorStrength = 'low' | 'medium' | 'high' | 'dominant'

export interface Competitor {
  id: string
  name: string
  gstin?: string
  contactPerson?: string
  email?: string
  phone?: string
  marketStrength: CompetitorStrength
  typicalDiscountRate?: number
  historicalWinRate?: number
  bidsSubmittedCount?: number
  bidsWonCount?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CompetitorRank = 'L1' | 'L2' | 'L3' | 'L4' | 'Disqualified'

export interface CompetitorBid {
  id: string
  tenderId: string
  tenderNumber: string
  tenderTitle?: string
  competitorId: string
  competitorName: string
  quotedPrice: number
  ourPrice?: number
  technicalScore?: number
  rank: CompetitorRank
  isWinner: boolean
  priceVariancePercent?: number
  marginSpread?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BOQItem {
  id: string
  tenderId: string
  groupName: string
  itemCode: string
  description: string
  quantity: number
  uom: string
  estimatedRate: number
  ourQuotedRate: number
  createdAt?: string
  updatedAt?: string
}

export interface CompetitorItemRate {
  id: string
  boqItemId: string
  tenderId: string
  competitorId: string
  competitorName: string
  quotedUnitRate: number
  totalItemAmount?: number
  rateVariancePercent?: number
  isItemL1?: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface DashboardStats {
  totalTenders: number
  activeTenders: number
  openTenders?: number
  submittedBids: number
  activeBids?: number
  wonBids: number
  totalValue?: number
  totalBidValue: number
  wonBidValue: number
  activeVendors: number
  pendingAlerts: number
  upcomingDeadlines?: number
  totalCompetitors?: number
  totalClarifications?: number
  recentTenders?: Tender[]
  recentBids?: Bid[]
}

export interface Report {
  id: string
  name?: string
  title?: string
  type: string
  format?: 'pdf' | 'excel' | 'csv' | string
  size?: string
  filters?: Record<string, unknown>
  downloadUrl?: string
  createdAt?: string
  generatedAt?: string
}
