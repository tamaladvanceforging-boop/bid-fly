import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

let db: Database.Database | null = null

export function getDbPath(): string {
  const dbDir = path.join(app.getPath('userData'), 'database')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  return path.join(dbDir, 'bidfly.db')
}

export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY,
      tender_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      organization TEXT NOT NULL,
      category TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'draft',
      priority TEXT NOT NULL DEFAULT 'medium',
      publish_date TEXT NOT NULL,
      submission_deadline TEXT NOT NULL,
      submission_location TEXT DEFAULT '',
      contact_person TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      documents TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
    CREATE INDEX IF NOT EXISTS idx_tenders_priority ON tenders(priority);
    CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(submission_deadline);
    CREATE INDEX IF NOT EXISTS idx_tenders_organization ON tenders(organization);
    CREATE INDEX IF NOT EXISTS idx_tenders_category ON tenders(category);

    CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
      bid_number TEXT NOT NULL UNIQUE,
      bidder_name TEXT NOT NULL,
      bid_value REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      submission_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      technical_score REAL,
      financial_score REAL,
      overall_score REAL,
      is_winning INTEGER NOT NULL DEFAULT 0,
      documents TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bids_tender ON bids(tender_id);
    CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registration_number TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      country TEXT DEFAULT '',
      pincode TEXT DEFAULT '',
      contact_person TEXT DEFAULT '',
      categories TEXT DEFAULT '[]',
      certifications TEXT DEFAULT '[]',
      rating REAL,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
    CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT DEFAULT '',
      severity TEXT NOT NULL DEFAULT 'info',
      tender_id TEXT REFERENCES tenders(id) ON DELETE SET NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_tender ON alerts(tender_id);

    CREATE TABLE IF NOT EXISTS automation_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      trigger TEXT NOT NULL DEFAULT 'manual',
      cron_schedule TEXT,
      action TEXT NOT NULL,
      params TEXT NOT NULL DEFAULT '{}',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_entry_sheets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tender_id TEXT REFERENCES tenders(id) ON DELETE SET NULL,
      rows INTEGER NOT NULL DEFAULT 50,
      cols INTEGER NOT NULL DEFAULT 20,
      cells TEXT NOT NULL DEFAULT '{}',
      column_headers TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sheets_tender ON data_entry_sheets(tender_id);

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      theme TEXT NOT NULL DEFAULT 'system',
      currency TEXT NOT NULL DEFAULT 'INR',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      language TEXT NOT NULL DEFAULT 'en',
      email_notifications INTEGER NOT NULL DEFAULT 1,
      desktop_notifications INTEGER NOT NULL DEFAULT 1,
      deadline_reminder_hours INTEGER NOT NULL DEFAULT 24,
      tender_sources TEXT NOT NULL DEFAULT '[]',
      api_keys TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  seedDatabase(db)

  return db
}

