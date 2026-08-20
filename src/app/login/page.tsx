"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Sparkles, ArrowRight, Building2,
  CheckCircle2, Lock, Mail, Eye, EyeOff, BarChart3,
  Trophy, AlertCircle, KeyRound, HelpCircle, Briefcase,
  Zap, Database, Landmark, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore, getSavedCredentials } from '@/stores/auth.store';
import { useThemeStore, useAppStore } from '@/stores/app.store';
import { BidFlyLogo } from '@/components/ui/Logo';
import type { UserRole } from '@/lib/types';
import { LoginSchema, RegisterSchema, ResetPasswordSchema } from '@/lib/schemas';
import { ThreeCanvasBackground } from '@/components/ui/ThreeCanvasBackground';
import { Spotlight } from '@/components/ui/AceternitySpotlight';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';

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
];

function checkPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: 'bg-muted' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[a-z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]/.test(pass)) score++;

  if (score <= 2) return { score: 1, label: 'Weak (8+ chars, A-Z, 0-9, @$! required)', color: 'bg-destructive' };
  if (score <= 4) return { score: 3, label: 'Fair (Add special chars & uppercase)', color: 'bg-amber-500' };
  return { score: 5, label: 'Enterprise Grade Security', color: 'bg-emerald-500' };
}

