import { useEffect, useState } from 'react'
import {
  Settings, Moon, Sun, Monitor, Bell, Globe, Key, Database,
  CheckCircle2, RefreshCw, Shield, HelpCircle, Save, RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { Badge } from '@renderer/components/ui/badge'
import { useAppStore, useThemeStore, type Theme } from '@renderer/stores/app.store'
import type { AppSettings } from '@shared/types'

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings, addToast } = useAppStore()
  const { theme, setTheme } = useThemeStore()

  const [currency, setCurrency] = useState('INR')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(true)
  const [deadlineReminderHours, setDeadlineReminderHours] = useState(24)
  const [gemApiKey, setGemApiKey] = useState('')
  const [tender247ApiKey, setTender247ApiKey] = useState('')
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
      setGemApiKey(settings.apiKeys?.gem || '')
      setTender247ApiKey(settings.apiKeys?.tender247 || '')
    }
  }, [settings])

  const handleSaveGeneral = async () => {
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
        tender247: tender247ApiKey
      }
    })
    setIsSaving(false)
    addToast({ title: 'Settings saved', description: 'Application configuration updated.', variant: 'success' })
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
            Configure application appearance, notification triggers, currencies & integration credentials
          </p>
        </div>
        <Button size="sm" onClick={handleSaveGeneral} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Appearance & Region</TabsTrigger>
          <TabsTrigger value="notifications">Alerts & Reminders</TabsTrigger>
          <TabsTrigger value="api">API Credentials</TabsTrigger>
          <TabsTrigger value="data">Data & Maintenance</TabsTrigger>
        </TabsList>

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

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deadline Reminders & Push Alerts</CardTitle>
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
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tender Portal Integration Keys</CardTitle>
              <CardDescription>Connect official procurement portals for automated discovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Government e-Marketplace (GeM) API Token</Label>
                <Input
                  type="password"
                  value={gemApiKey}
                  onChange={e => setGemApiKey(e.target.value)}
                  placeholder="gem_live_key_..."
                  className="mt-1.5 font-mono text-xs"
                />
              </div>

              <div>
                <Label>Tender24x7 / CPP Portal API Key</Label>
                <Input
                  type="password"
                  value={tender247ApiKey}
                  onChange={e => setTender247ApiKey(e.target.value)}
                  placeholder="t24_secret_..."
                  className="mt-1.5 font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management & Sample Data</CardTitle>
              <CardDescription>Reset local state or populate demo datasets</CardDescription>
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
