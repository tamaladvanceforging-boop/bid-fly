import type { IpcResponse } from '@shared/types'
export { generateId, nowISO } from '@shared/utils'

export function success<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

export function failure(error: string): IpcResponse<never> {
  return { success: false, error }
}

export function tryCatch<T>(fn: () => T): IpcResponse<T> {
  try {
    return success(fn())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Error]', msg)
    return failure(msg)
  }
}

export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<IpcResponse<T>> {
  try {
    return success(await fn())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Async Error]', msg)
    return failure(msg)
  }
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

export function buildWhereClause(filters?: Record<string, string>): { clause: string; params: Record<string, unknown> } {
  if (!filters || Object.keys(filters).length === 0) {
    return { clause: '', params: {} }
  }
  const parts: string[] = []
  const params: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${key} = @${key}`)
      params[key] = value
    }
  }
  return {
    clause: parts.length > 0 ? ' WHERE ' + parts.join(' AND ') : '',
    params
  }
}
