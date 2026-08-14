import { useState } from 'react'
import {
  FileText, ShieldCheck, Sparkles, Zap, ArrowRight, Building2,
  Users, CheckCircle2, Lock, Mail, Key, Eye, EyeOff, Laptop, BarChart3,
  Layers, Trophy, Globe, Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useThemeStore } from '@renderer/stores/app.store'
import { BidFlyLogo } from '@renderer/components/ui/Logo'
import { cn } from '@shared/utils'

export default function WelcomePage() {
  const login = useAuthStore(s => s.login)
  const theme = useThemeStore(s => s.theme)
  const setTheme = useThemeStore(s => s.setTheme)

  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('tamal@bidfly.io')
  const [password, setPassword] = useState('••••••••••••')
  const [fullName, setFullName] = useState('Tamal Roy Chowdhury')
  const [companyName, setCompanyName] = useState('Commercial Bidding Enterprise')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      login(email, 'bid_manager', fullName)
      setIsLoading(false)
    }, 400)
  }

  const handleQuickDemoLogin = (role: 'admin' | 'bid_manager' | 'freelancer', name: string, mail: string) => {
    setIsLoading(true)
    setTimeout(() => {
      login(mail, role, name)
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Top Navbar */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BidFlyLogo size="lg" subtitle="Universal Tender Management & Datasheet Automation" />

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-xs"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>
            <Button size="sm" onClick={() => handleQuickDemoLogin('admin', 'Tamal Roy Chowdhury', 'tamal@bidfly.io')}>
              Launch Workspace <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col lg:flex-row items-center gap-12 justify-center">
        {/* Left: Branding & Pitch */}
        <div className="flex-1 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Universal Multi-Tenant & Multi-Entity Bidding Engine
          </div>

          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
            Automated Tender Management, BOQ Rate Analysis & Bid Intelligence.
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            A state-of-the-art commercial bidding platform built for engineering contractors, procurement corporations, suppliers, and freelance bidding agencies. Features live 15-column Excel datasheet automation, GeM synchronisation, QCBS evaluation, and offline local SQLite security.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60">
              <Building2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Multi-Company / Client Support</p>
                <p className="text-[11px] text-muted-foreground">Add custom client companies, divisions (AF, AEC, etc.) seamlessly.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60">
              <BarChart3 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">15-Column Excel Datasheet</p>
                <p className="text-[11px] text-muted-foreground">Interactive slicers, KPI sums, and color-coded countdown badges.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60">
              <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">QCBS Score Calculator</p>
                <p className="text-[11px] text-muted-foreground">70:30 automated technical and financial composite scoring.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60">
              <ShieldCheck className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Secure Local SQLite</p>
                <p className="text-[11px] text-muted-foreground">100% private offline database with zero cloud leak.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Authentication Card */}
        <div className="w-full lg:w-[420px] shrink-0">
          <Card className="border-2 shadow-xl bg-card">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Enterprise Sign In</CardTitle>
                <Badge variant="secondary" className="text-xs font-mono">v1.0.0</Badge>
              </div>
              <CardDescription>
                Sign in to access your tender pipeline & management sheets
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs value={activeAuthTab} onValueChange={v => setActiveAuthTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">New Account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 m-0">
                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    <div>
                      <Label className="text-xs font-medium">Work Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="pl-9 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Password</Label>
                        <span className="text-[11px] text-primary hover:underline cursor-pointer">Forgot?</span>
                      </div>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="pl-9 pr-9 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full font-bold mt-2" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 m-0">
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Full Name</Label>
                      <Input
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Tamal Roy Chowdhury"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Organization / Company Name</Label>
                      <Input
                        required
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. EPC Global / Bid Agency"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Work Email</Label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="text-xs"
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold mt-2" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account & Enter'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* 1-Click Quick Demo Switcher */}
              <div className="pt-3 border-t">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center mb-2.5">
                  1-Click Quick Sign In
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 flex flex-col items-start"
                    onClick={() => handleQuickDemoLogin('bid_manager', 'Tamal Roy Chowdhury', 'tamal@bidfly.io')}
                  >
                    <span className="font-bold text-[11px]">Tamal Roy Chowdhury</span>
                    <span className="text-[10px] text-muted-foreground">Enterprise Administrator</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 flex flex-col items-start"
                    onClick={() => handleQuickDemoLogin('freelancer', 'Freelance Agency Lead', 'agency@bidfly.io')}
                  >
                    <span className="font-bold text-[11px]">Freelance Agency</span>
                    <span className="text-[10px] text-muted-foreground">Multi-Client Workspace</span>
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="py-3 px-6 bg-muted/30 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AES-256 Encrypted
              </span>
              <span>Windows Desktop & Web Ready</span>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 BidFly Enterprise Platform • Developed by Tamal Roy Chowdhury. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-muted-foreground">Commercial Bid Management Suite</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
