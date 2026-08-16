import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'database')

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'bidfly.db')
  db = new Database(dbPath)

  // Configure SQLite WAL mode for performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run Schema Migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY,
      tender_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      organization TEXT NOT NULL,
      category TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      publish_date TEXT NOT NULL,
      submission_deadline TEXT NOT NULL,
      submission_location TEXT,
      contact_person TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      documents TEXT,
      tags TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
    CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(submission_deadline);
    CREATE INDEX IF NOT EXISTS idx_tenders_org ON tenders(organization);

    CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      bid_number TEXT UNIQUE NOT NULL,
      bidder_name TEXT NOT NULL,
      bid_value REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      submission_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      technical_score REAL,
      financial_score REAL,
      overall_score REAL,
      is_winning INTEGER NOT NULL DEFAULT 0,
      documents TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bids_tender ON bids(tender_id);
    CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registration_number TEXT,
      tax_id TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      pincode TEXT,
      contact_person TEXT,
      categories TEXT,
      certifications TEXT,
      rating REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
    CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      tender_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trigger TEXT NOT NULL,
      cron_schedule TEXT,
      action TEXT NOT NULL,
      params TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_entry_sheets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tender_id TEXT,
      rows INTEGER NOT NULL DEFAULT 10,
      cols INTEGER NOT NULL DEFAULT 6,
      cells TEXT NOT NULL,
      column_headers TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'system',
      currency TEXT NOT NULL DEFAULT 'INR',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      language TEXT NOT NULL DEFAULT 'en',
      email_notifications INTEGER NOT NULL DEFAULT 1,
      desktop_notifications INTEGER NOT NULL DEFAULT 1,
      deadline_reminder_hours INTEGER NOT NULL DEFAULT 24,
      tender_sources TEXT,
      api_keys TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'bid_manager',
      designation TEXT,
      assigned_companies TEXT,
      avatar TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)

  // Add designation column if missing
  try {
    db.exec(`ALTER TABLE users ADD COLUMN designation TEXT;`)
  } catch {}

  seedDatabase(db)

  return db
}

function seedDatabase(db: Database.Database): void {
  const now = new Date().toISOString()
  
  // Seed Master Administrator User
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, designation, assigned_companies, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    // Simple salt hash for demonstration: sha256('admin123' + 'bidfly_salt')
    const adminHash = '967d710b14c3e8006e8ef28290f1d6b05423f03b22e11e86efd0c754b2cf03b9'
    insertUser.run(
      'u-admin', 'Tamal Roy Chowdhury', 'tamal@advanceforging.com', adminHash,
      'ceo', 'Chief Executive Officer (CEO)', JSON.stringify(['AF', 'AEC', 'LT']), '', now, now
    )
  }

  // Seed App Settings
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

  // Pure Production Ready State — 0 Dummy Tenders, 0 Dummy Bids, 0 Dummy Vendors
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
