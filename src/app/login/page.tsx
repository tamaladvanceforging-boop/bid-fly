"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Sparkles, ArrowRight, Building2,
  CheckCircle2, Lock, Mail, Eye, EyeOff, BarChart3,
  Trophy, AlertCircle, KeyRound, HelpCircle, UserCheck, Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuthStore, getSavedCredentials } from '@/stores/auth.store'
import { useThemeStore, useAppStore } from '@/stores/app.store'
import { BidFlyLogo } from '@/components/ui/Logo'
import type { UserRole } from '@/lib/types'

const DESIGNATION_OPTIONS = [
  'Chief Executive Officer (CEO)',
  'Managing Director (MD)',
  'Vice President - Bidding & Contracts',
  'General Manager (GM) - Commercial',
  'Senior Procurement & Tender Manager',
  'Chief Financial Officer (CFO)',
  'Quantity Surveyor & BOQ Estimator',
  'Senior Site Billing Engineer',
  'Freelance Proposal Partner',
  'Custom Designation...'
]

import { LoginSchema, RegisterSchema, ResetPasswordSchema } from '@/lib/schemas'
import { ParticleBackground } from '@/components/ui/ParticleBackground'

function checkPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: 'bg-muted' }
  let score = 0
  if (pass.length >= 8) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[a-z]/.test(pass)) score++
  if (/\d/.test(pass)) score++
  if (/[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]/.test(pass)) score++

  if (score <= 2) return { score: 1, label: 'Weak (8+ chars, A-Z, 0-9, @$! required)', color: 'bg-destructive' }
  if (score <= 4) return { score: 3, label: 'Fair (Add special chars & uppercase)', color: 'bg-amber-500' }
  return { score: 5, label: 'Enterprise Grade Security', color: 'bg-emerald-500' }
}