function seedDatabase(db: Database.Database): void {
  const now = new Date().toISOString()
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM app_settings').get() as { count: number }
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO app_settings (
        id, theme, currency, timezone, language,
        email_notifications, desktop_notifications, deadline_reminder_hours,
        tender_sources, api_keys, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default', 'system', 'INR', 'Asia/Kolkata', 'en',
      1, 1, 24,
      JSON.stringify(['Tender24x7', 'TenderKart', 'CPPPortal', 'Government e-Marketplace (GeM)']),
      JSON.stringify({}),
      now, now
    )
  }

  const tenderCount = db.prepare('SELECT COUNT(*) as count FROM tenders').get() as { count: number }
  if (tenderCount.count === 0) {
    // Seed initial tenders
    const insertTender = db.prepare(`
      INSERT INTO tenders (
        id, tender_number, title, description, organization, category, value, currency,
        status, priority, publish_date, submission_deadline, submission_location,
        contact_person, contact_email, contact_phone, documents, tags, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertTender.run(
      't-101', 'CPWD/2026/CIVIL/8841', 'Construction of Multi-Specialty Hospital Block',
      'Turnkey construction of 500-bed hospital building including civil structure, MEP, HVAC, electrical substations, firefighting systems, and external development.',
      'Central Public Works Department (CPWD)', 'Civil Works', 84500000, 'INR', 'open', 'critical',
      new Date(Date.now() - 5 * 86400000).toISOString(),
      new Date(Date.now() + 18 * 86400000).toISOString(),
      'New Delhi, Delhi NCR', 'Er. Rajeshwar Sharma', 'rajeshwar.cpwd@nic.in', '+91 11 2338 4921',
      JSON.stringify(['NIT_8841.pdf', 'BOQ_Hospital.xlsx']),
      JSON.stringify(['Hospital', 'EPC', 'High Value']),
      'Pre-bid meeting on 20th. EMD via Bank Guarantee.', now, now
    )

    insertTender.run(
      't-102', 'IRCTC/IT/CLOUD/2026-03', 'Enterprise Hybrid Cloud Infrastructure & DR Setup',
      'Design, deployment, and 5-year managed services for mission-critical ticketing and catering portal on multi-region Tier-IV cloud.',
      'Indian Railway Catering and Tourism Corp (IRCTC)', 'IT & Software', 42000000, 'INR', 'open', 'high',
      new Date(Date.now() - 12 * 86400000).toISOString(),
      new Date(Date.now() + 6 * 86400000).toISOString(),
      'New Delhi / Online GeM', 'Sanjay Deshmukh (GM IT)', 'it.tenders@irctc.co.in', '+91 11 4110 5000',
      JSON.stringify(['Cloud_RFP_2026.pdf']),
      JSON.stringify(['Cloud', 'Security', 'SLA']),
      'Security audit by CERT-In empaneled auditor mandatory.', now, now
    )

    insertTender.run(
      't-103', 'NHAI/BOT/HWY-44/PKG-3', 'Four-Laning of National Highway Section (EPC Mode)',
      'Widening, strengthening, pavement construction, 6 major bridges, 18 culverts, and toll plaza installation.',
      'National Highways Authority of India (NHAI)', 'Civil Works', 210000000, 'INR', 'submitted', 'critical',
      new Date(Date.now() - 30 * 86400000).toISOString(),
      new Date(Date.now() - 2 * 86400000).toISOString(),
      'Dwarka, New Delhi', 'V. Ramanathan (CGM)', 'cgm.tech@nhai.gov.in', '+91 11 2507 4100',
      JSON.stringify(['DPR_Highway44.pdf']),
      JSON.stringify(['Highway', 'EPC', 'NHAI']),
      'Financial evaluation completed. L1 finalized.', now, now
    )

    // Seed Bids
    const insertBid = db.prepare(`
      INSERT INTO bids (
        id, tender_id, bid_number, bidder_name, bid_value, currency, submission_date,
        status, technical_score, financial_score, overall_score, is_winning, documents, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertBid.run(
      'b-201', 't-101', 'BID-2026-CPWD-01', 'Larsen & Toubro Ltd.', 81200000, 'INR',
      new Date(Date.now() - 2 * 86400000).toISOString(), 'pending', 94.5, 88.0, 91.2, 0,
      JSON.stringify([]), 'Strong technical credentials in hospital engineering.', now, now
    )

    insertBid.run(
      'b-202', 't-103', 'BID-2026-NHAI-01', 'Dilip Buildcon Limited', 198000000, 'INR',
      new Date(Date.now() - 15 * 86400000).toISOString(), 'won', 92.0, 95.0, 93.5, 1,
      JSON.stringify([]), 'Declared L1 winner for Highway 44 EPC package.', now, now
    )

    // Seed Vendors
    const insertVendor = db.prepare(`
      INSERT INTO vendors (
        id, name, registration_number, tax_id, email, phone, address, city, state, country,
        pincode, contact_person, categories, certifications, rating, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertVendor.run(
      'v-301', 'Larsen & Toubro Ltd.', 'L99999MH1946PLC004768', '27AAACL0140P1ZT',
      'tenders.infra@larsentoubro.com', '+91 22 6752 5656', 'L&T House, Ballard Estate',
      'Mumbai', 'Maharashtra', 'India', '400001', 'Vikram Sengupta',
      JSON.stringify(['Civil Works', 'Infrastructure', 'EPC']),
      JSON.stringify(['ISO 9001:2015', 'ISO 14001:2015', 'CMMI Level 5']),
      4.9, 'active', 'Tier 1 infrastructure prime contractor.', now, now
    )

    insertVendor.run(
      'v-302', 'Tata Consultancy Services Ltd.', 'L22210MH1995PLC084781', '27AAACT2727Q1ZW',
      'gov.solutions@tcs.com', '+91 22 6778 9999', 'TCS House, Fort',
      'Mumbai', 'Maharashtra', 'India', '400001', 'Meera Nambiar',
      JSON.stringify(['IT & Software', 'Cloud', 'Consulting']),
      JSON.stringify(['CMMI Level 5', 'ISO 27001', 'SOC 2 Type II']),
      4.8, 'active', 'Strategic IT partner for government missions.', now, now
    )

    // Seed Alerts
    const insertAlert = db.prepare(`
      INSERT INTO alerts (id, title, message, severity, tender_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    insertAlert.run('a-401', 'Submission Deadline Approaching: IRCTC Cloud RFP', 'Submission closing in 6 days. Verify digital signature tokens.', 'warning', 't-102', 0, now)
    insertAlert.run('a-402', 'Bid Winner Notification: NHAI Highway 44', 'Dilip Buildcon Ltd. awarded contract as L1 bidder.', 'success', 't-103', 0, now)
    insertAlert.run('a-403', 'New Tender Discovered: CPWD Hospital', 'High value hospital construction opportunity published.', 'info', 't-101', 1, now)

    // Seed Automation Rules
    const insertAuto = db.prepare(`
      INSERT INTO automation_rules (id, name, description, trigger, cron_schedule, action, params, is_enabled, last_run, next_run, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertAuto.run('r-501', 'Daily Tender Discovery & GeM Sync', 'Fetch new government tenders from GeM & Tender24x7', 'cron', '0 8 * * 1-6', 'sync_tenders', '{}', 1, now, now, now, now)
    insertAuto.run('r-502', '24h Submission Deadline Warning', 'Send alert notifications before submission deadlines', 'cron', '0 */4 * * *', 'send_deadline_reminder', '{}', 1, now, now, now, now)

    // Seed Data Entry Sheet
    const insertSheet = db.prepare(`
      INSERT INTO data_entry_sheets (id, name, tender_id, rows, cols, cells, column_headers, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertSheet.run(
      's-601', 'CPWD Hospital BOQ & Rate Matrix', 't-101', 15, 7,
      JSON.stringify({
        '0:0': { row: 0, col: 0, value: 'Item #' },
        '0:1': { row: 0, col: 1, value: 'Scope Description' },
        '0:2': { row: 0, col: 2, value: 'Unit' },
        '0:3': { row: 0, col: 3, value: 'Quantity' },
        '0:4': { row: 0, col: 4, value: 'Est. Rate (₹)' },
        '0:5': { row: 0, col: 5, value: 'Total Est. (₹)' },
        '0:6': { row: 0, col: 6, value: 'L1 Bid Quote (₹)' },
        '1:0': { row: 1, col: 0, value: '1.01' },
        '1:1': { row: 1, col: 1, value: 'Excavation in foundation' },
        '1:2': { row: 1, col: 2, value: 'Cum' },
        '1:3': { row: 1, col: 3, value: '12500' },
        '1:4': { row: 1, col: 4, value: '450' },
        '1:5': { row: 1, col: 5, value: '=D2*E2' },
        '1:6': { row: 1, col: 6, value: '5200000' }
      }),
      JSON.stringify(['Item #', 'Scope Description', 'Unit', 'Quantity', 'Est. Rate', 'Total Est.', 'L1 Quote']),
      now, now
    )
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}
