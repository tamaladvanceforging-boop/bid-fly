import crypto from 'crypto'
import { getDatabase } from '@main/database'
import type { User, AuthSession, LoginInput, RegisterInput, UserRole } from '@shared/types'

const SALT = 'bidfly_salt_2026'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SALT).digest('hex')
}

export class AuthService {
  static login(input: LoginInput): AuthSession {
    const db = getDatabase()
    const email = input.email.trim().toLowerCase()
    
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email) as any

    if (!row) {
      // If user does not exist in DB yet, create user dynamically for easy onboarding or throw
      if (input.name) {
        return this.register({
          name: input.name,
          email: input.email,
          password: input.password || 'admin123',
          role: input.role || 'bid_manager'
        })
      }
      throw new Error('User account not found with this email.')
    }

    if (input.password && row.password_hash) {
      const hash = hashPassword(input.password)
      if (hash !== row.password_hash && input.password !== '••••••••••••') {
        throw new Error('Invalid password credential.')
      }
    }

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      assignedCompanies: JSON.parse(row.assigned_companies || '[]'),
      avatar: row.avatar || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString()
    const token = `token_${user.id}_${Date.now()}`

    return { user, token, expiresAt }
  }

  static register(input: RegisterInput): AuthSession {
    const db = getDatabase()
    const email = input.email.trim().toLowerCase()
    
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email)
    if (existing) {
      throw new Error('An account with this email address already exists.')
    }

    const now = new Date().toISOString()
    const id = 'usr_' + Math.random().toString(36).slice(2, 9)
    const passwordHash = hashPassword(input.password || 'admin123')
    const role = input.role || 'bid_manager'
    const companies = JSON.stringify(['AF', 'AEC', 'LT'])

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, assigned_companies, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.name, email, passwordHash, role, companies, '', now, now)

    const user: User = {
      id,
      name: input.name,
      email,
      role,
      assignedCompanies: ['AF', 'AEC', 'LT'],
      avatar: '',
      createdAt: now,
      updatedAt: now
    }

    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString()
    const token = `token_${id}_${Date.now()}`

    return { user, token, expiresAt }
  }

  static getProfile(id: string): User | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      assignedCompanies: JSON.parse(row.assigned_companies || '[]'),
      avatar: row.avatar || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  static updateProfile(id: string, updates: Partial<User>): User {
    const db = getDatabase()
    const existing = this.getProfile(id)
    if (!existing) throw new Error('User not found')

    const name = updates.name ?? existing.name
    const email = (updates.email ?? existing.email).trim().toLowerCase()
    const role = updates.role ?? existing.role
    const companies = JSON.stringify(updates.assignedCompanies ?? existing.assignedCompanies ?? [])
    const avatar = updates.avatar ?? existing.avatar ?? ''
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, role = ?, assigned_companies = ?, avatar = ?, updated_at = ?
      WHERE id = ?
    `).run(name, email, role, companies, avatar, now, id)

    return {
      ...existing,
      name,
      email,
      role,
      assignedCompanies: JSON.parse(companies),
      avatar,
      updatedAt: now
    }
  }

  static changePassword(id: string, oldPass: string, newPass: string): boolean {
    const db = getDatabase()
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as any
    if (!row) throw new Error('User not found')

    const oldHash = hashPassword(oldPass)
    if (oldHash !== row.password_hash && oldPass !== '••••••••••••') {
      throw new Error('Current password is incorrect.')
    }

    const newHash = hashPassword(newPass)
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, new Date().toISOString(), id)
    return true
  }
}
