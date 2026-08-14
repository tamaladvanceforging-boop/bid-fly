import { getDatabase } from '@main/database'
import type { Vendor, Alert, AutomationRule, AppSettings, DataEntrySheet, Report } from '@shared/types'
import type { VendorCreateInput, VendorUpdateInput, PaginationParams } from '@shared/schemas'
import { generateId, nowISO, safeJsonParse, buildWhereClause } from './base'

function rowToVendor(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    name: row.name as string,
    registrationNumber: (row.registration_number as string) || '',
    taxId: (row.tax_id as string) || '',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    address: (row.address as string) || '',
    city: (row.city as string) || '',
    state: (row.state as string) || '',
    country: (row.country as string) || '',
    pincode: (row.pincode as string) || '',
    contactPerson: (row.contact_person as string) || '',
    categories: safeJsonParse<string[]>(row.categories as string, []),
    certifications: safeJsonParse<string[]>(row.certifications as string, []),
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : undefined,
    status: (row.status as Vendor['status']) || 'active',
    notes: (row.notes as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export const VendorService = {
  create(input: VendorCreateInput): Vendor {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()
    db.prepare(`
      INSERT INTO vendors (
        id, name, registration_number, tax_id, email, phone, address, city, state,
        country, pincode, contact_person, categories, certifications, rating, status,
        notes, created_at, updated_at
      ) VALUES (
        @id, @name, @registration_number, @tax_id, @email, @phone, @address, @city, @state,
        @country, @pincode, @contact_person, @categories, @certifications, @rating, @status,
        @notes, @created_at, @updated_at
      )
    `).run({
      id,
      name: input.name,
      registration_number: input.registrationNumber ?? '',
      tax_id: input.taxId ?? '',
      email: input.email ?? '',
      phone: input.phone ?? '',
      address: input.address ?? '',
      city: input.city ?? '',
      state: input.state ?? '',
      country: input.country ?? '',
      pincode: input.pincode ?? '',
      contact_person: input.contactPerson ?? '',
      categories: JSON.stringify(input.categories ?? []),
      certifications: JSON.stringify(input.certifications ?? []),
      rating: input.rating ?? null,
      status: input.status ?? 'active',
      notes: input.notes ?? '',
      created_at: now,
      updated_at: now
    })
    return VendorService.getById(id)!
  },

  getById(id: string): Vendor | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToVendor(row) : null
  },

  list(params: PaginationParams = {}): { items: Vendor[]; total: number; page: number; limit: number } {
    const db = getDatabase()
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc', search, filters } = params

    const whereParts: string[] = []
    const queryParams: Record<string, unknown> = {}

    if (search && search.trim()) {
      whereParts.push('(name LIKE @search OR email LIKE @search OR registration_number LIKE @search)')
      queryParams.search = `%${search.trim()}%`
    }
    const { clause, params: filterParams } = buildWhereClause(filters ? Object.fromEntries(Object.entries(filters).map(([k, v]) => [k === 'status' ? 'status' : k, v])) : {})
    if (clause) whereParts.push(clause.replace(/WHERE /, ''))
    Object.assign(queryParams, filterParams)
    const where = whereParts.length > 0 ? 'WHERE ' + whereParts.join(' AND ') : ''

    const safeSortBy = ['created_at', 'name', 'rating', 'status'].includes(sortBy) ? sortBy : 'created_at'
    const total = (db.prepare(`SELECT COUNT(*) as count FROM vendors ${where}`).get(queryParams) as { count: number }).count
    const rows = db.prepare(
      `SELECT * FROM vendors ${where} ORDER BY ${safeSortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} LIMIT @limit OFFSET @offset`
    ).all({ ...queryParams, limit, offset: (page - 1) * limit }) as Record<string, unknown>[]

    return { items: rows.map(rowToVendor), total, page, limit }
  },

  update(input: VendorUpdateInput): Vendor | null {
    const db = getDatabase()
    const existing = VendorService.getById(input.id)
    if (!existing) return null
    const merged = { ...existing, ...input }
    const now = nowISO()
    db.prepare(`
      UPDATE vendors SET
        name = @name, registration_number = @registration_number, tax_id = @tax_id,
        email = @email, phone = @phone, address = @address, city = @city, state = @state,
        country = @country, pincode = @pincode, contact_person = @contact_person,
        categories = @categories, certifications = @certifications, rating = @rating,
        status = @status, notes = @notes, updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: input.id,
      name: merged.name,
      registration_number: merged.registrationNumber ?? '',
      tax_id: merged.taxId ?? '',
      email: merged.email ?? '',
      phone: merged.phone ?? '',
      address: merged.address ?? '',
      city: merged.city ?? '',
      state: merged.state ?? '',
      country: merged.country ?? '',
      pincode: merged.pincode ?? '',
      contact_person: merged.contactPerson ?? '',
      categories: JSON.stringify(merged.categories ?? []),
      certifications: JSON.stringify(merged.certifications ?? []),
      rating: merged.rating ?? null,
      status: merged.status ?? 'active',
      notes: merged.notes ?? '',
      updated_at: now
    })
    return VendorService.getById(input.id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    return db.prepare('DELETE FROM vendors WHERE id = ?').run(id).changes > 0
  }
}

export const AlertService = {
  create(title: string, message: string, severity: Alert['severity'] = 'info', tenderId?: string): Alert {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()
    db.prepare(`
      INSERT INTO alerts (id, title, message, severity, tender_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, title, message, severity, tenderId ?? null, now)
    return AlertService.getById(id)!
  },

  getById(id: string): Alert | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return {
      id: row.id as string,
      title: row.title as string,
      message: (row.message as string) || '',
      severity: row.severity as Alert['severity'],
      tenderId: row.tender_id as string | undefined,
      isRead: (row.is_read as number) === 1,
      createdAt: row.created_at as string
    }
  },

  list(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const db = getDatabase()
    const { page = 1, limit = 50, unreadOnly = false } = params
    const where = unreadOnly ? 'WHERE is_read = 0' : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM alerts ${where}`).get() as { c: number }).c
    const rows = db.prepare(
      `SELECT * FROM alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(limit, (page - 1) * limit) as Record<string, unknown>[]
    return {
      items: rows.map(r => ({
        id: r.id as string,
        title: r.title as string,
        message: (r.message as string) || '',
        severity: r.severity as Alert['severity'],
        tenderId: r.tender_id as string | undefined,
        isRead: (r.is_read as number) === 1,
        createdAt: r.created_at as string
      })),
      total,
      page,
      limit
    }
  },

  markRead(id: string): boolean {
    const db = getDatabase()
    return db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(id).changes > 0
  },

  markAllRead(): number {
    const db = getDatabase()
    return db.prepare('UPDATE alerts SET is_read = 1 WHERE is_read = 0').run().changes
  },

  delete(id: string): boolean {
    const db = getDatabase()
    return db.prepare('DELETE FROM alerts WHERE id = ?').run(id).changes > 0
  },

  clearOld(daysOld = 30): number {
    const db = getDatabase()
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()
    return db.prepare('DELETE FROM alerts WHERE created_at < ?').run(cutoff).changes
  }
}

export const AutomationService = {
  create(data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): AutomationRule {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()
    db.prepare(`
      INSERT INTO automation_rules (id, name, description, trigger, cron_schedule, action, params, is_enabled, last_run, next_run, created_at, updated_at)
      VALUES (@id, @name, @description, @trigger, @cron_schedule, @action, @params, @is_enabled, @last_run, @next_run, @created_at, @updated_at)
    `).run({
      id,
      name: data.name,
      description: data.description ?? '',
      trigger: data.trigger,
      cron_schedule: data.cronSchedule ?? null,
      action: data.action,
      params: JSON.stringify(data.params ?? {}),
      is_enabled: data.isEnabled ? 1 : 0,
      last_run: data.lastRun ?? null,
      next_run: data.nextRun ?? null,
      created_at: now,
      updated_at: now
    })
    return AutomationService.getById(id)!
  },

  getById(id: string): AutomationRule | null {
    const db = getDatabase()
    const r = db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!r) return null
    return {
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) || '',
      trigger: r.trigger as AutomationRule['trigger'],
      cronSchedule: r.cron_schedule as string | undefined,
      action: r.action as string,
      params: safeJsonParse(r.params as string, {}),
      isEnabled: (r.is_enabled as number) === 1,
      lastRun: r.last_run as string | undefined,
      nextRun: r.next_run as string | undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string
    }
  },

  list(): AutomationRule[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM automation_rules ORDER BY created_at DESC').all() as Record<string, unknown>[]
    return rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) || '',
      trigger: r.trigger as AutomationRule['trigger'],
      cronSchedule: r.cron_schedule as string | undefined,
      action: r.action as string,
      params: safeJsonParse(r.params as string, {}),
      isEnabled: (r.is_enabled as number) === 1,
      lastRun: r.last_run as string | undefined,
      nextRun: r.next_run as string | undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string
    }))
  },

  update(id: string, data: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>): AutomationRule | null {
    const db = getDatabase()
    const existing = AutomationService.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...data }
    const now = nowISO()
    db.prepare(`
      UPDATE automation_rules SET
        name = @name, description = @description, trigger = @trigger,
        cron_schedule = @cron_schedule, action = @action, params = @params,
        is_enabled = @is_enabled, last_run = @last_run, next_run = @next_run, updated_at = @updated_at
      WHERE id = @id
    `).run({
      id,
      name: merged.name,
      description: merged.description ?? '',
      trigger: merged.trigger,
      cron_schedule: merged.cronSchedule ?? null,
      action: merged.action,
      params: JSON.stringify(merged.params ?? {}),
      is_enabled: merged.isEnabled ? 1 : 0,
      last_run: merged.lastRun ?? null,
      next_run: merged.nextRun ?? null,
      updated_at: now
    })
    return AutomationService.getById(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    return db.prepare('DELETE FROM automation_rules WHERE id = ?').run(id).changes > 0
  },

  toggle(id: string, enabled: boolean): boolean {
    const db = getDatabase()
    return db.prepare('UPDATE automation_rules SET is_enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, nowISO(), id).changes > 0
  }
}

