import { getDatabase } from '@main/database'
import type { Bid } from '@shared/types'
import type { BidCreateInput, BidUpdateInput, PaginationParams } from '@shared/schemas'
import { generateId, nowISO, safeJsonParse, buildWhereClause } from './base'

function rowToBid(row: Record<string, unknown>): Bid {
  return {
    id: row.id as string,
    tenderId: row.tender_id as string,
    bidNumber: row.bid_number as string,
    bidderName: row.bidder_name as string,
    bidValue: row.bid_value as number,
    currency: (row.currency as string) || 'INR',
    submissionDate: row.submission_date as string,
    status: row.status as Bid['status'],
    technicalScore: row.technical_score !== null && row.technical_score !== undefined ? Number(row.technical_score) : undefined,
    financialScore: row.financial_score !== null && row.financial_score !== undefined ? Number(row.financial_score) : undefined,
    overallScore: row.overall_score !== null && row.overall_score !== undefined ? Number(row.overall_score) : undefined,
    isWinning: (row.is_winning as number) === 1,
    documents: safeJsonParse<string[]>(row.documents as string, []),
    notes: (row.notes as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export const BidService = {
  create(input: BidCreateInput): Bid {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()
    const stmt = db.prepare(`
      INSERT INTO bids (
        id, tender_id, bid_number, bidder_name, bid_value, currency,
        submission_date, status, technical_score, financial_score,
        overall_score, is_winning, documents, notes, created_at, updated_at
      ) VALUES (
        @id, @tender_id, @bid_number, @bidder_name, @bid_value, @currency,
        @submission_date, @status, @technical_score, @financial_score,
        @overall_score, @is_winning, @documents, @notes, @created_at, @updated_at
      )
    `)
    stmt.run({
      id,
      tender_id: input.tenderId,
      bid_number: input.bidNumber,
      bidder_name: input.bidderName,
      bid_value: input.bidValue,
      currency: input.currency ?? 'INR',
      submission_date: input.submissionDate,
      status: input.status ?? 'pending',
      technical_score: input.technicalScore ?? null,
      financial_score: input.financialScore ?? null,
      overall_score: input.overallScore ?? null,
      is_winning: input.isWinning ? 1 : 0,
      documents: JSON.stringify(input.documents ?? []),
      notes: input.notes ?? '',
      created_at: now,
      updated_at: now
    })
    return BidService.getById(id)!
  },

  getById(id: string): Bid | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM bids WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToBid(row) : null
  },

  list(params: PaginationParams & { tenderId?: string } = {}): { items: Bid[]; total: number; page: number; limit: number } {
    const db = getDatabase()
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc', search, filters, tenderId } = params

    const whereParts: string[] = []
    const queryParams: Record<string, unknown> = {}

    if (tenderId) {
      whereParts.push('tender_id = @tenderId')
      queryParams.tenderId = tenderId
    }

    if (search && search.trim()) {
      whereParts.push('(bidder_name LIKE @search OR bid_number LIKE @search)')
      queryParams.search = `%${search.trim()}%`
    }

    const { clause, params: filterParams } = buildWhereClause(
      filters ? Object.fromEntries(Object.entries(filters).map(([k, v]) => [k === 'status' ? 'status' : k, v])) : {}
    )
    if (clause) whereParts.push(clause.replace(/WHERE /, ''))
    Object.assign(queryParams, filterParams)

    const where = whereParts.length > 0 ? 'WHERE ' + whereParts.join(' AND ') : ''
    const validSortCols = ['created_at', 'bid_value', 'submission_date', 'overall_score', 'status']
    const safeSortBy = validSortCols.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const total = (db.prepare(`SELECT COUNT(*) as count FROM bids ${where}`).get(queryParams) as { count: number }).count
    const rows = db.prepare(
      `SELECT * FROM bids ${where} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT @limit OFFSET @offset`
    ).all({ ...queryParams, limit, offset: (page - 1) * limit }) as Record<string, unknown>[]

    return { items: rows.map(rowToBid), total, page, limit }
  },

  update(input: BidUpdateInput): Bid | null {
    const db = getDatabase()
    const existing = BidService.getById(input.id)
    if (!existing) return null
    const merged = { ...existing, ...input }
    const now = nowISO()
    db.prepare(`
      UPDATE bids SET
        tender_id = @tender_id, bid_number = @bid_number, bidder_name = @bidder_name,
        bid_value = @bid_value, currency = @currency, submission_date = @submission_date,
        status = @status, technical_score = @technical_score, financial_score = @financial_score,
        overall_score = @overall_score, is_winning = @is_winning, documents = @documents,
        notes = @notes, updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: input.id,
      tender_id: merged.tenderId,
      bid_number: merged.bidNumber,
      bidder_name: merged.bidderName,
      bid_value: merged.bidValue,
      currency: merged.currency,
      submission_date: merged.submissionDate,
      status: merged.status,
      technical_score: merged.technicalScore ?? null,
      financial_score: merged.financialScore ?? null,
      overall_score: merged.overallScore ?? null,
      is_winning: merged.isWinning ? 1 : 0,
      documents: JSON.stringify(merged.documents ?? []),
      notes: merged.notes ?? '',
      updated_at: now
    })
    return BidService.getById(input.id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    return db.prepare('DELETE FROM bids WHERE id = ?').run(id).changes > 0
  },

  getByTender(tenderId: string): Bid[] {
    return BidService.list({ tenderId, limit: 500 }).items
  },

  getSummary() {
    const db = getDatabase()
    return {
      total: (db.prepare('SELECT COUNT(*) as c FROM bids').get() as { c: number }).c,
      won: (db.prepare("SELECT COUNT(*) as c FROM bids WHERE status = 'won' OR is_winning = 1").get() as { c: number }).c,
      lost: (db.prepare("SELECT COUNT(*) as c FROM bids WHERE status = 'lost'").get() as { c: number }).c,
      pending: (db.prepare("SELECT COUNT(*) as c FROM bids WHERE status = 'pending'").get() as { c: number }).c,
      totalValue: (db.prepare('SELECT COALESCE(SUM(bid_value),0) as s FROM bids').get() as { s: number }).s,
      wonValue: (db.prepare("SELECT COALESCE(SUM(bid_value),0) as s FROM bids WHERE status = 'won' OR is_winning = 1").get() as { s: number }).s
    }
  }
}
