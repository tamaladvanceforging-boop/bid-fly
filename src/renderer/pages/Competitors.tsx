import { useState, useMemo, useEffect } from 'react'
import {
  Users, Trophy, TrendingDown, DollarSign, Plus, Search, Filter,
  Building2, Award, ArrowUpRight, ArrowDownRight, Target, Shield, Check,
  BarChart3, Sparkles, AlertCircle, Edit, Trash2, ExternalLink, Table2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@renderer/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { ExportMenu } from '@renderer/components/ui/export-menu'
import { useAppStore } from '@renderer/stores/app.store'
import { Competitor, CompetitorBid, CompetitorStrength, CompetitorRank, BOQItem, CompetitorItemRate, Tender } from '@shared/types'

function formatCurrency(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

const INITIAL_COMPETITORS: Competitor[] = [
  {
    id: 'comp-1',
    name: 'Larsen & Toubro Infrastructure',
    gstin: '27AAACL1234F1Z5',
    contactPerson: 'Rajesh Sharma (VP Sales)',
    email: 'bidding@lntecc.com',
    phone: '+91 22 6752 5656',
    marketStrength: 'dominant',
    typicalDiscountRate: 12.5,
    historicalWinRate: 68,
    bidsSubmittedCount: 42,
    bidsWonCount: 28,
    notes: 'Very aggressive on NHAI & CPWD mega infrastructure projects.',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z'
  },
  {
    id: 'comp-2',
    name: 'KPT Heavy Forgings Ltd',
    gstin: '07AAACK9876E1Z2',
    contactPerson: 'Amitabh Verma',
    email: 'tenders@kptforgings.in',
    phone: '+91 11 4150 9900',
    marketStrength: 'high',
    typicalDiscountRate: 8.4,
    historicalWinRate: 52,
    bidsSubmittedCount: 25,
    bidsWonCount: 13,
    notes: 'Primary competitor in GeM valve & forging supply categories.',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-02-05T14:00:00Z'
  },
  {
    id: 'comp-3',
    name: 'Simplex Infrastructures Ltd',
    gstin: '19AAACS4321D1Z9',
    contactPerson: 'Siddharth Basu',
    email: 'commercial@simplexinfra.com',
    phone: '+91 33 2301 1000',
    marketStrength: 'medium',
    typicalDiscountRate: 15.2,
    historicalWinRate: 41,
    bidsSubmittedCount: 19,
    bidsWonCount: 8,
    notes: 'Quotes low prices but often disqualified on technical QCBS scores.',
    createdAt: '2026-01-20T09:30:00Z',
    updatedAt: '2026-02-10T16:00:00Z'
  }
]

const INITIAL_COMPETITOR_BIDS: CompetitorBid[] = [
  {
    id: 'cb-1',
    tenderId: 't-101',
    tenderNumber: 'GEM/2026/B/892014',
    tenderTitle: 'Supply of High-Pressure Alloy Steel Valve Forgings',
    competitorId: 'comp-1',
    competitorName: 'Larsen & Toubro Infrastructure',
    quotedPrice: 48500000,
    ourPrice: 47200000,
    technicalScore: 94.5,
    rank: 'L2',
    isWinner: false,
    priceVariancePercent: 2.75,
    marginSpread: 1300000,
    notes: 'L&T quoted ₹4.85 Cr vs Our winning quote ₹4.72 Cr.',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'cb-2',
    tenderId: 't-101',
    tenderNumber: 'GEM/2026/B/892014',
    tenderTitle: 'Supply of High-Pressure Alloy Steel Valve Forgings',
    competitorId: 'comp-2',
    competitorName: 'KPT Heavy Forgings Ltd',
    quotedPrice: 51200000,
    ourPrice: 47200000,
    technicalScore: 88.0,
    rank: 'L3',
    isWinner: false,
    priceVariancePercent: 8.47,
    marginSpread: 4000000,
    notes: 'KPT quoted ₹5.12 Cr (+8.47% higher than our bid).',
    createdAt: '2026-02-01T10:30:00Z',
    updatedAt: '2026-02-01T10:30:00Z'
  }
]

const INITIAL_BOQ_ITEMS: BOQItem[] = [
  {
    id: 'boq-1',
    tenderId: 't-101',
    groupName: 'Schedule A - High Pressure Valves',
    itemCode: 'ITEM-1.01',
    description: '500mm Forged Steel Gate Valve (Class 1500, High Temp)',
    quantity: 25,
    uom: 'Nos',
    estimatedRate: 950000,
    ourQuotedRate: 880000
  },
  {
    id: 'boq-2',
    tenderId: 't-101',
    groupName: 'Schedule A - High Pressure Valves',
    itemCode: 'ITEM-1.02',
    description: '300mm Stainless Steel Check Valve (PN40 Flanged)',
    quantity: 40,
    uom: 'Nos',
    estimatedRate: 420000,
    ourQuotedRate: 395000
  },
  {
    id: 'boq-3',
    tenderId: 't-101',
    groupName: 'Group B - Heavy Structural Forgings',
    itemCode: 'BOQ-B01',
    description: 'ASTM A350 LF2 Forged Carbon Steel Flanges (Heavy Duty)',
    quantity: 120,
    uom: 'MT',
    estimatedRate: 185000,
    ourQuotedRate: 172000
  }
]

const INITIAL_ITEM_RATES: CompetitorItemRate[] = [
  {
    id: 'cir-1',
    boqItemId: 'boq-1',
    tenderId: 't-101',
    competitorId: 'comp-1',
    competitorName: 'Larsen & Toubro Infrastructure',
    quotedUnitRate: 910000,
    totalItemAmount: 22750000,
    rateVariancePercent: 3.41,
    isItemL1: false,
    notes: 'L&T rate ₹9.10L vs Our rate ₹8.80L'
  },
  {
    id: 'cir-2',
    boqItemId: 'boq-1',
    tenderId: 't-101',
    competitorId: 'comp-2',
    competitorName: 'KPT Heavy Forgings Ltd',
    quotedUnitRate: 865000,
    totalItemAmount: 21625000,
    rateVariancePercent: -1.70,
    isItemL1: true,
    notes: 'KPT is Line Item L1 on 500mm Gate Valve'
  }
]

export default function CompetitorsPage() {
  const { addToast } = useAppStore()
  const [tenders, setTenders] = useState<Tender[]>([])

  useEffect(() => {
    async function loadTenders() {
      try {
        if ((window as any).api?.tenders?.list) {
          const res = await (window as any).api.tenders.list({ limit: 100 })
          if (res.success && res.data) setTenders(res.data)
        }
      } catch (err) {
        console.error('Failed to load tenders:', err)
      }
    }
    loadTenders()
  }, [])

  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS)
  const [competitorBids, setCompetitorBids] = useState<CompetitorBid[]>(INITIAL_COMPETITOR_BIDS)
  const [boqItems, setBoqItems] = useState<BOQItem[]>(INITIAL_BOQ_ITEMS)
  const [itemRates, setItemRates] = useState<CompetitorItemRate[]>(INITIAL_ITEM_RATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [strengthFilter, setStrengthFilter] = useState<string>('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  // Modals
  const [addCompetitorOpen, setAddCompetitorOpen] = useState(false)
  const [addBidOpen, setAddBidOpen] = useState(false)
  const [addBoqOpen, setAddBoqOpen] = useState(false)

  // BOQ Form State
  const [boqGroup, setBoqGroup] = useState('Schedule A - High Pressure Valves')
  const [boqCode, setBoqCode] = useState('')
  const [boqDesc, setBoqDesc] = useState('')
  const [boqQty, setBoqQty] = useState('1')
  const [boqUom, setBoqUom] = useState('Nos')
  const [boqEstRate, setBoqEstRate] = useState('')
  const [boqOurRate, setBoqOurRate] = useState('')

  // KPI Computations
  const totalCompetitors = competitors.length
  const dominantCompetitor = competitors.find(c => c.marketStrength === 'dominant')?.name || competitors[0]?.name || 'N/A'
  const avgDiscount = competitors.length
    ? (competitors.reduce((sum, c) => sum + (c.typicalDiscountRate || 0), 0) / competitors.length).toFixed(1)
    : '0'

  const filteredCompetitors = useMemo(() => {
    return competitors.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchStrength = strengthFilter === 'all' || c.marketStrength === strengthFilter
      return matchSearch && matchStrength
    })
  }, [competitors, searchQuery, strengthFilter])

  const boqGroups = useMemo(() => {
    const setGroup = new Set(boqItems.map(i => i.groupName))
    return Array.from(setGroup)
  }, [boqItems])

  const filteredBoqItems = useMemo(() => {
    if (selectedGroup === 'all') return boqItems
    return boqItems.filter(i => i.groupName === selectedGroup)
  }, [boqItems, selectedGroup])

  const handleSaveBoqItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!boqCode.trim() || !boqDesc.trim()) {
      addToast({ title: 'Fields Required', description: 'Enter item code and description.', variant: 'error' })
      return
    }

    const newBoq: BOQItem = {
      id: `boq-${Date.now()}`,
      tenderId: tenders[0]?.id || 't-101',
      groupName: boqGroup.trim(),
      itemCode: boqCode.trim(),
      description: boqDesc.trim(),
      quantity: parseFloat(boqQty) || 1,
      uom: boqUom.trim(),
      estimatedRate: parseFloat(boqEstRate) || 0,
      ourQuotedRate: parseFloat(boqOurRate) || 0
    }

    setBoqItems(prev => [newBoq, ...prev])
    setAddBoqOpen(false)
    addToast({ title: 'BOQ Line Item Added', description: `${newBoq.itemCode} created under ${newBoq.groupName}.`, variant: 'success' })
  }

  // Competitor Form State
  const [compName, setCompName] = useState('')
  const [compGstin, setCompGstin] = useState('')
  const [compContact, setCompContact] = useState('')
  const [compEmail, setCompEmail] = useState('')
  const [compPhone, setCompPhone] = useState('')
  const [compStrength, setCompStrength] = useState<CompetitorStrength>('medium')
  const [compDiscount, setCompDiscount] = useState('10')
  const [compWinRate, setCompWinRate] = useState('50')
  const [compNotes, setCompNotes] = useState('')

  // Competitor Bid Form State
  const [bidTenderId, setBidTenderId] = useState(tenders[0]?.id || '')
  const [bidCompetitorId, setBidCompetitorId] = useState(INITIAL_COMPETITORS[0]?.id || '')
  const [bidQuotedPrice, setBidQuotedPrice] = useState('')
  const [bidOurPrice, setBidOurPrice] = useState('')
  const [bidTechScore, setBidTechScore] = useState('90')
  const [bidRank, setBidRank] = useState<CompetitorRank>('L2')
  const [bidNotes, setBidNotes] = useState('')

  // Form Submit: Add Competitor
  const handleSaveCompetitor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!compName.trim()) {
      addToast({ title: 'Name Required', description: 'Enter competitor company name.', variant: 'error' })
      return
    }

    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: compName.trim(),
      gstin: compGstin.trim(),
      contactPerson: compContact.trim(),
      email: compEmail.trim(),
      phone: compPhone.trim(),
      marketStrength: compStrength,
      typicalDiscountRate: parseFloat(compDiscount) || 0,
      historicalWinRate: parseFloat(compWinRate) || 0,
      bidsSubmittedCount: 0,
      bidsWonCount: 0,
      notes: compNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setCompetitors(prev => [newComp, ...prev])
    setAddCompetitorOpen(false)
    resetCompForm()
    addToast({ title: 'Competitor Registered', description: `${newComp.name} added to intelligence database.`, variant: 'success' })
  }

  const resetCompForm = () => {
    setCompName('')
    setCompGstin('')
    setCompContact('')
    setCompEmail('')
    setCompPhone('')
    setCompStrength('medium')
    setCompDiscount('10')
    setCompWinRate('50')
    setCompNotes('')
  }

  // Form Submit: Add Competitor Bid Entry
  const handleSaveBidEntry = (e: React.FormEvent) => {
    e.preventDefault()
    const compObj = competitors.find(c => c.id === bidCompetitorId)
    const tenderObj = tenders.find(t => t.id === bidTenderId)
    const qPrice = parseFloat(bidQuotedPrice) || 0
    const oPrice = parseFloat(bidOurPrice) || (tenderObj?.value || 0)

    if (!compObj || qPrice <= 0) {
      addToast({ title: 'Price Required', description: 'Enter a valid competitor quoted price.', variant: 'error' })
      return
    }

    const variance = oPrice > 0 ? (((qPrice - oPrice) / oPrice) * 100) : 0
    const spread = Math.abs(qPrice - oPrice)

    const newBidEntry: CompetitorBid = {
      id: `cb-${Date.now()}`,
      tenderId: tenderObj?.id || 't-gen',
      tenderNumber: tenderObj?.tenderNumber || 'GEM/2026/CUSTOM',
      tenderTitle: tenderObj?.title || 'Tender Commercial Quote',
      competitorId: compObj.id,
      competitorName: compObj.name,
      quotedPrice: qPrice,
      ourPrice: oPrice,
      technicalScore: parseFloat(bidTechScore) || 90,
      rank: bidRank,
      isWinner: bidRank === 'L1',
      priceVariancePercent: parseFloat(variance.toFixed(2)),
      marginSpread: spread,
      notes: bidNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setCompetitorBids(prev => [newBidEntry, ...prev])
    setAddBidOpen(false)
    addToast({ title: 'Rate Analysis Recorded', description: `Added price quote for ${compObj.name}.`, variant: 'success' })
  }

  // Export Columns
  const competitorExportColumns = [
    { header: 'Competitor Name', key: 'name' },
    { header: 'GSTIN / Reg No', key: 'gstin' },
    { header: 'Market Strength', key: 'marketStrength', formatter: (val: string) => val.toUpperCase() },
    { header: 'Avg Discount %', key: 'typicalDiscountRate', formatter: (val: number) => `${val || 0}%` },
    { header: 'Historical Win Rate %', key: 'historicalWinRate', formatter: (val: number) => `${val || 0}%` },
    { header: 'Contact Person', key: 'contactPerson' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' }
  ]

  const bidAnalysisExportColumns = [
    { header: 'Tender No', key: 'tenderNumber' },
    { header: 'Tender Title', key: 'tenderTitle' },
    { header: 'Competitor Name', key: 'competitorName' },
    { header: 'Quoted Price', key: 'quotedPrice', formatter: (val: number) => formatCurrency(val) },
    { header: 'Our Quote', key: 'ourPrice', formatter: (val: number) => formatCurrency(val || 0) },
    { header: 'Rank', key: 'rank' },
    { header: 'Price Variance %', key: 'priceVariancePercent', formatter: (val: number) => `${val > 0 ? '+' : ''}${val}%` },
    { header: 'Margin Spread (₹)', key: 'marginSpread', formatter: (val: number) => formatCurrency(val || 0) }
  ]

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Competitor Intelligence & Rate Analysis</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs">
              Automated AI Analytics
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track market competitors, record tender quotes, and calculate automated L1/L2 margin spreads
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportMenu
            title="Competitor Intelligence & Bidding Report"
            columns={competitorExportColumns}
            data={competitors}
          />

          <Button size="sm" onClick={() => setAddBidOpen(true)} className="gap-1.5 font-semibold text-xs btn-spring cursor-pointer">
            <Plus className="h-4 w-4" /> Record Competitor Bid
          </Button>

          <Button size="sm" variant="default" onClick={() => setAddCompetitorOpen(true)} className="gap-1.5 font-semibold text-xs btn-spring cursor-pointer">
            <Building2 className="h-4 w-4" /> Add Competitor
          </Button>
        </div>
      </div>

      {/* High Impact KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm card-hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tracked Competitors</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{totalCompetitors}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Active market bidding partners</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm card-hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Dominant Competitor</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{dominantCompetitor}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Highest win probability rival</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm card-hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Avg Market Discount %</CardTitle>
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{avgDiscount}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Discount vs official tender estimate</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm card-hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Target Win Margin</CardTitle>
            <Target className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-primary">3.5% - 5.0%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Recommended L1 safety spread</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-xl mb-4">
          <TabsTrigger value="matrix" className="cursor-pointer">Rate Matrix</TabsTrigger>
          <TabsTrigger value="boq" className="cursor-pointer">Item & Group BOQ Breakdown</TabsTrigger>
          <TabsTrigger value="directory" className="cursor-pointer">Competitor Directory</TabsTrigger>
        </TabsList>

        {/* Tab 1: Tender Rate Comparison Matrix */}
        <TabsContent value="matrix" className="space-y-4 m-0">
          <Card className="border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Tender-wise Competitor Price Comparison & L1/L2 Spread Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated variance calculations comparing competitor bids against our company's price
                </CardDescription>
              </div>

              <ExportMenu
                title="Tender Price Rate Analysis"
                columns={bidAnalysisExportColumns}
                data={competitorBids}
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tender Reference</th>
                      <th className="py-3 px-4">Competitor Name</th>
                      <th className="py-3 px-4">Quoted Price</th>
                      <th className="py-3 px-4">Our Bid Quote</th>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Variance %</th>
                      <th className="py-3 px-4">L1 Spread Margin</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {competitorBids.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="font-medium text-sm">No competitor bid entries recorded yet.</p>
                          <p className="text-xs text-muted-foreground mt-1">Click "Record Competitor Bid" above to add quotes.</p>
                        </td>
                      </tr>
                    ) : (
                      competitorBids.map(b => (
                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-foreground">{b.tenderNumber}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{b.tenderTitle}</p>
                          </td>
                          <td className="py-3 px-4 font-semibold">{b.competitorName}</td>
                          <td className="py-3 px-4 font-bold text-foreground">{formatCurrency(b.quotedPrice)}</td>
                          <td className="py-3 px-4 font-bold text-primary">{b.ourPrice ? formatCurrency(b.ourPrice) : '₹0'}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              b.rank === 'L1' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' :
                              b.rank === 'L2' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' : 'bg-muted text-muted-foreground'
                            }>
                              {b.rank}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <span className={b.priceVariancePercent && b.priceVariancePercent > 0 ? 'text-destructive font-bold' : 'text-emerald-600 font-bold'}>
                              {b.priceVariancePercent && b.priceVariancePercent > 0 ? `+${b.priceVariancePercent}%` : `${b.priceVariancePercent || 0}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">{formatCurrency(b.marginSpread || 0)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCompetitorBids(prev => prev.filter(x => x.id !== b.id))
                                addToast({ title: 'Entry Removed', description: 'Competitor bid entry deleted.', variant: 'default' })
                              }}
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Item-Wise & Group BOQ Rate Breakdown */}
        <TabsContent value="boq" className="space-y-4 m-0">
          <Card className="border shadow-md">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-primary" />
                  Item-Wise & Group BOQ Bidding Analysis Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Schedule-wise line item quantities, departmental estimated rates, and competitor unit rates
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-56 text-xs cursor-pointer"><SelectValue placeholder="Filter Schedule/Group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All BOQ Schedules</SelectItem>
                    {boqGroups.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button size="sm" onClick={() => setAddBoqOpen(true)} className="gap-1.5 font-semibold text-xs btn-spring cursor-pointer">
                  <Plus className="h-4 w-4" /> Add BOQ Item
                </Button>

                <ExportMenu
                  title="Item-Wise BOQ Competitor Rate Report"
                  columns={[
                    { header: 'Group / Schedule', key: 'groupName' },
                    { header: 'Item Code', key: 'itemCode' },
                    { header: 'Description', key: 'description' },
                    { header: 'Qty & UOM', key: 'quantity', formatter: (v: number, row: any) => `${v} ${row.uom || ''}` },
                    { header: 'Est. Unit Rate', key: 'estimatedRate', formatter: (v: number) => formatCurrency(v) },
                    { header: 'Our Quoted Rate', key: 'ourQuotedRate', formatter: (v: number) => formatCurrency(v) }
                  ]}
                  data={filteredBoqItems}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Group / Schedule</th>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Qty / UOM</th>
                      <th className="py-3 px-4">Est. Rate (₹)</th>
                      <th className="py-3 px-4">Our Rate (₹)</th>
                      <th className="py-3 px-4">Competitor Quoted Rates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBoqItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="font-medium text-sm">No BOQ line items recorded for this tender.</p>
                          <p className="text-xs text-muted-foreground mt-1">Click "Add BOQ Item" above to create Schedule line items.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBoqItems.map(item => {
                        const ratesForItem = itemRates.filter(r => r.boqItemId === item.id)
                        const lowestRate = ratesForItem.length
                          ? Math.min(...ratesForItem.map(r => r.quotedUnitRate))
                          : null

                        return (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-semibold text-primary">{item.groupName}</td>
                            <td className="py-3 px-4 font-mono font-bold">{item.itemCode}</td>
                            <td className="py-3 px-4 max-w-xs">{item.description}</td>
                            <td className="py-3 px-4 font-semibold">{item.quantity} {item.uom}</td>
                            <td className="py-3 px-4 font-mono">{formatCurrency(item.estimatedRate)}</td>
                            <td className="py-3 px-4 font-mono font-bold text-foreground">{formatCurrency(item.ourQuotedRate)}</td>
                            <td className="py-3 px-4">
                              {ratesForItem.length === 0 ? (
                                <span className="text-muted-foreground italic text-[11px]">No competitor rates recorded</span>
                              ) : (
                                <div className="space-y-1">
                                  {ratesForItem.map(r => (
                                    <div key={r.id} className="flex items-center gap-2 text-[11px]">
                                      <span className="font-semibold text-muted-foreground">{r.competitorName.split(' ')[0]}:</span>
                                      <span className="font-mono font-bold">{formatCurrency(r.quotedUnitRate)}</span>
                                      {lowestRate === r.quotedUnitRate && (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[9px] px-1 py-0">
                                          Item L1
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Competitor Directory Cards */}
        <TabsContent value="directory" className="space-y-4 m-0">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitors by name, GSTIN, or contact person..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={strengthFilter} onValueChange={setStrengthFilter}>
                <SelectTrigger className="w-40 text-xs cursor-pointer"><SelectValue placeholder="Market Strength" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strengths</SelectItem>
                  <SelectItem value="dominant">Dominant Player</SelectItem>
                  <SelectItem value="high">High Strength</SelectItem>
                  <SelectItem value="medium">Medium Strength</SelectItem>
                  <SelectItem value="low">Low Strength</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompetitors.map(c => (
              <Card key={c.id} className="border shadow-sm card-hover-glow flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold leading-snug">{c.name}</CardTitle>
                      {c.gstin && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">GSTIN: {c.gstin}</p>}
                    </div>
                    <Badge className={
                      c.marketStrength === 'dominant' ? 'bg-destructive/15 text-destructive border-destructive/30 uppercase text-[10px] font-bold' :
                      c.marketStrength === 'high' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30 uppercase text-[10px] font-bold' :
                      'bg-muted text-muted-foreground uppercase text-[10px]'
                    }>
                      {c.marketStrength}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Typical Discount</p>
                      <p className="font-bold text-foreground">{c.typicalDiscountRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Historical Win Rate</p>
                      <p className="font-bold text-emerald-600">{c.historicalWinRate}%</p>
                    </div>
                  </div>

                  {c.contactPerson && (
                    <div className="text-xs space-y-0.5">
                      <p className="font-medium text-foreground">{c.contactPerson}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.email || c.phone}</p>
                    </div>
                  )}

                  {c.notes && <p className="text-[11px] text-muted-foreground italic line-clamp-2">{c.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Add Competitor */}
      <Dialog open={addCompetitorOpen} onOpenChange={setAddCompetitorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Market Competitor</DialogTitle>
            <DialogDescription className="text-xs">Register competitor details for automated price bidding intelligence.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCompetitor} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-medium">Competitor Company Name *</Label>
              <Input
                required
                value={compName}
                onChange={e => setCompName(e.target.value)}
                placeholder="e.g. Larsen & Toubro Infrastructure"
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">GSTIN / Registration No</Label>
                <Input
                  value={compGstin}
                  onChange={e => setCompGstin(e.target.value)}
                  placeholder="27AAACL1234F1Z5"
                  className="text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Market Bidding Strength</Label>
                <Select value={compStrength} onValueChange={v => setCompStrength(v as CompetitorStrength)}>
                  <SelectTrigger className="text-xs mt-1 cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dominant">Dominant Player</SelectItem>
                    <SelectItem value="high">High Strength</SelectItem>
                    <SelectItem value="medium">Medium Strength</SelectItem>
                    <SelectItem value="low">Low Strength</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Avg Discount Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={compDiscount}
                  onChange={e => setCompDiscount(e.target.value)}
                  className="text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Historical Win Rate (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={compWinRate}
                  onChange={e => setCompWinRate(e.target.value)}
                  className="text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Contact Person Name & Designation</Label>
              <Input
                value={compContact}
                onChange={e => setCompContact(e.target.value)}
                placeholder="e.g. Rajesh Sharma (VP Bidding)"
                className="text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddCompetitorOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="cursor-pointer font-bold">
                Save Competitor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Record Competitor Bid Entry */}
      <Dialog open={addBidOpen} onOpenChange={setAddBidOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Competitor Tender Quote</DialogTitle>
            <DialogDescription className="text-xs">Input competitor quote for automated L1/L2 spread calculation.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBidEntry} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-medium">Select Tender Reference</Label>
              <Select value={bidTenderId} onValueChange={setBidTenderId}>
                <SelectTrigger className="text-xs mt-1 cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tenders.map((t: Tender) => (
                    <SelectItem key={t.id} value={t.id}>{t.tenderNumber} - {t.title.slice(0, 30)}...</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Select Competitor</Label>
              <Select value={bidCompetitorId} onValueChange={setBidCompetitorId}>
                <SelectTrigger className="text-xs mt-1 cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {competitors.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Competitor Quoted Price (₹) *</Label>
                <Input
                  type="number"
                  required
                  value={bidQuotedPrice}
                  onChange={e => setBidQuotedPrice(e.target.value)}
                  placeholder="e.g. 48500000"
                  className="text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Our Bid Quote (₹)</Label>
                <Input
                  type="number"
                  value={bidOurPrice}
                  onChange={e => setBidOurPrice(e.target.value)}
                  placeholder="e.g. 47200000"
                  className="text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Assigned Rank</Label>
                <Select value={bidRank} onValueChange={v => setBidRank(v as CompetitorRank)}>
                  <SelectTrigger className="text-xs mt-1 cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">L1 (Lowest Bidder)</SelectItem>
                    <SelectItem value="L2">L2 (2nd Lowest)</SelectItem>
                    <SelectItem value="L3">L3 (3rd Lowest)</SelectItem>
                    <SelectItem value="L4">L4 Position</SelectItem>
                    <SelectItem value="Disqualified">Technically Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Technical Score (QCBS)</Label>
                <Input
                  type="number"
                  value={bidTechScore}
                  onChange={e => setBidTechScore(e.target.value)}
                  className="text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddBidOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="cursor-pointer font-bold">
                Calculate & Save Quote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add BOQ Item */}
      <Dialog open={addBoqOpen} onOpenChange={setAddBoqOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Schedule BOQ Line Item</DialogTitle>
            <DialogDescription className="text-xs">Create schedule/group BOQ item for line-item rate comparison.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBoqItem} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-medium">Schedule / Group Name *</Label>
              <Input
                required
                value={boqGroup}
                onChange={e => setBoqGroup(e.target.value)}
                placeholder="e.g. Schedule A - High Pressure Valves"
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Item Code / Ref *</Label>
                <Input
                  required
                  value={boqCode}
                  onChange={e => setBoqCode(e.target.value)}
                  placeholder="ITEM-1.01"
                  className="text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Quantity & UOM *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    required
                    value={boqQty}
                    onChange={e => setBoqQty(e.target.value)}
                    className="text-xs font-mono w-20"
                  />
                  <Input
                    required
                    value={boqUom}
                    onChange={e => setBoqUom(e.target.value)}
                    placeholder="Nos/MT"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Item Description *</Label>
              <Input
                required
                value={boqDesc}
                onChange={e => setBoqDesc(e.target.value)}
                placeholder="500mm Forged Steel Gate Valve (Class 1500)"
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Est. Unit Rate (₹)</Label>
                <Input
                  type="number"
                  value={boqEstRate}
                  onChange={e => setBoqEstRate(e.target.value)}
                  placeholder="950000"
                  className="text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Our Quoted Unit Rate (₹)</Label>
                <Input
                  type="number"
                  value={boqOurRate}
                  onChange={e => setBoqOurRate(e.target.value)}
                  placeholder="880000"
                  className="text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddBoqOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="cursor-pointer font-bold">
                Save BOQ Line Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