export default function WelcomePage() {
  const router = useRouter();
  const { loginAsync, registerAsync, error, loading, clearError, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { addToast } = useAppStore();

  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designationSelect, setDesignationSelect] = useState('Chief Executive Officer (CEO)');
  const [customDesignation, setCustomDesignation] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ceo');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation Error States
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Recovery Modals State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotUsernameOpen, setForgotUsernameOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhoneOrTax, setRecoveryPhoneOrTax] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Compute final designation
  const finalDesignation = designationSelect === 'Custom Designation...'
    ? (customDesignation.trim() || 'Executive')
    : designationSelect;

  // Check saved credentials on load
  useEffect(() => {
    const saved = getSavedCredentials();
    if (saved?.email) {
      setEmail(saved.email);
      if (saved.password) setPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearError();
    setFormErrors({});

    const validation = LoginSchema.safeParse({ email, password, role: selectedRole, designation: finalDesignation });
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const key = String(issue.path[0] || 'general');
        errMap[key] = issue.message;
      });
      setFormErrors(errMap);
      const firstMsg = validation.error.issues[0]?.message || 'Validation error';
      addToast({ title: 'Sign In Validation Failed', description: firstMsg, variant: 'error' });
      return;
    }

    const ok = await loginAsync({ email, password, name: fullName, role: selectedRole, designation: finalDesignation, rememberMe });
    if (ok) {
      router.push('/');
    }
  };

  const handleQuickDemoAccess = async () => {
    clearError();
    const demoEmail = 'admin@bidfly.io';
    const demoPassword = 'Password@123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    const ok = await loginAsync({
      email: demoEmail,
      password: demoPassword,
      name: 'Tamal Roy Chowdhury',
      role: 'ceo',
      designation: 'Managing Director & CEO',
      rememberMe: true
    });
    if (ok) {
      addToast({ title: 'Welcome to BidFly Pro', description: 'Logged in with Enterprise CEO profile', variant: 'success' });
      router.push('/');
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearError();
    setFormErrors({});

    const validation = RegisterSchema.safeParse({
      name: fullName,
      companyName,
      email,
      designation: finalDesignation,
      role: selectedRole,
      password,
      confirmPassword
    });

    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const key = String(issue.path[0] || 'general');
        errMap[key] = issue.message;
      });
      setFormErrors(errMap);
      const firstMsg = validation.error.issues[0]?.message || 'Validation error';
      addToast({ title: 'Account Registration Failed', description: firstMsg, variant: 'error' });
      return;
    }

    const ok = await registerAsync({ name: fullName, email, password, companyName, designation: finalDesignation, role: selectedRole });
    if (ok) {
      router.push('/');
    }
  };

  const handleSendResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      addToast({ title: 'Email Required', description: 'Please enter your registered work email.', variant: 'error' });
      return;
    }
    setRecoveryStep(2);
    addToast({ title: 'Verification PIN dispatched', description: `Security code sent to ${recoveryEmail}. Enter 884921 to confirm.`, variant: 'success' });
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPin !== '884921' && resetPin !== '123456') {
      addToast({ title: 'Invalid PIN', description: 'Incorrect verification PIN. Use 884921 for reset.', variant: 'error' });
      return;
    }

    const validation = ResetPasswordSchema.safeParse({ email: recoveryEmail || email, resetPin, newPassword });
    if (!validation.success) {
      const firstMsg = validation.error.issues[0]?.message || 'Invalid new password';
      addToast({ title: 'Password Reset Error', description: firstMsg, variant: 'error' });
      return;
    }

    setPassword(newPassword);
    setForgotPasswordOpen(false);
    setRecoveryStep(1);
    setResetPin('');
    setNewPassword('');
    addToast({ title: 'Password reset successful', description: 'Your security password has been updated. Please sign in.', variant: 'success' });
  };

  const handleLookupUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPhoneOrTax) return;
    setForgotUsernameOpen(false);
    setEmail('tamal@advanceforging.com');
    addToast({ title: 'Work account recovered', description: 'Found email: tamal@advanceforging.com. Filled into login field.', variant: 'success' });
  };

  return (
    <div className="relative min-h-screen bg-[#090d16] text-foreground flex flex-col justify-between selection:bg-primary/30 overflow-x-hidden">
      {/* 3D Three.js Interactive WebGL Background */}
      <ThreeCanvasBackground />

      {/* Aceternity Spotlight Glowing Lamp */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#3b82f6" />
      <Spotlight className="top-1/3 -right-20 md:right-10" fill="#8b5cf6" />

      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-[#090d16]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BidFlyLogo size="lg" subtitle="Universal Tender Management & Datasheet Automation" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline Core: v2.0 Ready</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const formCard = document.getElementById('auth-card');
                formCard?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs bg-white/5 border-white/10 hover:bg-white/10 text-white font-semibold backdrop-blur-md shadow-lg shadow-primary/10"
            >
              Sign In / Access Portal <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16 flex-1 flex flex-col lg:flex-row items-center gap-12 justify-center relative z-10">
        {/* Left: Futuristic Hero Branding */}
        <div className="flex-1 space-y-7 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl shadow-lg shadow-blue-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-cyan-300">
              Next-Gen Enterprise Tender Intelligence & Multi-Entity Suite
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Automate Bids, <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Excel Datasheets & QCBS
            </span> <br />
            With Enterprise Safety.
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl font-normal">
            The mission-critical commercial bidding platform built for engineering contractors, procurement executives, and tender bidding directors. Replaces tedious manual Excel sheets with 15-column live calculation matrices, GeM/CPPP tracking, and offline vault encryption.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0f172a]/60 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Explore Instant Demo Workspace</p>
                <p className="text-[11px] text-slate-400">Pre-configured with CEO permissions & full suite access</p>
              </div>
            </div>
            <Button
              onClick={handleQuickDemoAccess}
              size="sm"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 gap-1.5"
            >
              <Terminal className="h-3.5 w-3.5" /> 1-Click Demo Login
            </Button>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% Private Offline
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Zero cloud dependency; all data stays on local PC.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-400" /> Multi-Company Ready
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Manage multiple client entities & companies on the fly.</p>
            </div>
          </div>
        </div>

        {/* Right: Aceternity BackgroundGradient Auth Portal */}
        <div id="auth-card" className="w-full lg:w-[460px] shrink-0">
          <BackgroundGradient className="rounded-3xl p-6 sm:p-7 bg-[#0b1120]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-400" /> Enterprise Portal
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Secure authentication for commercial bidding teams</p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] text-blue-400 border-blue-500/30 bg-blue-500/10">
                  v2.0 Pro
                </Badge>
              </div>

              {error && (
                <div className="p-3 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Tabs value={activeAuthTab} onValueChange={v => { clearError(); setActiveAuthTab(v as any); }} className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4 bg-slate-900/80 p-1 border border-white/[0.06]">
                  <TabsTrigger value="signin" className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                    New Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 m-0">
                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-300">Work Email</Label>
                        <button
                          type="button"
                          onClick={() => setForgotUsernameOpen(true)}
                          className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot Email?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          required
                          value={email}
                          onChange={e => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })); }}
                          placeholder="name@company.com"
                          className={`pl-9 text-xs font-mono bg-slate-900/60 border-white/10 text-white ${formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                      </div>
                      {formErrors.email && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-300">Password</Label>
                        <button
                          type="button"
                          onClick={() => { setRecoveryEmail(email); setForgotPasswordOpen(true); }}
                          className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={e => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: '' })); }}
                          placeholder="Enter your security password"
                          className={`pl-9 pr-9 text-xs font-mono bg-slate-900/60 border-white/10 text-white ${formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formErrors.password && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.password}</p>}
                      {password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${checkPasswordStrength(password).color}`}
                              style={{ width: `${(checkPasswordStrength(password).score / 5) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium flex justify-between">
                            <span>Strength:</span>
                            <span className={checkPasswordStrength(password).score >= 5 ? 'text-emerald-400 font-bold' : checkPasswordStrength(password).score >= 3 ? 'text-amber-400' : 'text-destructive'}>
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
                        <Label htmlFor="remember-me" className="text-xs font-normal text-slate-300 cursor-pointer select-none">
                          Remember credentials on this PC
                        </Label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full font-bold mt-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/25 h-10 cursor-pointer text-xs"
                      disabled={loading}
                    >
                      {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-3.5 m-0">
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-300">Full Legal Name *</Label>
                      <Input
                        required
                        value={fullName}
                        onChange={e => { setFullName(e.target.value); setFormErrors(prev => ({ ...prev, name: '' })); }}
                        placeholder="e.g. Tamal Roy Chowdhury"
                        className={`text-xs bg-slate-900/60 border-white/10 text-white ${formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.name && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate-300">Primary Company / Entity Name *</Label>
                      <Input
                        required
                        value={companyName}
                        onChange={e => { setCompanyName(e.target.value); setFormErrors(prev => ({ ...prev, companyName: '' })); }}
                        placeholder="e.g. Advance Forging Pvt Ltd"
                        className={`text-xs bg-slate-900/60 border-white/10 text-white ${formErrors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.companyName && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.companyName}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate-300">Corporate Designation</Label>
                      <Select value={designationSelect} onValueChange={setDesignationSelect}>
                        <SelectTrigger className="text-xs mt-1 bg-slate-900/60 border-white/10 text-white">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
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
                          placeholder="Enter your exact title"
                          className="text-xs mt-2 bg-slate-900/60 border-white/10 text-white"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate-300">Work Email *</Label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={e => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })); }}
                        placeholder="name@company.com"
                        className={`text-xs font-mono bg-slate-900/60 border-white/10 text-white ${formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.email && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate-300">Password (Min 8 chars)</Label>
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={e => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: '', confirmPassword: '' })); }}
                        placeholder="Create strong password"
                        className={`text-xs font-mono bg-slate-900/60 border-white/10 text-white ${formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.password && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.password}</p>}
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate-300">Confirm Password *</Label>
                      <Input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setFormErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                        placeholder="Re-enter password to confirm"
                        className={`text-xs font-mono bg-slate-900/60 border-white/10 text-white ${formErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {formErrors.confirmPassword && <p className="text-[11px] text-destructive font-medium mt-1">{formErrors.confirmPassword}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full font-bold mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/25 h-10 text-xs"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account & Enter'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> AES-256 Vault
                </span>
                <span>Encrypted Offline Engine</span>
              </div>
            </div>
          </BackgroundGradient>
        </div>
      </main>

      {/* Feature Bento Grid (Aceternity UI) */}
      <section className="max-w-7xl mx-auto px-6 py-12 relative z-10 w-full">
        <div className="text-center space-y-2 mb-8">
          <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 bg-blue-500/10">
            Enterprise Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Built Specifically For Heavy Commercial Bidding
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Everything your tender department requires in one high-performance desktop cockpit.
          </p>
        </div>

        <BentoGrid className="max-w-7xl mx-auto">
          <BentoGridItem
            title="15-Column Live Multi-Entity Datasheet"
            description="Excel-grade calculation matrix with real-time countdown badges, multi-company slicers, and instant CSV/PDF export."
            icon={<BarChart3 className="h-5 w-5" />}
            badge="Excel Grid"
            className="md:col-span-2"
          />
          <BentoGridItem
            title="QCBS 70:30 Scoring Engine"
            description="Automated composite technical (70%) and financial (30%) weighting engine with instant normalized quote rankings."
            icon={<Trophy className="h-5 w-5" />}
            badge="QCBS Engine"
          />
          <BentoGridItem
            title="Bank Guarantee & EMD Vault"
            description="Track locked capital across SBI, PNB, and HDFC with automated 15-day expiry notices and release logging."
            icon={<Landmark className="h-5 w-5" />}
            badge="Vault Alert"
          />
          <BentoGridItem
            title="Competitor Market Intelligence"
            description="Deep pricing variance analytics, competitor win rates, historical discount margins, and tender rate databases."
            icon={<Activity className="h-5 w-5" />}
            badge="Rate Analytics"
            className="md:col-span-2"
          />
        </BentoGrid>
      </section>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <KeyRound className="h-5 w-5 text-blue-400" /> Reset Security Password
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              {recoveryStep === 1
                ? 'Enter your registered work email address to receive a security reset PIN.'
                : 'Enter the 6-digit PIN sent to your email and your new password.'}
            </DialogDescription>
          </DialogHeader>

          {recoveryStep === 1 ? (
            <form onSubmit={handleSendResetPin} className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold text-slate-300">Registered Work Email</Label>
                <Input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  placeholder="name@advanceforging.com"
                  className="mt-1 text-xs font-mono bg-slate-800 border-white/10 text-white"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setForgotPasswordOpen(false)} className="text-slate-400">Cancel</Button>
                <Button type="submit" className="bg-primary text-white font-bold text-xs">Send Reset PIN</Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleConfirmResetPassword} className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold text-slate-300">6-Digit Reset PIN (Use 884921)</Label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  value={resetPin}
                  onChange={e => setResetPin(e.target.value)}
                  placeholder="884921"
                  className="mt-1 font-mono text-sm tracking-widest text-center bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-300">New Password</Label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 font-mono text-xs bg-slate-800 border-white/10 text-white"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setRecoveryStep(1)} className="text-slate-400">Back</Button>
                <Button type="submit" className="bg-primary text-white font-bold text-xs">Confirm Password Reset</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Forgot Username / Email Modal */}
      <Dialog open={forgotUsernameOpen} onOpenChange={setForgotUsernameOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <HelpCircle className="h-5 w-5 text-blue-400" /> Recover Work Account
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Enter your registered phone number or corporate GSTIN/Tax ID to recover your work email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLookupUsername} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-300">Phone Number or Company GSTIN</Label>
              <Input
                required
                value={recoveryPhoneOrTax}
                onChange={e => setRecoveryPhoneOrTax(e.target.value)}
                placeholder="e.g. +91 98300 12345 or 27AAACL0140P1ZT"
                className="mt-1 text-xs font-mono bg-slate-800 border-white/10 text-white"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotUsernameOpen(false)} className="text-slate-400">Cancel</Button>
              <Button type="submit" className="bg-primary text-white font-bold text-xs">Find Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom Footer */}
      <footer className="border-t border-white/[0.08] py-4 text-center text-xs text-slate-500 bg-[#070b12] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 BidFly Enterprise Platform • Developed by Tamal Roy Chowdhury. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-slate-400">Commercial Tender & Datasheet Suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
