export interface EnvConfig {
  appTitle: string
  appVersion: string
  apiUrl: string
  geminiApiKey: string
  openaiApiKey: string
  gemPortalKey: string
  tender247Key: string
  cpppPortalKey: string
  databaseUrl: string
  authSessionTimeout: number
}

export function getEnvConfig(): EnvConfig {
  // Read process.env (Electron Node context) or import.meta.env (Vite frontend context)
  const env: Record<string, string | undefined> = typeof process !== 'undefined' && process.env
    ? process.env as unknown as Record<string, string | undefined>
    : (import.meta as any).env || {}

  return {
    appTitle: env.VITE_APP_TITLE || 'BidFly Enterprise Suite',
    appVersion: env.VITE_APP_VERSION || '1.0.0',
    apiUrl: env.VITE_API_URL || 'http://localhost:3000',
    geminiApiKey: env.GEMINIAI_API_KEY || env.VITE_GEMINIAI_API_KEY || '',
    openaiApiKey: env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || '',
    gemPortalKey: env.GEM_PORTAL_API_KEY || env.VITE_GEM_PORTAL_API_KEY || 'gem_live_key_demo12345',
    tender247Key: env.TENDER247_API_KEY || env.VITE_TENDER247_API_KEY || 't24_secret_demo67890',
    cpppPortalKey: env.CPPP_PORTAL_KEY || env.VITE_CPPP_PORTAL_KEY || 'cppp_api_token_sample',
    databaseUrl: env.DATABASE_URL || 'database/bidfly.db',
    authSessionTimeout: parseInt(env.AUTH_SESSION_TIMEOUT || '86400', 10)
  }
}