export const SettingsService = {
  get(): AppSettings {
    const db = getDatabase()
    const r = db.prepare('SELECT * FROM app_settings WHERE id = ?').get('default') as Record<string, unknown> | undefined
    if (!r) {
      const now = nowISO()
      db.prepare(`INSERT INTO app_settings (id, theme, currency, timezone, language, email_notifications, desktop_notifications, deadline_reminder_hours, tender_sources, api_keys, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        'default', 'system', 'INR', 'Asia/Kolkata', 'en', 1, 1, 24, '[]', '{}', now, now
      )
      return SettingsService.get()
    }
    return {
      id: r.id as string,
      theme: r.theme as AppSettings['theme'],
      currency: (r.currency as string) || 'INR',
      timezone: (r.timezone as string) || 'Asia/Kolkata',
      language: (r.language as string) || 'en',
      emailNotifications: (r.email_notifications as number) === 1,
      desktopNotifications: (r.desktop_notifications as number) === 1,
      deadlineReminderHours: (r.deadline_reminder_hours as number) || 24,
      tenderSources: safeJsonParse(r.tender_sources as string, []),
      apiKeys: safeJsonParse(r.api_keys as string, {}),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string
    }
  },

  update(data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>): AppSettings {
    const db = getDatabase()
    const existing = SettingsService.get()
    const merged = { ...existing, ...data }
    const now = nowISO()
    db.prepare(`
      UPDATE app_settings SET
        theme = @theme, currency = @currency, timezone = @timezone, language = @language,
        email_notifications = @email_notifications, desktop_notifications = @desktop_notifications,
        deadline_reminder_hours = @deadline_reminder_hours, tender_sources = @tender_sources,
        api_keys = @api_keys, updated_at = @updated_at
      WHERE id = 'default'
    `).run({
      theme: merged.theme,
      currency: merged.currency,
      timezone: merged.timezone,
      language: merged.language,
      email_notifications: merged.emailNotifications ? 1 : 0,
      desktop_notifications: merged.desktopNotifications ? 1 : 0,
      deadline_reminder_hours: merged.deadlineReminderHours,
      tender_sources: JSON.stringify(merged.tenderSources ?? []),
      api_keys: JSON.stringify(merged.apiKeys ?? {}),
      updated_at: now
    })
    return SettingsService.get()
  }
}

export const SheetService = {
  create(data: Omit<DataEntrySheet, 'id' | 'createdAt' | 'updatedAt'>): DataEntrySheet {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()
    db.prepare(`
      INSERT INTO data_entry_sheets (id, name, tender_id, rows, cols, cells, column_headers, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.tenderId ?? null, data.rows, data.cols, JSON.stringify(data.cells ?? {}), JSON.stringify(data.columnHeaders ?? []), now, now)
    return SheetService.getById(id)!
  },

  getById(id: string): DataEntrySheet | null {
    const db = getDatabase()
    const r = db.prepare('SELECT * FROM data_entry_sheets WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!r) return null
    return {
      id: r.id as string,
      name: r.name as string,
      tenderId: r.tender_id as string | undefined,
      rows: r.rows as number,
      cols: r.cols as number,
      cells: safeJsonParse(r.cells as string, {}),
      columnHeaders: safeJsonParse(r.column_headers as string, []),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string
    }
  },

  list(): DataEntrySheet[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT id, name, tender_id, rows, cols, column_headers, created_at, updated_at FROM data_entry_sheets ORDER BY updated_at DESC').all() as Record<string, unknown>[]
    return rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      tenderId: r.tender_id as string | undefined,
      rows: r.rows as number,
      cols: r.cols as number,
      cells: {},
      columnHeaders: safeJsonParse(r.column_headers as string, []),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string
    }))
  },

  update(id: string, data: Partial<Omit<DataEntrySheet, 'id' | 'createdAt'>>): DataEntrySheet | null {
    const db = getDatabase()
    const existing = SheetService.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...data }
    db.prepare(`
      UPDATE data_entry_sheets SET
        name = ?, tender_id = ?, rows = ?, cols = ?, cells = ?, column_headers = ?, updated_at = ?
      WHERE id = ?
    `).run(merged.name, merged.tenderId ?? null, merged.rows, merged.cols, JSON.stringify(merged.cells ?? {}), JSON.stringify(merged.columnHeaders ?? []), nowISO(), id)
    return SheetService.getById(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    return db.prepare('DELETE FROM data_entry_sheets WHERE id = ?').run(id).changes > 0
  }
}

export const ReportService = {
  generate(name: string, type: Report['type'], filters: Record<string, unknown> = {}): Report {
    return {
      id: generateId(),
      name,
      type,
      filters,
      generatedAt: nowISO()
    }
  },

  list(): Report[] {
    return []
  }
}
