import { getDatabase } from '@main/database'
import type { Tender, DashboardStats } from '@shared/types'
import type { TenderCreateInput, TenderUpdateInput, PaginationParams } from '@shared/schemas'
import { generateId, nowISO, safeJsonParse, buildWhereClause } from './base'

function rowToTender(row: Record<string, unknown>): Tender {
  return {
    id: row.id as string,
    tenderNumber: row.tender_number as string,
    title: row.title as string,
    description: (row.description as string) || '',
    organization: row.organization as string,
    category: row.category as string,
    value: row.value as number,
    currency: (row.currency as string) || 'INR',
    status: row.status as Tender['status'],
    priority: row.priority as Tender['priority'],
    publishDate: row.publish_date as string,
    submissionDeadline: row.submission_deadline as string,
    submissionLocation: (row.submission_location as string) || '',
    contactPerson: (row.contact_person as string) || '',
    contactEmail: (row.contact_email as string) || '',
    contactPhone: (row.contact_phone as string) || '',
    documents: safeJsonParse<string[]>(row.documents as string, []),
    tags: safeJsonParse<string[]>(row.tags as string, []),
    notes: (row.notes as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export const TenderService = {
  create(input: TenderCreateInput): Tender {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()
    const stmt = db.prepare(`
      INSERT INTO tenders (
        id, tender_number, title, description, organization, category, value, currency,
        status, priority, publish_date, submission_deadline, submission_location,
        contact_person, contact_email, contact_phone, documents, tags, notes,
        created_at, updated_at
      ) VALUES (
        @id, @tender_number, @title, @description, @organization, @category, @value, @currency,
        @status, @priority, @publish_date, @submission_deadline, @submission_location,
        @contact_person, @contact_email, @contact_phone, @documents, @tags, @notes,
        @created_at, @updated_at
      )
    `)
    stmt.run({
      id,
      tender_number: input.tenderNumber,
      title: input.title,
      description: input.description ?? '',
      organization: input.organization,
      category: input.category,
      value: input.value,
      currency: input.currency ?? 'INR',
      status: input.status ?? 'draft',
      priority: input.priority ?? 'medium',
      publish_date: input.publishDate,
      submission_deadline: input.submissionDeadline,
      submission_location: input.submissionLocation ?? '',
      contact_person: input.contactPerson ?? '',
      contact_email: input.contactEmail ?? '',
      contact_phone: input.contactPhone ?? '',
      documents: JSON.stringify(input.documents ?? []),
      tags: JSON.stringify(input.tags ?? []),
      notes: input.notes ?? '',
      created_at: now,
      updated_at: now
    })
    return TenderService.getById(id)!
  },

  getById(id: string): Tender | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM tenders WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToTender(row) : null
  },

  list(params: PaginationParams = {}): { items: Tender[]; total: number; page: number; limit: number } {
    const db = getDatabase()
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc', search, filters } = params

    const whereParts: string[] = []
    const queryParams: Record<string, unknown> = {}

    if (search && search.trim()) {
      whereParts.push('(title LIKE @search OR tender_number LIKE @search OR organization LIKE @search OR description LIKE @search)')
      queryParams.search = `%${search.trim()}%`
    }

    const { clause, params: filterParams } = buildWhereClause(
      filters ? Object.fromEntries(Object.entries(filters).map(([k, v]) => [mapColumn(k), v])) : {}
    )
    if (clause) whereParts.push(clause.replace(/WHERE /, ''))
    Object.assign(queryParams, filterParams)

    const where = whereParts.length > 0 ? 'WHERE ' + whereParts.join(' AND ') : ''
    const validSortColumns = ['created_at', 'updated_at', 'title', 'tender_number', 'value', 'publish_date', 'submission_deadline', 'status', 'priority', 'organization']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const total = (db.prepare(`SELECT COUNT(*) as count FROM tenders ${where}`).get(queryParams) as { count: number }).count
    const rows = db.prepare(
      `SELECT * FROM tenders ${where} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT @limit OFFSET @offset`
    ).all({
      ...queryParams,
      limit,
      offset: (page - 1) * limit
    }) as Record<string, unknown>[]

    return {
      items: rows.map(rowToTender),
      total,
      page,
      limit
    }
  },

  update(input: TenderUpdateInput): Tender | null {
    const db = getDatabase()
    const existing = TenderService.getById(input.id)
    if (!existing) return null

    const merged = { ...existing, ...input }
    const now = nowISO()
    const stmt = db.prepare(`
      UPDATE tenders SET
        tender_number = @tender_number,
        title = @title,
        description = @description,
        organization = @organization,
        category = @category,
        value = @value,
        currency = @currency,
        status = @status,
        priority = @priority,
        publish_date = @publish_date,
        submission_deadline = @submission_deadline,
        submission_location = @submission_location,
        contact_person = @contact_person,
        contact_email = @contact_email,
        contact_phone = @contact_phone,
        documents = @documents,
        tags = @tags,
        notes = @notes,
        updated_at = @updated_at
      WHERE id = @id
    `)
    stmt.run({
      id: input.id,
      tender_number: merged.tenderNumber,
      title: merged.title,
      description: merged.description ?? '',
      organization: merged.organization,
      category: merged.category,
      value: merged.value,
      currency: merged.currency,
      status: merged.status,
      priority: merged.priority,
      publish_date: merged.publishDate,
      submission_deadline: merged.submissionDeadline,
      submission_location: merged.submissionLocation ?? '',
      contact_person: merged.contactPerson ?? '',
      contact_email: merged.contactEmail ?? '',
      contact_phone: merged.contactPhone ?? '',
      documents: JSON.stringify(merged.documents ?? []),
      tags: JSON.stringify(merged.tags ?? []),
      notes: merged.notes ?? '',
      updated_at: now
    })
    return TenderService.getById(input.id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM tenders WHERE id = ?').run(id)
    return result.changes > 0
  },

  getStats(): DashboardStats {
    const db = getDatabase()
    const totalTenders = (db.prepare('SELECT COUNT(*) as c FROM tenders').get() as { c: number }).c
    const openTenders = (db.prepare("SELECT COUNT(*) as c FROM tenders WHERE status = 'open'").get() as { c: number }).c
    const activeBids = (db.prepare("SELECT COUNT(*) as c FROM bids WHERE status = 'pending'").get() as { c: number }).c
    const wonBids = (db.prepare("SELECT COUNT(*) as c FROM bids WHERE status = 'won' OR is_winning = 1").get() as { c: number }).c
    const totalValue = (db.prepare('SELECT COALESCE(SUM(value),0) as s FROM tenders').get() as { s: number }).s
    const pendingAlerts = (db.prepare('SELECT COUNT(*) as c FROM alerts WHERE is_read = 0').get() as { c: number }).c
    const now = nowISO()
    const upcomingDeadlines = (db.prepare(
      "SELECT COUNT(*) as c FROM tenders WHERE status = 'open' AND submission_deadline > ?"
    ).get(now) as { c: number }).c

    const activeVendors = (db.prepare("SELECT COUNT(*) as c FROM vendors WHERE status = 'active'").get() as { c: number }).c
    const wonBidValueRow = db.prepare("SELECT SUM(bid_value) as s FROM bids WHERE status = 'won'").get() as { s: number | null }

    return {
      totalTenders,
      activeTenders: openTenders,
      openTenders,
      submittedBids: activeBids,
      activeBids,
      wonBids,
      totalValue,
      totalBidValue: totalValue,
      wonBidValue: wonBidValueRow.s || 0,
      activeVendors,
      pendingAlerts,
      upcomingDeadlines
    }
  },

  getCategories(): { category: string; count: number }[] {
    const db = getDatabase()
    return db.prepare('SELECT category, COUNT(*) as count FROM tenders GROUP BY category ORDER BY count DESC').all() as { category: string; count: number }[]
  },

  getOrganizations(): { organization: string; count: number }[] {
    const db = getDatabase()
    return db.prepare('SELECT organization, COUNT(*) as count FROM tenders GROUP BY organization ORDER BY count DESC').all() as { organization: string; count: number }[]
  },

  getMonthlyTrend(): { month: string; count: number; value: number }[] {
    const db = getDatabase()
    return db.prepare(`
      SELECT
        strftime('%Y-%m', publish_date) as month,
        COUNT(*) as count,
        COALESCE(SUM(value),0) as value
      FROM tenders
      GROUP BY strftime('%Y-%m', publish_date)
      ORDER BY month DESC
      LIMIT 12
    `).all() as { month: string; count: number; value: number }[]
  }
}

function mapColumn(key: string): string {
  const m: Record<string, string> = {
    status: 'status',
    priority: 'priority',
    category: 'category',
    organization: 'organization'
  }
  return m[key] ?? key
}
