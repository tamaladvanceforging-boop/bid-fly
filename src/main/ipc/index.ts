import { ipcMain } from 'electron'
import { z } from 'zod'
import { TenderService } from '@main/services/tender.service'
import { BidService } from '@main/services/bid.service'
import {
  VendorService, AlertService, AutomationService,
  SettingsService, SheetService, ReportService
} from '@main/services/vendor.service'
import { success, failure, tryCatch, tryCatchAsync } from '@main/services/base'
import {
  TenderCreateSchema, TenderUpdateSchema,
  BidCreateSchema, BidUpdateSchema,
  VendorCreateSchema, VendorUpdateSchema,
  AutomationRuleSchema, AppSettingsSchema,
  DataEntrySheetSchema, PaginationParamsSchema,
  type TenderCreateInput, type TenderUpdateInput,
  type BidCreateInput, type BidUpdateInput,
  type VendorCreateInput, type VendorUpdateInput,
  type PaginationParams
} from '@shared/schemas'
import type { IpcResponse } from '@shared/types'

function validate<T>(schema: z.ZodSchema<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(input)
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.') || 'field'}: ${i.message}`).join('; ')
    return { ok: false, error: `Validation failed: ${errors}` }
  }
  return { ok: true, data: result.data }
}

function validatedHandler<I, O>(
  schema: z.ZodSchema<I>,
  handler: (data: I) => O | Promise<O>
): (input: unknown) => Promise<IpcResponse<O>> {
  return async (input: unknown) => {
    const v = validate(schema, input)
    if (!v.ok) return failure(v.error)
    return tryCatchAsync(async () => handler(v.data))
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('app:hello', () => success('BidFly server running'))
  ipcMain.handle('app:getStats', () => tryCatch(() => TenderService.getStats()))

  // Tenders
  ipcMain.handle('tender:create', (_e, input) =>
    validatedHandler(TenderCreateSchema, d => TenderService.create(d as unknown as TenderCreateInput))(input)
  )
  ipcMain.handle('tender:getById', (_e, id: string) =>
    tryCatch(() => {
      if (!id) return failure('id required')
      const r = TenderService.getById(id)
      return r ? success(r) : failure('not found')
    })
  )
  ipcMain.handle('tender:list', (_e, input) => {
    const v = validate(PaginationParamsSchema, input ?? {})
    if (!v.ok) return failure(v.error)
    return tryCatch(() => TenderService.list(v.data as PaginationParams))
  })
  ipcMain.handle('tender:update', (_e, input) =>
    validatedHandler(TenderUpdateSchema, d => {
      const r = TenderService.update(d as unknown as TenderUpdateInput)
      if (!r) throw new Error('Tender not found')
      return r
    })(input)
  )
  ipcMain.handle('tender:delete', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => {
      const ok = TenderService.delete(id)
      return ok ? success(true) : failure('not found')
    })
  })
  ipcMain.handle('tender:getCategories', () => tryCatch(() => TenderService.getCategories()))
  ipcMain.handle('tender:getOrganizations', () => tryCatch(() => TenderService.getOrganizations()))
  ipcMain.handle('tender:getMonthlyTrend', () => tryCatch(() => TenderService.getMonthlyTrend()))

  // Bids
  ipcMain.handle('bid:create', (_e, input) =>
    validatedHandler(BidCreateSchema, d => BidService.create(d as unknown as BidCreateInput))(input)
  )
  ipcMain.handle('bid:getById', (_e, id: string) =>
    tryCatch(() => {
      if (!id) return failure('id required')
      const r = BidService.getById(id)
      return r ? success(r) : failure('not found')
    })
  )
  ipcMain.handle('bid:list', (_e, input) => {
    const v = validate(PaginationParamsSchema.extend({ tenderId: z.string().optional() }), input ?? {})
    if (!v.ok) return failure(v.error)
    return tryCatch(() => BidService.list(v.data as PaginationParams & { tenderId?: string }))
  })
  ipcMain.handle('bid:update', (_e, input) =>
    validatedHandler(BidUpdateSchema, d => {
      const r = BidService.update(d as unknown as BidUpdateInput)
      if (!r) throw new Error('Bid not found')
      return r
    })(input)
  )
  ipcMain.handle('bid:delete', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => BidService.delete(id) ? success(true) : failure('not found'))
  })
  ipcMain.handle('bid:getByTender', (_e, tenderId: string) =>
    tryCatch(() => BidService.getByTender(tenderId))
  )
  ipcMain.handle('bid:getSummary', () => tryCatch(() => BidService.getSummary()))

  // Vendors
  ipcMain.handle('vendor:create', (_e, input) =>
    validatedHandler(VendorCreateSchema, d => VendorService.create(d as unknown as VendorCreateInput))(input)
  )
  ipcMain.handle('vendor:getById', (_e, id: string) =>
    tryCatch(() => {
      if (!id) return failure('id required')
      const r = VendorService.getById(id)
      return r ? success(r) : failure('not found')
    })
  )
  ipcMain.handle('vendor:list', (_e, input) => {
    const v = validate(PaginationParamsSchema, input ?? {})
    if (!v.ok) return failure(v.error)
    return tryCatch(() => VendorService.list(v.data as PaginationParams))
  })
  ipcMain.handle('vendor:update', (_e, input) =>
    validatedHandler(VendorUpdateSchema, d => {
      const r = VendorService.update(d as unknown as VendorUpdateInput)
      if (!r) throw new Error('Vendor not found')
      return r
    })(input)
  )
  ipcMain.handle('vendor:delete', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => VendorService.delete(id) ? success(true) : failure('not found'))
  })

  // Alerts
  ipcMain.handle('alert:list', (_e, opts) =>
    tryCatch(() => AlertService.list(opts ?? {}))
  )
  ipcMain.handle('alert:markRead', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => AlertService.markRead(id) ? success(true) : failure('not found'))
  })
  ipcMain.handle('alert:markAllRead', () => tryCatch(() => AlertService.markAllRead()))
  ipcMain.handle('alert:delete', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => AlertService.delete(id) ? success(true) : failure('not found'))
  })

  // Automation
  ipcMain.handle('automation:list', () => tryCatch(() => AutomationService.list()))
  ipcMain.handle('automation:getById', (_e, id: string) =>
    tryCatch(() => {
      if (!id) return failure('id required')
      const r = AutomationService.getById(id)
      return r ? success(r) : failure('not found')
    })
  )
  ipcMain.handle('automation:create', (_e, input) => {
    const schema = AutomationRuleSchema.omit({ id: true, createdAt: true, updatedAt: true })
    const v = validate(schema, input)
    if (!v.ok) return failure(v.error)
    return tryCatch(() => AutomationService.create(v.data as Omit<Parameters<typeof AutomationService.create>[0], never>))
  })
  ipcMain.handle('automation:update', (_e, id: string, input) => {
    const schema = AutomationRuleSchema.omit({ id: true, createdAt: true }).partial()
    const v = validate(schema, input)
    if (!v.ok) return failure(v.error)
    return tryCatch(() => {
      const r = AutomationService.update(id, v.data as Parameters<typeof AutomationService.update>[1])
      return r ? success(r) : failure('not found')
    })
  })
  ipcMain.handle('automation:delete', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => AutomationService.delete(id) ? success(true) : failure('not found'))
  })
  ipcMain.handle('automation:toggle', (_e, id: string, enabled: boolean) => {
    if (!id) return failure('id required')
    return tryCatch(() => AutomationService.toggle(id, enabled) ? success(true) : failure('not found'))
  })

  // Settings
  ipcMain.handle('settings:get', () => tryCatch(() => SettingsService.get()))
  ipcMain.handle('settings:update', (_e, input) => {
    const schema = AppSettingsSchema.omit({ id: true, createdAt: true }).partial()
    const v = validate(schema, input)
    if (!v.ok) return failure(v.error)
    return tryCatch(() => SettingsService.update(v.data as Parameters<typeof SettingsService.update>[0]))
  })

  // Data Entry Sheets
  ipcMain.handle('sheet:list', () => tryCatch(() => SheetService.list()))
  ipcMain.handle('sheet:getById', (_e, id: string) =>
    tryCatch(() => {
      if (!id) return failure('id required')
      const r = SheetService.getById(id)
      return r ? success(r) : failure('not found')
    })
  )
  ipcMain.handle('sheet:create', (_e, input) => {
    const schema = DataEntrySheetSchema.omit({ id: true, createdAt: true, updatedAt: true })
    const v = validate(schema, input)
    if (!v.ok) return failure(v.error)
    return tryCatch(() => SheetService.create(v.data as Parameters<typeof SheetService.create>[0]))
  })
  ipcMain.handle('sheet:update', (_e, id: string, input) => {
    const schema = DataEntrySheetSchema.omit({ id: true, createdAt: true }).partial()
    const v = validate(schema, input)
    if (!v.ok) return failure(v.error)
    return tryCatch(() => {
      const r = SheetService.update(id, v.data as Parameters<typeof SheetService.update>[1])
      return r ? success(r) : failure('not found')
    })
  })
  ipcMain.handle('sheet:delete', (_e, id: string) => {
    if (!id) return failure('id required')
    return tryCatch(() => SheetService.delete(id) ? success(true) : failure('not found'))
  })

  // Reports
  ipcMain.handle('report:generate', (_e, name: string, type: string, filters) =>
    tryCatch(() => ReportService.generate(name, type as Parameters<typeof ReportService.generate>[1], filters ?? {}))
  )
  ipcMain.handle('report:list', () => tryCatch(() => ReportService.list()))
}