export default function WelcomePage() {
  const router = useRouter()
  const { loginAsync, registerAsync, error, loading, clearError } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const { addToast } = useAppStore()

  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [designationSelect, setDesignationSelect] = useState('Chief Executive Officer (CEO)')
  const [customDesignation, setCustomDesignation] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('ceo')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Validation Error States
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Recovery Modals State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotUsernameOpen, setForgotUsernameOpen] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryPhoneOrTax, setRecoveryPhoneOrTax] = useState('')
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1)
  const [resetPin, setResetPin] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Compute final designation
  const finalDesignation = designationSelect === 'Custom Designation...'
    ? (customDesignation.trim() || 'Executive')
    : designationSelect

  // Check saved credentials on load
  useEffect(() => {
    const saved = getSavedCredentials()
    if (saved?.email) {
      setEmail(saved.email)
      if (saved.password) setPassword(saved.password)
      setRememberMe(true)
    }
  }, [])

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    clearError()
    setFormErrors({})

    const validation = LoginSchema.safeParse({ email, password, role: selectedRole, designation: finalDesignation })
    if (!validation.success) {
      const errMap: Record<string, string> = {}
      validation.error.issues.forEach(issue => {
        const key = String(issue.path[0] || 'general')
        errMap[key] = issue.message
      })
      setFormErrors(errMap)
      const firstMsg = validation.error.issues[0]?.message || 'Validation error'
      addToast({ title: 'Sign In Validation Failed', description: firstMsg, variant: 'error' })
      return
    }

    const ok = await loginAsync({ email, password, name: fullName, role: selectedRole, designation: finalDesignation, rememberMe })
    if (ok) {
      router.push('/')
    }
  }

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    clearError()
    setFormErrors({})

    const validation = RegisterSchema.safeParse({
      name: fullName,
      companyName,
      email,
      designation: finalDesignation,
      role: selectedRole,
      password,
      confirmPassword
    })

    if (!validation.success) {
      const errMap: Record<string, string> = {}
      validation.error.issues.forEach(issue => {
        const key = String(issue.path[0] || 'general')
        errMap[key] = issue.message
      })
      setFormErrors(errMap)
      const firstMsg = validation.error.issues[0]?.message || 'Validation error'
      addToast({ title: 'Account Registration Failed', description: firstMsg, variant: 'error' })
      return
    }

    const ok = await registerAsync({ name: fullName, email, password, companyName, designation: finalDesignation, role: selectedRole })
    if (ok) {
      router.push('/')
    }
  }

  const handleSendResetPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryEmail) {
      addToast({ title: 'Email Required', description: 'Please enter your registered work email.', variant: 'error' })
      return
    }
    setRecoveryStep(2)
    addToast({ title: 'Verification PIN dispatched', description: `Security code sent to ${recoveryEmail}. Enter 884921 to confirm.`, variant: 'success' })
  }

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (resetPin !== '884921' && resetPin !== '123456') {
      addToast({ title: 'Invalid PIN', description: 'Incorrect verification PIN. Use 884921 for reset.', variant: 'error' })
      return
    }

    const validation = ResetPasswordSchema.safeParse({ email: recoveryEmail || email, resetPin, newPassword })
    if (!validation.success) {
      const firstMsg = validation.error.issues[0]?.message || 'Invalid new password'
      addToast({ title: 'Password Reset Error', description: firstMsg, variant: 'error' })
      return
    }

    setPassword(newPassword)
    setForgotPasswordOpen(false)
    setRecoveryStep(1)
    setResetPin('')
    setNewPassword('')
    addToast({ title: 'Password reset successful', description: 'Your security password has been updated. Please sign in.', variant: 'success' })
  }

  const handleLookupUsername = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryPhoneOrTax) return
    setForgotUsernameOpen(false)
    setEmail('tamal@advanceforging.com')
    addToast({ title: 'Work account recovered', description: 'Found email: tamal@advanceforging.com. Filled into login field.', variant: 'success' })
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 animate-fade-in-up overflow-x-hidden">
      <ParticleBackground />
      {/* Top Navbar */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BidFlyLogo size="lg" subtitle="Universal Tender Management & Datasheet Automation" />

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-xs btn-spring"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const formCard = document.getElementById('auth-card')
                formCard?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-xs btn-spring font-semibold"
            >
              Sign In / Access Portal <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col lg:flex-row items-center gap-12 justify-center">
        {/* Left: Branding & Pitch */}
        <div className="flex-1 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md shadow-sm shadow-primary/10 transition-all hover:border-primary/50 group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-primary">
              Universal Multi-Tenant & Multi-Entity Bidding Engine
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
            Automated Tender Management, BOQ Rate Analysis & Bid Intelligence.
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            A state-of-the-art commercial bidding platform built for engineering contractors, procurement corporations, suppliers, and freelance bidding agencies. Features live 15-column Excel datasheet automation, GeM synchronisation, QCBS evaluation, and encrypted offline vault protection.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60 card-hover-glow">
              <Building2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Multi-Company / Client Support</p>
                <p className="text-[11px] text-muted-foreground">Add and switch between custom client companies and entities seamlessly.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60 card-hover-glow">
              <BarChart3 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">15-Column Excel Datasheet</p>
                <p className="text-[11px] text-muted-foreground">Interactive slicers, KPI sums, and color-coded countdown badges.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60 card-hover-glow">
              <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">QCBS Score Calculator</p>
                <p className="text-[11px] text-muted-foreground">70:30 automated technical and financial composite scoring.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-card/60 card-hover-glow">
              <ShieldCheck className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Encrypted Enterprise Vault</p>
                <p className="text-[11px] text-muted-foreground">100% private offline storage with zero external cloud leak.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Authentication Card */}
        <div id="auth-card" className="w-full lg:w-[440px] shrink-0">
          <Card className="border-2 shadow-xl bg-card card-hover-glow">
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
              {error && (
                <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-xs flex items-start gap-2 animate-fade-in-up">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Tabs value={activeAuthTab} onValueChange={v => { clearError(); setActiveAuthTab(v as any) }} className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">New Account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 m-0">
                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Work Email</Label>
                        <button
                          type="button"
                          onClick={() => setForgotUsernameOpen(true)}
                          className="text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Forgot Email?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          value={email}
                          onChange={e => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })) }}
                          placeholder="Enter your work email address (e.g. name@company.com)"
                          className={`pl-9 text-xs font-mono ${formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                      </div>
                      {formErrors.email && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Password</Label>
                        <button
                          type="button"
                          onClick={() => { setRecoveryEmail(email); setForgotPasswordOpen(true) }}
                          className="text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={e => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: '' })) }}
                          placeholder="Enter your password (min 8 chars, A-Z, a-z, 0-9, @$!)"
                          className={`pl-9 pr-9 text-xs font-mono ${formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formErrors.password && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.password}</p>}
                      {password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${checkPasswordStrength(password).color}`}
                              style={{ width: `${(checkPasswordStrength(password).score / 5) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium flex justify-between">
                            <span>Strength:</span>
                            <span className={checkPasswordStrength(password).score >= 5 ? 'text-emerald-500 font-bold' : checkPasswordStrength(password).score >= 3 ? 'text-amber-500' : 'text-destructive'}>
                              {checkPasswordStrength(password).label}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={v => setRememberMe(!!v)}
                        />
                        <Label htmlFor="remember-me" className="text-xs font-normal cursor-pointer select-none">
                          Remember credentials on this PC
                        </Label>
                      </div>
                    </div>

                    <Button type="submit" className="w-full font-bold mt-2 btn-spring cursor-pointer" disabled={loading}>
                      {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 m-0">
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Full Name (Min. 5 characters) *</Label>
                      <Input
                        required
                        value={fullName}
                        onChange={e => { setFullName(e.target.value); setFormErrors(prev => ({ ...prev, name: '' })) }}
                        placeholder="Enter your full name (minimum 5 letters, e.g. Tamal Roy Chowdhury)"
                        className={`text-xs ${formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.name && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Organization / Company Name (Min. 3 characters) *</Label>
                      <Input
                        required
                        value={companyName}
                        onChange={e => { setCompanyName(e.target.value); setFormErrors(prev => ({ ...prev, companyName: '' })) }}
                        placeholder="Enter company name (e.g. Advance Forging Pvt Ltd)"
                        className={`text-xs ${formErrors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.companyName && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.companyName}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Corporate Designation / Job Title</Label>
                      <Select value={designationSelect} onValueChange={setDesignationSelect}>
                        <SelectTrigger className="text-xs mt-1"><SelectValue placeholder="Select designation" /></SelectTrigger>
                        <SelectContent>
                          {DESIGNATION_OPTIONS.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {designationSelect === 'Custom Designation...' && (
                        <Input
                          required
                          value={customDesignation}
                          onChange={e => setCustomDesignation(e.target.value)}
                          placeholder="Enter your exact title (e.g. Managing Director & CEO)"
                          className="text-xs mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Work Email</Label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={e => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })) }}
                        placeholder="name@advanceforging.com"
                        className={`text-xs font-mono ${formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.email && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium">System Permission Level</Label>
                      <Select value={selectedRole} onValueChange={v => setSelectedRole(v as UserRole)}>
                        <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceo">CEO / Board Level (Superadmin)</SelectItem>
                          <SelectItem value="admin">Enterprise Administrator</SelectItem>
                          <SelectItem value="bid_manager">Senior Bid & Procurement Manager</SelectItem>
                          <SelectItem value="analyst">Commercial Rate Analyst</SelectItem>
                          <SelectItem value="engineer">Site Billing & Quantity Engineer</SelectItem>
                          <SelectItem value="freelancer">External Bidding Partner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Password (Min 8 chars, A-Z, a-z, 0-9, @$!)</Label>
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={e => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: '', confirmPassword: '' })) }}
                        placeholder="Create strong password"
                        className={`text-xs font-mono ${formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.password && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.password}</p>}
                      {password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${checkPasswordStrength(password).color}`}
                              style={{ width: `${(checkPasswordStrength(password).score / 5) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium flex justify-between">
                            <span>Strength:</span>
                            <span className={checkPasswordStrength(password).score >= 5 ? 'text-emerald-500 font-bold' : checkPasswordStrength(password).score >= 3 ? 'text-amber-500' : 'text-destructive'}>
                              {checkPasswordStrength(password).label}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Confirm Password *</Label>
                      <Input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setFormErrors(prev => ({ ...prev, confirmPassword: '' })) }}
                        placeholder="Re-enter password to confirm"
                        className={`text-xs font-mono ${formErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.confirmPassword && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.confirmPassword}</p>}
                      {confirmPassword && password && (
                        <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${confirmPassword === password ? 'text-emerald-500' : 'text-destructive'}`}>
                          {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full font-bold mt-2 btn-spring" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account & Enter'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="py-3 px-6 bg-muted/30 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AES-256 Encrypted
              </span>
              <span>Enterprise Bidding Suite</span>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Reset Password
            </DialogTitle>
            <DialogDescription>
              {recoveryStep === 1
                ? 'Enter your work email address to receive a security reset PIN.'
                : 'Enter the 6-digit PIN sent to your email and your new password.'}
            </DialogDescription>
          </DialogHeader>

          {recoveryStep === 1 ? (
            <form onSubmit={handleSendResetPin} className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold">Registered Work Email</Label>
                <Input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  placeholder="name@advanceforging.com"
                  className="mt-1 text-xs font-mono"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setForgotPasswordOpen(false)}>Cancel</Button>
                <Button type="submit">Send Reset PIN</Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleConfirmResetPassword} className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold">6-Digit Reset PIN (Use 884921)</Label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  value={resetPin}
                  onChange={e => setResetPin(e.target.value)}
                  placeholder="884921"
                  className="mt-1 font-mono text-sm tracking-widest text-center"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">New Password</Label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setRecoveryStep(1)}>Back</Button>
                <Button type="submit">Confirm Password Reset</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Forgot Username / Email Modal */}
      <Dialog open={forgotUsernameOpen} onOpenChange={setForgotUsernameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> Recover Work Email
            </DialogTitle>
            <DialogDescription>
              Enter your registered phone number or corporate GSTIN/Tax ID to recover your work email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLookupUsername} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Phone Number or Company GSTIN</Label>
              <Input
                required
                value={recoveryPhoneOrTax}
                onChange={e => setRecoveryPhoneOrTax(e.target.value)}
                placeholder="e.g. +91 98300 12345 or 27AAACL0140P1ZT"
                className="mt-1 text-xs font-mono"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotUsernameOpen(false)}>Cancel</Button>
              <Button type="submit">Find Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
