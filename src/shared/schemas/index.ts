import { z } from 'zod'

const num = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? 0 : Number(v)),
  z.number().min(0)
)

const numOpt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
  z.number().min(0).optional()
)

const strInt = (min = 1, max = 10000) =>
  z.preprocess((v) => (v === '' || v === null || v === undefined ? min : Math.max(min, Math.min(max, parseInt(String(v), 10) || min))), z.number().int().min(min).max(max))

export const TenderStatusSchema = z.enum(['open', 'closed', 'awarded', 'draft', 'submitted'])
export const TenderPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const BidStatusSchema = z.enum(['pending', 'won', 'lost', 'disqualified'])
export const AlertSeveritySchema = z.enum(['info', 'warning', 'error', 'success'])
export const AutomationTriggerSchema = z.enum(['cron', 'event', 'manual'])
export const ReportTypeSchema = z.enum(['summary', 'detailed', 'analytics', 'financial'])

export const TenderSchema = z.object({
  id: z.string().min(1),
  tenderNumber: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(''),
  organization: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  value: num,
  currency: z.string().default('INR'),
  status: TenderStatusSchema.default('draft'),
  priority: TenderPrioritySchema.default('medium'),
  publishDate: z.string().min(1),
  submissionDeadline: z.string().min(1),
  submissionLocation: z.string().max(300).optional().default(''),
  contactPerson: z.string().max(200).optional().default(''),
  contactEmail: z.string().email().or(z.literal('')).optional().default(''),
  contactPhone: z.string().max(20).optional().default(''),
  documents: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(5000).optional().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const TenderCreateSchema = TenderSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const TenderUpdateSchema = TenderSchema.partial().required({ id: true })

export const BidSchema = z.object({
  id: z.string().min(1),
  tenderId: z.string().min(1),
  bidNumber: z.string().min(1).max(100),
  bidderName: z.string().min(1).max(200),
  bidValue: num,
  currency: z.string().default('INR'),
  submissionDate: z.string().min(1),
  status: BidStatusSchema.default('pending'),
  technicalScore: numOpt,
  financialScore: numOpt,
  overallScore: numOpt,
  isWinning: z.preprocess(
    (v) => typeof v === 'string' ? v === 'true' : Boolean(v),
    z.boolean().default(false)
  ),
  documents: z.array(z.string()).optional().default([]),
  notes: z.string().max(5000).optional().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const BidCreateSchema = BidSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const BidUpdateSchema = BidSchema.partial().required({ id: true })

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  registrationNumber: z.string().max(100).optional().default(''),
  taxId: z.string().max(100).optional().default(''),
  email: z.string().email().or(z.literal('')).optional().default(''),
  phone: z.string().max(20).optional().default(''),
  address: z.string().max(500).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(100).optional().default(''),
  country: z.string().max(100).optional().default(''),
  pincode: z.string().max(20).optional().default(''),
  contactPerson: z.string().max(200).optional().default(''),
  categories: z.preprocess(
    (v) => {
      if (Array.isArray(v)) return v
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean)
      return []
    },
    z.array(z.string()).default([])
  ),
  certifications: z.preprocess(
    (v) => {
      if (Array.isArray(v)) return v
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean)
      return []
    },
    z.array(z.string()).default([])
  ),
  rating: numOpt,
  status: z.enum(['active', 'inactive', 'blacklisted']).default('active'),
  notes: z.string().max(5000).optional().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const VendorCreateSchema = VendorSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const VendorUpdateSchema = VendorSchema.partial().required({ id: true })

export const AlertSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  message: z.string().max(5000).optional().default(''),
  severity: AlertSeveritySchema.default('info'),
  tenderId: z.string().optional(),
  isRead: z.preprocess(
    (v) => (typeof v === 'number' ? v === 1 : Boolean(v)),
    z.boolean().default(false)
  ),
  createdAt: z.string().min(1)
})

export const AutomationRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  trigger: AutomationTriggerSchema.default('manual'),
  cronSchedule: z.string().optional(),
  action: z.string().min(1).max(200),
  params: z.record(z.unknown()).default({}),
  isEnabled: z.preprocess(
    (v) => (typeof v === 'number' ? v === 1 : Boolean(v)),
    z.boolean().default(true)
  ),
  lastRun: z.string().optional(),
  nextRun: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const AppSettingsSchema = z.object({
  id: z.string().min(1),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  language: z.string().default('en'),
  emailNotifications: z.preprocess(
    (v) => (typeof v === 'number' ? v === 1 : Boolean(v)),
    z.boolean().default(true)
  ),
  desktopNotifications: z.preprocess(
    (v) => (typeof v === 'number' ? v === 1 : Boolean(v)),
    z.boolean().default(true)
  ),
  deadlineReminderHours: strInt(1, 720),
  tenderSources: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(z.string()).default([])
  ),
  apiKeys: z.preprocess(
    (v) => (typeof v === 'object' && v !== null ? v : {}),
    z.record(z.string()).default({})
  ),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const DataEntryCellSchema = z.object({
  row: z.number().min(0),
  col: z.number().min(0),
  value: z.string().default(''),
  formula: z.string().optional(),
  style: z.record(z.unknown()).optional()
})

export const DataEntrySheetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  tenderId: z.string().optional(),
  rows: strInt(1, 5000),
  cols: strInt(1, 52),
  cells: z.preprocess(
    (v) => (typeof v === 'object' && v !== null ? v : {}),
    z.record(DataEntryCellSchema).default({})
  ),
  columnHeaders: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(z.string()).default([])
  ),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const PaginationParamsSchema = z.object({
  page: z.preprocess((v) => (v === '' || v === null || v === undefined ? 1 : Math.max(1, parseInt(String(v), 10) || 1)), z.number().int().min(1)).optional().default(1),
  limit: z.preprocess((v) => (v === '' || v === null || v === undefined ? 50 : Math.max(1, Math.min(500, parseInt(String(v), 10) || 50))), z.number().int().min(1)).optional().default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  filters: z.record(z.string()).optional()
})

export type PaginationParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, string>
}

export type TenderCreateInput = {
  tenderNumber: string
  title: string
  organization: string
  category: string
  value: number
  currency?: string
  status?: TenderStatusSchemaType
  priority?: TenderPrioritySchemaType
  publishDate: string
  submissionDeadline: string
  description?: string
  submissionLocation?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  documents?: string[]
  tags?: string[]
  notes?: string
}

export type TenderUpdateInput = Partial<TenderCreateInput> & { id: string }

export type BidCreateInput = {
  tenderId: string
  bidNumber: string
  bidderName: string
  bidValue: number
  submissionDate: string
  currency?: string
  status?: BidStatusSchemaType
  technicalScore?: number
  financialScore?: number
  overallScore?: number
  isWinning?: boolean
  documents?: string[]
  notes?: string
}

export type BidUpdateInput = Partial<BidCreateInput> & { id: string }

export type VendorCreateInput = {
  name: string
  registrationNumber?: string
  taxId?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  contactPerson?: string
  categories?: string[]
  certifications?: string[]
  rating?: number
  status?: 'active' | 'inactive' | 'blacklisted'
  notes?: string
}

export type VendorUpdateInput = Partial<VendorCreateInput> & { id: string }

type TenderStatusSchemaType = z.infer<typeof TenderStatusSchema>
type TenderPrioritySchemaType = z.infer<typeof TenderPrioritySchema>
type BidStatusSchemaType = z.infer<typeof BidStatusSchema>
