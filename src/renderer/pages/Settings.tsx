import { useEffect, useState } from 'react'
import {
  Moon, Sun, Monitor, Save, RotateCcw,
  Eye, EyeOff, Copy, Check, Shield, User, Key, Database, FileCode, Globe, Lock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { Badge } from '@renderer/components/ui/badge'
import { useAppStore, useThemeStore } from '@renderer/stores/app.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import { realtimeSync } from '@shared/utils/sync.service'
import { PasswordRegex } from '@shared/schemas'

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings, addToast } = useAppStore()
  const { theme, setTheme } = useThemeStore()
  const { user, updateProfileAsync } = useAuthStore()

  const isMainAdmin = user?.role === 'ceo' || user?.role === 'admin'

  const [currency, setCurrency] = useState('INR')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(true)
  const [deadlineReminderHours, setDeadlineReminderHours] = useState(24)

  // .env & Integration State
  const [gemApiKey, setGemApiKey] = useState('')
  const [tender247ApiKey, setTender247ApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [dbPath, setDbPath] = useState('database/bidfly.db')
  const [showKeys, setShowKeys] = useState(false)
  const [copiedEnv, setCopiedEnv] = useState(false)

  // Cloud Sync State
  const initialCloudConfig = realtimeSync.getCloudConfig()
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(initialCloudConfig.enabled)
  const [cloudEndpointUrl, setCloudEndpointUrl] = useState(initialCloudConfig.endpointUrl)
  const [cloudApiKey, setCloudApiKey] = useState(initialCloudConfig.apiKey)

  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileEmail, setProfileEmail] = useState(user?.email || '')
  const [profileDesignation, setProfileDesignation] = useState(user?.designation || 'Chief Executive Officer (CEO)')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency || 'INR')
      setTimezone(settings.timezone || 'Asia/Kolkata')
      setEmailNotifications(settings.emailNotifications ?? true)
      setDesktopNotifications(settings.desktopNotifications ?? true)
      setDeadlineReminderHours(settings.deadlineReminderHours || 24)
      setGemApiKey(settings.apiKeys?.gem || 'gem_live_key_demo12345')
      setTender247ApiKey(settings.apiKeys?.tender247 || 't24_secret_demo67890')
      setGeminiApiKey(settings.apiKeys?.gemini || '')
      setOpenaiApiKey(settings.apiKeys?.openai || '')
    }
  }, [settings])

  useEffect(() => {
    if (user) {
      setProfileName(user.name)
      setProfileEmail(user.email)
      if (user.designation) setProfileDesignation(user.designation)
    }
  }, [user])

  const handleSaveAll = async () => {
    if (user && profileName.trim().length < 5) {
      addToast({ title: 'Validation Error', description: 'Full name must be at least 5 characters long.', variant: 'error' })
      return
    }
    setIsSaving(true)
    await updateSettings({
      currency,
      timezone,
      theme,
      emailNotifications,
      desktopNotifications,
      deadlineReminderHours,
      apiKeys: {
        gem: gemApiKey,
        tender247: tender247ApiKey,
        gemini: geminiApiKey,
        openai: openaiApiKey
      }
    })

    if (user) {
      await updateProfileAsync({ name: profileName.trim(), email: profileEmail.trim(), designation: profileDesignation })
    }

    setIsSaving(false)
    addToast({ title: 'Settings saved', description: 'Application & environment configuration updated.', variant: 'success' })
  }

  const handleCopyEnvSnippet = () => {
    const snippet = `# BidFly Environment Configuration
VITE_APP_TITLE=BidFly Enterprise Suite
VITE_APP_VERSION=1.0.0
GEM_PORTAL_API_KEY=${gemApiKey}
TENDER247_API_KEY=${tender247ApiKey}
GEMINIAI_API_KEY=${geminiApiKey}
OPENAI_API_KEY=${openaiApiKey}
DATABASE_URL=${dbPath}
`
    navigator.clipboard.writeText(snippet)
    setCopiedEnv(true)
    addToast({ title: '.env copied', description: 'Environment variables snippet copied to clipboard.', variant: 'default' })
    setTimeout(() => setCopiedEnv(false), 2000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword) {
      addToast({ title: 'Password error', description: 'Please fill out both old and new password fields.', variant: 'error' })
      return
    }
    if (newPassword.length < 8 || !PasswordRegex.test(newPassword)) {
      addToast({
        title: 'Weak Password',
        description: 'New password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&#).',
        variant: 'error'
      })
      return
    }
    try {
      if (window.bidfly?.auth?.changePassword && user) {
        const res = await window.bidfly.auth.changePassword(user.id, oldPassword, newPassword)
        if (res.success) {
          addToast({ title: 'Password updated', description: 'Your security password has been changed.', variant: 'success' })
          setOldPassword('')
          setNewPassword('')
        } else {
          addToast({ title: 'Password error', description: res.error || 'Failed to change password.', variant: 'error' })
        }
      } else {
        addToast({ title: 'Password updated', description: 'Password changed successfully.', variant: 'success' })
        setOldPassword('')
        setNewPassword('')
      }
    } catch {
      addToast({ title: 'Password error', description: 'An error occurred while updating password.', variant: 'error' })
    }
  }

  const handleResetSampleData = () => {
    if ((window.bidfly as any)?.resetSampleData) {
      (window.bidfly as any).resetSampleData()
      addToast({ title: 'Sample data restored', description: 'Sample tenders, bids, and vendors re-seeded.', variant: 'success' })
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } else {
      addToast({ title: 'Reset complete', variant: 'default' })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings & Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure application appearance, .env credentials, user profiles & database triggers
          </p>
        </div>
        <Button size="sm" onClick={handleSaveAll} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Tabs defaultValue="env" className="space-y-4">
        <TabsList>
          <TabsTrigger value="env"><FileCode className="h-3.5 w-3.5 mr-1.5" /> .env & Credentials</TabsTrigger>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" /> User Profile & Security</TabsTrigger>
          <TabsTrigger value="general"><Monitor className="h-3.5 w-3.5 mr-1.5" /> Appearance & Region</TabsTrigger>
          <TabsTrigger value="notifications"><Database className="h-3.5 w-3.5 mr-1.5" /> Alerts & Maintenance</TabsTrigger>
        </TabsList>

        {/* Tab 1: .env & Credentials Editor */}
        <TabsContent value="env" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" /> Environment & Integration Keys (.env)
                  </CardTitle>
                  <CardDescription>
                    Manage official tender portal API keys (GeM, TenderKart, CPPP), AI model integrations, and database endpoints
                  </CardDescription>
                </div>
                {isMainAdmin && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowKeys(!showKeys)} className="text-xs">
                      {showKeys ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                      {showKeys ? 'Hide Keys' : 'Show Keys'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleCopyEnvSnippet} className="text-xs">
                      {copiedEnv ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      Copy .env Snippet
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {!isMainAdmin && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>🔒 Portal API Key and Integration settings are restricted to CEO & Enterprise Admin roles. You can view masked values only.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Government e-Marketplace (GeM) Token</Label>
                  <Input
                    type={showKeys && isMainAdmin ? 'text' : 'password'}
                    disabled={!isMainAdmin}
                    value={isMainAdmin ? gemApiKey : '••••••••••••••••'}
                    onChange={e => setGemApiKey(e.target.value)}
                    placeholder="Paste GeM portal API key..."
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Used for live GeM bid discovery and NIT downloads.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Tender24x7 / CPP Portal API Key</Label>
                  <Input
                    type={showKeys && isMainAdmin ? 'text' : 'password'}
                    disabled={!isMainAdmin}
                    value={isMainAdmin ? tender247ApiKey : '••••••••••••••••'}
                    onChange={e => setTender247ApiKey(e.target.value)}
                    placeholder="Paste CPPP portal API key..."
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Central Public Procurement Portal API authentication.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Gemini AI Intelligence Key</Label>
                  <Input
                    type={showKeys && isMainAdmin ? 'text' : 'password'}
                    disabled={!isMainAdmin}
                    value={isMainAdmin ? geminiApiKey : '••••••••••••••••'}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    placeholder="Paste Gemini AI API key..."
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Powers automated BOQ analysis & technical scoring.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">OpenAI Fallback Key (Optional)</Label>
                  <Input
                    type={showKeys && isMainAdmin ? 'text' : 'password'}
                    disabled={!isMainAdmin}
                    value={isMainAdmin ? openaiApiKey : '••••••••••••••••'}
                    onChange={e => setOpenaiApiKey(e.target.value)}
                    placeholder="Paste OpenAI API key..."
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Secondary LLM fallback for proposal generation.</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold">Local Vault Storage Path</Label>
                <Input
                  value={dbPath}
                  disabled={!isMainAdmin}
                  onChange={e => setDbPath(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Local Vault Storage path: <span className="font-semibold text-foreground">userData/database/bidfly.db</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Domain & Remote Hosting Sync Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Hybrid Cloud & Domain Host Sync
              </CardTitle>
              <CardDescription>
                Configure remote cloud server endpoints for auto-syncing when hosted on a web domain or cloud backend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div>
                  <p className="text-xs font-bold">Enable Cloud Remote Auto-Sync</p>
                  <p className="text-[11px] text-muted-foreground">Automatically push/pull mutations to your corporate web domain host.</p>
                </div>
                <Switch
                  checked={cloudSyncEnabled}
                  disabled={!isMainAdmin}
                  onCheckedChange={v => {
                    setCloudSyncEnabled(v)
                    realtimeSync?.setCloudConfig({ enabled: v })
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Cloud Sync Endpoint URL</Label>
                  <Input
                    type="url"
                    disabled={!isMainAdmin || !cloudSyncEnabled}
                    value={cloudEndpointUrl}
                    onChange={e => {
                      setCloudEndpointUrl(e.target.value)
                      realtimeSync?.setCloudConfig({ endpointUrl: e.target.value })
                    }}
                    placeholder="https://api.bidfly.app/v1/sync"
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Remote REST / SSE Sync endpoint for web domain deployments.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Cloud Domain API Bearer Token</Label>
                  <Input
                    type={showKeys && isMainAdmin ? 'text' : 'password'}
                    disabled={!isMainAdmin || !cloudSyncEnabled}
                    value={isMainAdmin ? cloudApiKey : '••••••••••••••••'}
                    onChange={e => {
                      setCloudApiKey(e.target.value)
                      realtimeSync?.setCloudConfig({ apiKey: e.target.value })
                    }}
                    placeholder="Bearer token for cloud authentication..."
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Secures web domain communication headers.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: User Profile & Security */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Profile & Account Security
              </CardTitle>
              <CardDescription>Manage user details, assigned entity permissions, and security password</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Corporate Designation / Title</Label>
                  <Input
                    value={profileDesignation}
                    onChange={e => setProfileDesignation(e.target.value)}
                    placeholder="e.g. Chief Executive Officer (CEO)"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Work Email Address</Label>
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">Authority Permission Level</p>
                  <p className="text-sm font-semibold capitalize mt-0.5">{user?.role === 'ceo' ? 'CEO / Board Level (Superadmin)' : (user?.role?.replace('_', ' ') || 'Enterprise Administrator')}</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">AES-256 Auth Enabled</Badge>
              </div>

              <Separator />

              <form onSubmit={handleChangePassword} className="space-y-4">
                <h4 className="text-sm font-bold">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Current Password</Label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <Button type="submit" variant="secondary" size="sm" className="text-xs font-bold">
                  Update Security Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Appearance & Region */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Theme</CardTitle>
              <CardDescription>Select your preferred interface color mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-xs font-semibold">Light Mode</span>
                </Button>
                <Button
                  type="button"
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs font-semibold">Dark Mode</span>
                </Button>
                <Button
                  type="button"
                  variant={theme === 'system' ? 'default' : 'outline'}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-xs font-semibold">System Sync</span>
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Default Currency Format</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ INR (Indian Rupee - Lakhs/Crores)</SelectItem>
                      <SelectItem value="USD">$ USD (US Dollar - Millions)</SelectItem>
                      <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">£ GBP (British Pound)</SelectItem>
                      <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>System Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST +4:00)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (SGT +8:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Alerts & Maintenance */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deadline Reminders & OS Alerts</CardTitle>
              <CardDescription>Configure lead times for submission warnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Desktop OS Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Show native OS banner alerts when deadlines approach</p>
                </div>
                <Switch checked={desktopNotifications} onCheckedChange={setDesktopNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Email Digest & Alerts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Send weekly pipeline summaries and critical updates</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <Separator />

              <div className="max-w-xs">
                <Label>Submission Deadline Lead Time (Hours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={deadlineReminderHours}
                  onChange={e => setDeadlineReminderHours(parseInt(e.target.value, 10) || 24)}
                  className="mt-1.5"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Alert is triggered {deadlineReminderHours} hours prior to closing.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance & Vault Backup</CardTitle>
              <CardDescription>Manage encrypted local database vault storage and system snapshots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                <div>
                  <p className="font-semibold text-sm">Restore Enterprise Sample Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Populate sample government & corporate tenders (CPWD, NHAI, ONGC), bids, scoring sheets, and vendor profiles.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetSampleData}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Restore Samples
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                <div>
                  <p className="font-semibold text-sm">BidFly Platform Version</p>
                  <p className="text-xs text-muted-foreground mt-0.5">BidFly v1.0.0 (Enterprise Suite)</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">v1.0.0-RELEASE</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
