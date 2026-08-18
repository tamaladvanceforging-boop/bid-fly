import type {
  Tender, Bid, Vendor, Alert, AutomationRule,
  AppSettings, DataEntrySheet, DashboardStats, Report, IpcResponse,
  Clarification, Competitor, CompetitorBid, BOQItem, CompetitorItemRate,
  EMDRecord, BOQCostingItem
} from '@/lib/types';
import type {
  TenderCreateInput, TenderUpdateInput,
  BidCreateInput, BidUpdateInput,
  VendorCreateInput, VendorUpdateInput, PaginationParams
} from '@/lib/schemas';
import { generateId, nowISO } from '@/lib/utils';

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data };
}

const INITIAL_SETTINGS: AppSettings = {
  id: 'default',
  theme: 'system',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  language: 'en',
  emailNotifications: true,
  desktopNotifications: true,
  deadlineReminderHours: 24,
  tenderSources: ['Government e-Marketplace (GeM)', 'CPPP Portal', 'TenderKart', 'State Water Works', 'Indian Railways e-Procurement'],
  apiKeys: {},
  gemApiKey: '',
  cpppApiKey: '',
  tenderKartApiKey: '',
  sqliteVaultEnabled: true,
  cloudSyncEnabled: false,
  createdAt: nowISO(),
  updatedAt: nowISO()
};

// CLEAN FRESH INITIAL DATASETS (No hardcoded demo clutter)
const INITIAL_TENDERS: Tender[] = [];
const INITIAL_BIDS: Bid[] = [];
const INITIAL_EMDS: EMDRecord[] = [];
const INITIAL_CLARIFICATIONS: Clarification[] = [];
const INITIAL_COMPETITORS: Competitor[] = [];
const INITIAL_COMP_BIDS: CompetitorBid[] = [];
const INITIAL_BOQ_ITEMS: BOQItem[] = [];
const INITIAL_VENDORS: Vendor[] = [];
const INITIAL_ALERTS: Alert[] = [];
const INITIAL_AUTOMATION: AutomationRule[] = [];
const INITIAL_SHEETS: DataEntrySheet[] = [];

// OPTIONAL DEMO DATASETS (Can be loaded on-demand via Settings)
export const SAMPLE_DEMO_DATA = {
  tenders: [
    {
      id: 't-101',
      tenderNumber: 'GEM/2026/B/789123',
      title: 'Supply and Commissioning of Industrial Valves for Thermal Power Plant',
      description: 'Procurement of High Pressure Class 300/600 Ball and Gate Valves with third-party inspection certificates.',
      organization: 'NTPC Ltd (National Thermal Power Corporation)',
      departmentName: 'Thermal Power & Mechanical Division',
      category: 'Mechanical & Valves',
      portal: 'GeM Portal',
      value: 12500000,
      emdAmount: 250000,
      preBidDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      currency: 'INR',
      status: 'open' as const,
      priority: 'high' as const,
      publishDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      submissionDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      submissionLocation: 'New Delhi, India',
      contactPerson: 'Er. R. K. Verma (DGM Commercial)',
      contactEmail: 'rkverma@ntpc.co.in',
      contactPhone: '+91 11 2436 0100',
      documents: ['NIT_Specification_Doc.pdf', 'BOQ_Schedule_A.xlsx'],
      tags: ['valves', 'thermal', 'ntpc'],
      notes: 'Technical pre-qualification completed. Commercial proposal drafting in progress.',
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: 't-102',
      tenderNumber: 'CPPP/2026/RAIL/4502',
      title: 'Annual Rate Contract for Forged Steel Flanges & Pipe Fittings',
      description: 'Supply of forged carbon steel flanges Class 150/300 as per RDSO specifications.',
      organization: 'Indian Railways (Eastern Zone)',
      departmentName: 'Stores & Procurement Directorate',
      category: 'Civil Works',
      portal: 'CPPP Portal',
      value: 8400000,
      emdAmount: 168000,
      preBidDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      currency: 'INR',
      status: 'open' as const,
      priority: 'medium' as const,
      publishDate: new Date(Date.now() - 8 * 86400000).toISOString(),
      submissionDeadline: new Date(Date.now() + 4 * 86400000).toISOString(),
      submissionLocation: 'Kolkata, West Bengal',
      contactPerson: 'S. Banerjee (Senior Dy Controller)',
      contactEmail: 'banerjee.s@er.railnet.gov.in',
      contactPhone: '+91 33 2230 4567',
      documents: ['RDSO_Spec_Flanges.pdf'],
      tags: ['railways', 'flanges', 'rate-contract'],
      notes: 'Vendor quotes received from 3 suppliers. L1 estimate is 11% below budget.',
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ],
  bids: [
    {
      id: 'b-201',
      tenderId: 't-101',
      tenderNumber: 'GEM/2026/B/789123',
      tenderTitle: 'Supply and Commissioning of Industrial Valves for Thermal Power Plant',
      bidNumber: 'BID-2026-NTPC-01',
      bidderName: 'Advance Forging Pvt Ltd',
      clientName: 'NTPC Ltd',
      bidValue: 11800000,
      quotedAmount: 11800000,
      estimatedValue: 12500000,
      profitMargin: 14.5,
      stage: 'drafting' as const,
      currency: 'INR',
      submissionDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: 'pending' as const,
      technicalScore: 94,
      financialScore: 91,
      overallScore: 93.1,
      technicalWeightage: 70,
      financialWeightage: 30,
      emdAmount: 250000,
      emdMode: 'BG' as const,
      emdExpiryDate: new Date(Date.now() + 80 * 86400000).toISOString(),
      emdStatus: 'active' as const,
      isWinning: false,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ],
  emds: [
    {
      id: 'emd-01',
      tenderId: 't-101',
      bidId: 'b-201',
      tenderNumber: 'GEM/2026/B/789123',
      tenderTitle: 'Supply and Commissioning of Industrial Valves for Thermal Power Plant',
      amount: 250000,
      currency: 'INR',
      mode: 'BG' as const,
      bankName: 'State Bank of India (Commercial Branch, Kolkata)',
      referenceNumber: 'BG/SBI/2026/98214',
      issueDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 80 * 86400000).toISOString(),
      claimExpiryDate: new Date(Date.now() + 110 * 86400000).toISOString(),
      status: 'active' as const,
      favourOf: 'NTPC Ltd, New Delhi',
      payableAt: 'New Delhi',
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ],
  competitors: [
    {
      id: 'comp-1',
      name: 'Larsen & Toubro Heavy Engineering',
      gstin: '27AAACL1234F1Z5',
      contactPerson: 'Vikram Joshi',
      email: 'bids@larsentoubro.com',
      phone: '+91 22 6752 5656',
      marketStrength: 'dominant' as const,
      typicalDiscountRate: 8.5,
      historicalWinRate: 64,
      bidsSubmittedCount: 42,
      bidsWonCount: 27,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ],
  vendors: [
    {
      id: 'v-301',
      name: 'Apex Precision Engineering Works',
      registrationNumber: 'REG-MH-2021-889',
      taxId: '27AAACL8899F1Z0',
      gstin: '27AAACL8899F1Z0',
      email: 'sales@apexprecision.in',
      phone: '+91 98200 12345',
      address: 'Plot 42, MIDC Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pincode: '411018',
      contactPerson: 'Mr. Amit Deshmukh',
      category: 'OEM Valve Supplier',
      vendorType: 'OEM' as const,
      domain: 'Industrial Forgings & Valves',
      rating: 4.9,
      status: 'active' as const,
      materialsCount: 14,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ]
};

class BrowserStorageManager {
  private get<T>(key: string, def: T): T {
    try {
      const raw = localStorage.getItem(`bidfly_${key}`);
      return raw ? (JSON.parse(raw) as T) : def;
    } catch {
      return def;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`bidfly_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  getTenders(): Tender[] { return this.get('tenders', INITIAL_TENDERS); }
  setTenders(v: Tender[]): void { this.set('tenders', v); }

  getBids(): Bid[] { return this.get('bids', INITIAL_BIDS); }
  setBids(v: Bid[]): void { this.set('bids', v); }

  getEMDs(): EMDRecord[] { return this.get('emds', INITIAL_EMDS); }
  setEMDs(v: EMDRecord[]): void { this.set('emds', v); }

  getClarifications(): Clarification[] { return this.get('clarifications', INITIAL_CLARIFICATIONS); }
  setClarifications(v: Clarification[]): void { this.set('clarifications', v); }

  getVendors(): Vendor[] { return this.get('vendors', INITIAL_VENDORS); }
  setVendors(v: Vendor[]): void { this.set('vendors', v); }

  getAlerts(): Alert[] { return this.get('alerts', INITIAL_ALERTS); }
  setAlerts(v: Alert[]): void { this.set('alerts', v); }

  getAutomation(): AutomationRule[] { return this.get('automation', INITIAL_AUTOMATION); }
  setAutomation(v: AutomationRule[]): void { this.set('automation', v); }

  getSheets(): DataEntrySheet[] { return this.get('sheets', INITIAL_SHEETS); }
  setSheets(v: DataEntrySheet[]): void { this.set('sheets', v); }

  getSettings(): AppSettings { return this.get('settings', INITIAL_SETTINGS); }
  setSettings(v: AppSettings): void { this.set('settings', v); }

  getCompetitors(): Competitor[] { return this.get('competitors', INITIAL_COMPETITORS); }
  setCompetitors(v: Competitor[]): void { this.set('competitors', v); }

  getCompetitorBids(): CompetitorBid[] { return this.get('competitor_bids', INITIAL_COMP_BIDS); }
  setCompetitorBids(v: CompetitorBid[]): void { this.set('competitor_bids', v); }

  getBOQItems(): BOQItem[] { return this.get('boq_items', INITIAL_BOQ_ITEMS); }
  setBOQItems(v: BOQItem[]): void { this.set('boq_items', v); }

  clearAllData(): void {
    const keys = [
      'tenders', 'bids', 'emds', 'clarifications', 'vendors',
      'alerts', 'automation', 'sheets', 'competitors', 'competitor_bids',
      'boq_items', 'activity_logs', 'auth_session', 'companies_list', 'remember_creds'
    ];
    keys.forEach(k => {
      try {
        localStorage.removeItem(`bidfly_${k}`);
      } catch {}
    });
    this.setTenders([]);
    this.setBids([]);
    this.setEMDs([]);
    this.setClarifications([]);
    this.setVendors([]);
    this.setAlerts([]);
    this.setAutomation([]);
    this.setSheets([]);
    this.setSettings(INITIAL_SETTINGS);
    this.setCompetitors([]);
    this.setCompetitorBids([]);
    this.setBOQItems([]);
  }

  loadSampleData(): void {
    this.setTenders(SAMPLE_DEMO_DATA.tenders);
    this.setBids(SAMPLE_DEMO_DATA.bids);
    this.setEMDs(SAMPLE_DEMO_DATA.emds);
    this.setCompetitors(SAMPLE_DEMO_DATA.competitors);
    this.setVendors(SAMPLE_DEMO_DATA.vendors);
  }

  resetToSampleData(): void {
    this.clearAllData();
  }
}

export function createBrowserBidFly() {
  const store = new BrowserStorageManager();

  return {
    ping: async () => ok('pong'),

    auth: {
      login: async (input: { email: string; password?: string; role?: any; name?: string; designation?: string }) => {
        const user = {
          id: 'usr_' + Math.random().toString(36).slice(2, 9),
          name: input.name || input.email.split('@')[0],
          email: input.email,
          role: input.role || 'ceo',
          designation: input.designation || 'Chief Executive Officer (CEO)',
          assignedCompanies: []
        };
        return ok({
          user,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString()
        });
      },
      register: async (input: { name: string; email: string; password?: string; role?: any; designation?: string; companyName?: string }) => {
        const user = {
          id: 'usr_' + Math.random().toString(36).slice(2, 9),
          name: input.name,
          email: input.email,
          companyName: input.companyName,
          role: input.role || 'ceo',
          designation: input.designation || 'Chief Executive Officer (CEO)',
          assignedCompanies: []
        };
        return ok({
          user,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString()
        });
      },
      getSession: async () => {
        return ok(null);
      },
      updateProfile: async (id: string, updates: any) => {
        return ok({
          id,
          name: updates.name || '',
          email: updates.email || '',
          role: updates.role || 'ceo',
          designation: updates.designation || 'Executive',
          assignedCompanies: updates.assignedCompanies || [],
          avatar: updates.avatar || ''
        });
      },
      changePassword: async () => ok(true)
    },

    getStats: async (): Promise<IpcResponse<DashboardStats>> => {
      const tenders = store.getTenders();
      const bids = store.getBids();
      const emds = store.getEMDs();
      const vendors = store.getVendors();
      const alerts = store.getAlerts();
      const competitors = store.getCompetitors();

      const activeTenders = tenders.filter(t => t.status === 'open' || t.status === 'active').length;
      const technicalStageCount = tenders.filter(t => t.status === 'open' || t.status === 'evaluating').length;
      const financialStageCount = tenders.filter(t => t.status === 'submitted').length;
      const awardedTendersCount = tenders.filter(t => t.status === 'awarded').length;
      const archivedTenders = tenders.filter(t => t.status === 'closed' || t.status === 'archived').length;

      const submittedBids = bids.filter(b => b.status === 'pending' || b.stage === 'submitted').length;
      const wonBids = bids.filter(b => b.status === 'won' || b.isWinning).length;
      const totalBidValue = bids.reduce((sum, b) => sum + (b.bidValue || b.quotedAmount || 0), 0);
      const wonBidValue = bids.filter(b => b.status === 'won' || b.isWinning).reduce((sum, b) => sum + (b.bidValue || b.quotedAmount || 0), 0);
      const activeVendors = vendors.filter(v => v.status === 'active').length;
      const pendingAlerts = alerts.filter(a => !a.isRead).length;

      const activeEMDs = emds.filter(e => e.status === 'active' || e.status === 'expiring_soon');
      const totalLockedEMD = activeEMDs.reduce((sum, e) => sum + (e.amount || 0), 0);

      const fifteenDaysThreshold = Date.now() + 15 * 86400000;
      const expiringEMDs = activeEMDs.filter(e => {
        const exp = new Date(e.expiryDate).getTime();
        return exp <= fifteenDaysThreshold;
      });

      const qcbsScores = bids.map(b => b.overallScore).filter(Boolean) as number[];
      const qcbsAverageScore = qcbsScores.length > 0
        ? Number((qcbsScores.reduce((a, b) => a + b, 0) / qcbsScores.length).toFixed(1))
        : 0;

      const discounts = competitors.map(c => c.typicalDiscountRate).filter(Boolean) as number[];
      const avgMarketDiscount = discounts.length > 0
        ? Number((discounts.reduce((a, b) => a + b, 0) / discounts.length).toFixed(1))
        : 0;

      return ok({
        totalTenders: tenders.length,
        activeTenders,
        archivedTenders,
        technicalStageCount,
        financialStageCount,
        awardedTendersCount,
        submittedBids,
        wonBids,
        totalBidValue,
        wonBidValue,
        activeVendors,
        pendingAlerts,
        totalCompetitors: competitors.length,
        totalLockedEMD,
        expiringEMDCount: expiringEMDs.length,
        expiringEMDs,
        qcbsAverageScore,
        avgMarketDiscount,
        targetL1MarginSpread: '3.5% – 5.0%',
        recentTenders: tenders.slice(0, 5),
        recentBids: bids.slice(0, 5)
      });
    },

    tender: {
      create: async (data: TenderCreateInput & Record<string, any>) => {
        const list = store.getTenders();
        const duplicate = list.find(t => t.tenderNumber.trim().toLowerCase() === data.tenderNumber.trim().toLowerCase());
        if (duplicate) {
          return { success: false, error: `A tender with reference number "${data.tenderNumber}" already exists.` };
        }
        const item: Tender = {
          id: generateId(),
          tenderNumber: data.tenderNumber,
          title: data.title,
          description: data.description ?? '',
          organization: data.organization,
          departmentName: data.departmentName ?? data.organization,
          category: data.category,
          portal: data.portal ?? 'GeM Portal',
          value: data.value,
          emdAmount: data.emdAmount ?? 0,
          preBidDate: data.preBidDate,
          currency: data.currency ?? 'INR',
          status: data.status ?? 'open',
          priority: data.priority ?? 'medium',
          publishDate: data.publishDate || nowISO(),
          submissionDeadline: data.submissionDeadline,
          submissionLocation: data.submissionLocation ?? '',
          contactPerson: data.contactPerson ?? '',
          contactEmail: data.contactEmail ?? '',
          contactPhone: data.contactPhone ?? '',
          documents: data.documents ?? [],
          tags: data.tags ?? [],
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setTenders(list);
        return ok(item);
      },

      getById: async (id: string) => {
        const item = store.getTenders().find(t => t.id === id);
        return item ? ok(item) : { success: false, error: 'Tender not found' };
      },

      list: async (params: PaginationParams = {}) => {
        const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc', search, filters } = params;
        let items = store.getTenders();

        if (search && search.trim()) {
          const q = search.toLowerCase();
          items = items.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.tenderNumber.toLowerCase().includes(q) ||
            t.organization.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
          );
        }

        if (filters?.category) items = items.filter(t => t.category === filters.category);
        if (filters?.status) items = items.filter(t => t.status === filters.status);

        items.sort((a, b) => {
          let av = (a as any)[sortBy] ?? a.createdAt;
          let bv = (b as any)[sortBy] ?? b.createdAt;
          if (typeof av === 'string') av = av.toLowerCase();
          if (typeof bv === 'string') bv = bv.toLowerCase();
          if (av < bv) return sortOrder === 'asc' ? -1 : 1;
          if (av > bv) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        const total = items.length;
        const paged = items.slice((page - 1) * limit, page * limit);
        return ok({ items: paged, total, page, limit });
      },

      update: async (data: TenderUpdateInput & Record<string, any>) => {
        const list = store.getTenders();
        const idx = list.findIndex(t => t.id === data.id);
        if (idx === -1) return { success: false, error: 'Tender not found' };
        if (data.tenderNumber) {
          const duplicate = list.find(t => t.id !== data.id && t.tenderNumber.trim().toLowerCase() === data.tenderNumber!.trim().toLowerCase());
          if (duplicate) {
            return { success: false, error: `Tender reference "${data.tenderNumber}" is already in use by another tender.` };
          }
        }
        const merged: Tender = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setTenders(list);
        return ok(merged);
      },

      delete: async (id: string) => {
        const list = store.getTenders().filter(t => t.id !== id);
        store.setTenders(list);
        return ok(true);
      },

      getExpiringSoon: async (hours = 48) => {
        const threshold = Date.now() + hours * 3600000;
        const items = store.getTenders().filter(t => {
          const d = new Date(t.submissionDeadline).getTime();
          return d > Date.now() && d <= threshold;
        });
        return ok(items);
      },

      getCategories: async () => {
        const map = new Map<string, number>();
        store.getTenders().forEach(t => {
          map.set(t.category, (map.get(t.category) ?? 0) + 1);
        });
        return ok(Array.from(map.entries()).map(([category, count]) => ({ category, count })));
      },

      getOrganizations: async () => {
        const map = new Map<string, number>();
        store.getTenders().forEach(t => {
          map.set(t.organization, (map.get(t.organization) ?? 0) + 1);
        });
        return ok(Array.from(map.entries()).map(([organization, count]) => ({ organization, count })));
      },

      getMonthlyTrend: async () => {
        const map = new Map<string, { count: number; value: number }>();
        store.getTenders().forEach(t => {
          const m = t.publishDate ? t.publishDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
          const curr = map.get(m) ?? { count: 0, value: 0 };
          map.set(m, { count: curr.count + 1, value: curr.value + (t.value || 0) });
        });
        const res = Array.from(map.entries()).map(([month, data]) => ({ month, ...data }));
        res.sort((a, b) => b.month.localeCompare(a.month));
        return ok(res.slice(0, 12));
      }
    },

    bid: {
      create: async (data: BidCreateInput & Record<string, any>) => {
        const list = store.getBids();
        const duplicate = list.find(b => b.tenderId === data.tenderId && b.bidNumber.trim().toLowerCase() === data.bidNumber.trim().toLowerCase());
        if (duplicate) {
          return { success: false, error: `Bid proposal "${data.bidNumber}" already exists for this tender.` };
        }
        const item: Bid = {
          id: generateId(),
          tenderId: data.tenderId,
          bidNumber: data.bidNumber,
          bidderName: data.bidderName,
          bidValue: data.bidValue,
          currency: data.currency ?? 'INR',
          submissionDate: data.submissionDate,
          status: data.status ?? 'pending',
          technicalScore: data.technicalScore ?? 85,
          financialScore: data.financialScore ?? 80,
          overallScore: data.overallScore ?? Number(((data.technicalScore || 85) * 0.7 + (data.financialScore || 80) * 0.3).toFixed(2)),
          technicalWeightage: data.technicalWeightage ?? 70,
          financialWeightage: data.financialWeightage ?? 30,
          emdAmount: data.emdAmount,
          emdMode: data.emdMode ?? 'BG',
          emdExpiryDate: data.emdExpiryDate,
          emdStatus: data.emdStatus ?? 'active',
          isWinning: data.isWinning ?? false,
          documents: data.documents ?? [],
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setBids(list);
        return ok(item);
      },

      getById: async (id: string) => {
        const item = store.getBids().find(b => b.id === id);
        return item ? ok(item) : { success: false, error: 'Bid not found' };
      },

      list: async (params: PaginationParams & { tenderId?: string } = {}) => {
        const { page = 1, limit = 50, search, filters, tenderId } = params;
        let items = store.getBids();
        if (tenderId) items = items.filter(b => b.tenderId === tenderId);
        if (search && search.trim()) {
          const q = search.toLowerCase();
          items = items.filter(b => b.bidderName.toLowerCase().includes(q) || b.bidNumber.toLowerCase().includes(q));
        }
        if (filters?.status) items = items.filter(b => b.status === filters.status);
        const total = items.length;
        const paged = items.slice((page - 1) * limit, page * limit);
        return ok({ items: paged, total, page, limit });
      },

      update: async (data: BidUpdateInput & Record<string, any>) => {
        const list = store.getBids();
        const idx = list.findIndex(b => b.id === data.id);
        if (idx === -1) return { success: false, error: 'Bid not found' };
        if (data.bidNumber) {
          const duplicate = list.find(b => b.id !== data.id && b.tenderId === (data.tenderId || list[idx].tenderId) && b.bidNumber.trim().toLowerCase() === data.bidNumber!.trim().toLowerCase());
          if (duplicate) {
            return { success: false, error: `Bid number "${data.bidNumber}" already exists for this tender.` };
          }
        }
        const merged: Bid = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setBids(list);
        return ok(merged);
      },

      delete: async (id: string) => {
        const list = store.getBids().filter(b => b.id !== id);
        store.setBids(list);
        return ok(true);
      },

      getByTender: async (tenderId: string) => {
        return ok(store.getBids().filter(b => b.tenderId === tenderId));
      },

      getSummary: async () => {
        const bids = store.getBids();
        const won = bids.filter(b => b.status === 'won' || b.isWinning).length;
        const lost = bids.filter(b => b.status === 'lost').length;
        const pending = bids.filter(b => b.status === 'pending').length;
        const totalValue = bids.reduce((acc, b) => acc + (b.bidValue || 0), 0);
        const wonValue = bids.filter(b => b.status === 'won' || b.isWinning).reduce((acc, b) => acc + (b.bidValue || 0), 0);
        return ok({ total: bids.length, won, lost, pending, totalValue, wonValue });
      }
    },

    emd: {
      list: async () => ok(store.getEMDs()),
      create: async (data: Omit<EMDRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getEMDs();
        const duplicate = list.find(e => e.referenceNumber.trim().toLowerCase() === data.referenceNumber.trim().toLowerCase());
        if (duplicate) {
          return { success: false, error: `A guarantee / EMD with reference "${data.referenceNumber}" already exists.` };
        }
        const item: EMDRecord = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setEMDs(list);
        return ok(item);
      },
      update: async (id: string, data: Partial<EMDRecord>) => {
        const list = store.getEMDs();
        const idx = list.findIndex(e => e.id === id);
        if (idx === -1) return { success: false, error: 'EMD record not found' };
        if (data.referenceNumber) {
          const duplicate = list.find(e => e.id !== id && e.referenceNumber.trim().toLowerCase() === data.referenceNumber!.trim().toLowerCase());
          if (duplicate) {
            return { success: false, error: `Guarantee reference "${data.referenceNumber}" is already in use.` };
          }
        }
        const merged: EMDRecord = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setEMDs(list);
        return ok(merged);
      },
      delete: async (id: string) => {
        const list = store.getEMDs().filter(e => e.id !== id);
        store.setEMDs(list);
        return ok(true);
      },
      getExpiringSoon: async (days = 15) => {
        const threshold = Date.now() + days * 86400000;
        const items = store.getEMDs().filter(e => {
          const exp = new Date(e.expiryDate).getTime();
          return exp <= threshold && (e.status === 'active' || e.status === 'expiring_soon');
        });
        return ok(items);
      }
    },

    vendor: {
      create: async (data: VendorCreateInput & Record<string, any>) => {
        const list = store.getVendors();
        const duplicate = list.find(v =>
          v.name.trim().toLowerCase() === data.name.trim().toLowerCase() ||
          (data.gstin && v.gstin && v.gstin.trim().toLowerCase() === data.gstin.trim().toLowerCase()) ||
          (data.taxId && v.taxId && v.taxId.trim().toLowerCase() === data.taxId.trim().toLowerCase())
        );
        if (duplicate) {
          return { success: false, error: `A vendor with name "${data.name}" or GSTIN/Tax ID "${data.gstin || data.taxId}" already exists.` };
        }
        const item: Vendor = {
          id: generateId(),
          name: data.name,
          registrationNumber: data.registrationNumber ?? '',
          taxId: data.taxId ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          country: data.country ?? 'India',
          pincode: data.pincode ?? '',
          contactPerson: data.contactPerson ?? '',
          categories: data.categories ?? [],
          certifications: data.certifications ?? [],
          vendorType: data.vendorType ?? 'Supplier',
          domain: data.domain ?? 'General Engineering Supplies',
          gstin: data.gstin ?? data.taxId ?? '',
          rating: data.rating ?? 4.5,
          status: data.status ?? 'active',
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setVendors(list);
        return ok(item);
      },

      getById: async (id: string) => {
        const item = store.getVendors().find(v => v.id === id);
        return item ? ok(item) : { success: false, error: 'Vendor not found' };
      },

      list: async (params: PaginationParams = {}) => {
        const { page = 1, limit = 50, search, filters } = params;
        let items = store.getVendors();
        if (search && search.trim()) {
          const q = search.toLowerCase();
          items = items.filter(v =>
            (v.name && v.name.toLowerCase().includes(q)) ||
            (v.email && v.email.toLowerCase().includes(q)) ||
            (v.registrationNumber && v.registrationNumber.toLowerCase().includes(q)) ||
            (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
            (v.gstin && v.gstin.toLowerCase().includes(q))
          );
        }
        if (filters?.status) items = items.filter(v => v.status === filters.status);
        const total = items.length;
        const paged = items.slice((page - 1) * limit, page * limit);
        return ok({ items: paged, total, page, limit });
      },

      update: async (data: VendorUpdateInput & Record<string, any>) => {
        const list = store.getVendors();
        const idx = list.findIndex(v => v.id === data.id);
        if (idx === -1) return { success: false, error: 'Vendor not found' };
        const merged: Vendor = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setVendors(list);
        return ok(merged);
      },

      delete: async (id: string) => {
        const list = store.getVendors().filter(v => v.id !== id);
        store.setVendors(list);
        return ok(true);
      }
    },

    alert: {
      list: async (opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}) => {
        const { page = 1, limit = 50, unreadOnly = false } = opts;
        let items = store.getAlerts();
        if (unreadOnly) items = items.filter(a => !a.isRead);
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return ok({ items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit });
      },

      markRead: async (id: string) => {
        const list = store.getAlerts().map(a => a.id === id ? { ...a, isRead: true } : a);
        store.setAlerts(list);
        return ok(true);
      },

      markAllRead: async () => {
        const list = store.getAlerts().map(a => ({ ...a, isRead: true }));
        store.setAlerts(list);
        return ok(list.length);
      },

      delete: async (id: string) => {
        const list = store.getAlerts().filter(a => a.id !== id);
        store.setAlerts(list);
        return ok(true);
      }
    },

    automation: {
      list: async () => ok(store.getAutomation()),

      getById: async (id: string) => {
        const item = store.getAutomation().find(a => a.id === id);
        return item ? ok(item) : { success: false, error: 'Automation rule not found' };
      },

      create: async (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getAutomation();
        const item: AutomationRule = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setAutomation(list);
        return ok(item);
      },

      update: async (id: string, data: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>) => {
        const list = store.getAutomation();
        const idx = list.findIndex(a => a.id === id);
        if (idx === -1) return { success: false, error: 'Automation rule not found' };
        const merged: AutomationRule = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setAutomation(list);
        return ok(merged);
      },

      delete: async (id: string) => {
        const list = store.getAutomation().filter(a => a.id !== id);
        store.setAutomation(list);
        return ok(true);
      },

      toggle: async (id: string, enabled: boolean) => {
        const list = store.getAutomation().map(a => a.id === id ? { ...a, isEnabled: enabled, updatedAt: nowISO() } : a);
        store.setAutomation(list);
        return ok(true);
      }
    },

    settings: {
      get: async () => ok(store.getSettings()),
      update: async (data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>) => {
        const curr = store.getSettings();
        const merged: AppSettings = { ...curr, ...data, updatedAt: nowISO() };
        store.setSettings(merged);
        return ok(merged);
      }
    },

    sheet: {
      list: async () => ok(store.getSheets()),

      getById: async (id: string) => {
        const item = store.getSheets().find(s => s.id === id);
        return item ? ok(item) : { success: false, error: 'Sheet not found' };
      },

      create: async (data: Omit<DataEntrySheet, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getSheets();
        const item: DataEntrySheet = {
          id: generateId(),
          ...data,
          cells: data.cells ?? {},
          columnHeaders: data.columnHeaders ?? [],
          boqItems: data.boqItems ?? [],
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setSheets(list);
        return ok(item);
      },

      update: async (id: string, data: Partial<Omit<DataEntrySheet, 'id' | 'createdAt'>>) => {
        const list = store.getSheets();
        const idx = list.findIndex(s => s.id === id);
        if (idx === -1) return { success: false, error: 'Sheet not found' };
        const merged: DataEntrySheet = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setSheets(list);
        return ok(merged);
      },

      saveBOQItems: async (sheetId: string, items: BOQCostingItem[]) => {
        const list = store.getSheets();
        const idx = list.findIndex(s => s.id === sheetId);
        if (idx !== -1) {
          list[idx].boqItems = items;
          list[idx].updatedAt = nowISO();
          store.setSheets(list);
        }
        return ok(items);
      },

      getBOQItems: async (sheetId: string) => {
        const sheet = store.getSheets().find(s => s.id === sheetId);
        return ok(sheet?.boqItems || []);
      },

      delete: async (id: string) => {
        const list = store.getSheets().filter(s => s.id !== id);
        store.setSheets(list);
        return ok(true);
      }
    },

    report: {
      generate: async (name: string, type: Report['type'], filters: Record<string, unknown> = {}) => {
        return ok({
          id: generateId(),
          name,
          type,
          filters,
          generatedAt: nowISO()
        });
      },
      list: async () => ok([])
    },

    competitor: {
      list: async () => ok(store.getCompetitors()),
      create: async (data: Omit<Competitor, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getCompetitors();
        const duplicate = list.find(c =>
          c.name.trim().toLowerCase() === data.name.trim().toLowerCase() ||
          (data.gstin && c.gstin && c.gstin.trim().toLowerCase() === data.gstin.trim().toLowerCase())
        );
        if (duplicate) {
          return { success: false, error: `A competitor with name "${data.name}" or GSTIN "${data.gstin}" already exists.` };
        }
        const item: Competitor = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setCompetitors(list);
        return ok(item);
      },
      update: async (id: string, data: Partial<Competitor>) => {
        const list = store.getCompetitors();
        const idx = list.findIndex(c => c.id === id);
        if (idx === -1) return { success: false, error: 'Competitor not found' };
        if (data.name) {
          const duplicate = list.find(c => c.id !== id && c.name.trim().toLowerCase() === data.name!.trim().toLowerCase());
          if (duplicate) {
            return { success: false, error: `Competitor name "${data.name}" already belongs to another competitor.` };
          }
        }
        const merged: Competitor = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setCompetitors(list);
        return ok(merged);
      },
      delete: async (id: string) => {
        const list = store.getCompetitors().filter(c => c.id !== id);
        store.setCompetitors(list);
        return ok(true);
      },
      getBids: async (tenderId?: string) => {
        let list = store.getCompetitorBids();
        if (tenderId && tenderId !== 'all') list = list.filter(b => b.tenderId === tenderId);
        return ok(list);
      },
      createBid: async (data: Omit<CompetitorBid, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getCompetitorBids();
        const duplicate = list.find(b => b.tenderId === data.tenderId && b.competitorId === data.competitorId);
        if (duplicate) {
          return { success: false, error: `A quote for "${data.competitorName}" has already been logged for this tender.` };
        }
        const ourPrice = data.ourPrice ?? 0;
        const variance = ourPrice > 0 ? Number((((data.quotedPrice - ourPrice) / ourPrice) * 100).toFixed(2)) : 0;
        const margin = Number((data.quotedPrice - ourPrice).toFixed(2));

        const item: CompetitorBid = {
          id: generateId(),
          ...data,
          priceVariancePercent: variance,
          marginSpread: margin,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setCompetitorBids(list);
        return ok(item);
      },
      deleteBid: async (id: string) => {
        const list = store.getCompetitorBids().filter(b => b.id !== id);
        store.setCompetitorBids(list);
        return ok(true);
      },
      getBOQItems: async (tenderId?: string) => {
        let list = store.getBOQItems();
        if (tenderId && tenderId !== 'all') list = list.filter(b => b.tenderId === tenderId);
        return ok(list);
      },
      createBOQItem: async (data: Omit<BOQItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getBOQItems();
        const duplicate = list.find(i => i.tenderId === data.tenderId && i.itemCode.trim().toLowerCase() === data.itemCode.trim().toLowerCase());
        if (duplicate) {
          return { success: false, error: `BOQ item code "${data.itemCode}" already exists for this tender.` };
        }
        const item: BOQItem = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.push(item);
        store.setBOQItems(list);
        return ok(item);
      },
      deleteBOQItem: async (id: string) => {
        const list = store.getBOQItems().filter(b => b.id !== id);
        store.setBOQItems(list);
        return ok(true);
      },
      getCompetitorItemRates: async () => ok([]),
      saveCompetitorItemRate: async (data: any) => ok(data)
    },

    clarification: {
      list: async (tenderId?: string) => {
        let list = store.getClarifications();
        if (tenderId && tenderId !== 'all') {
          list = list.filter(c => c.tenderId === tenderId);
        }
        return ok(list);
      },
      create: async (data: Omit<Clarification, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getClarifications();
        const item: Clarification = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        list.unshift(item);
        store.setClarifications(list);
        return ok(item);
      },
      update: async (id: string, data: Partial<Clarification>) => {
        const list = store.getClarifications();
        const idx = list.findIndex(c => c.id === id);
        if (idx === -1) return { success: false, error: 'Clarification not found' };
        const merged: Clarification = { ...list[idx], ...data, updatedAt: nowISO() };
        list[idx] = merged;
        store.setClarifications(list);
        return ok(merged);
      },
      delete: async (id: string) => {
        const list = store.getClarifications().filter(c => c.id !== id);
        store.setClarifications(list);
        return ok(true);
      }
    },

    clearAllData: () => {
      store.clearAllData();
    },

    loadSampleData: () => {
      store.loadSampleData();
    },

    resetSampleData: () => {
      store.clearAllData();
    }
  };
}

export function initBrowserMock(): void {
  if (typeof window === 'undefined') return;
  if (!window.bidfly) {
    window.bidfly = createBrowserBidFly();
  }
}

if (typeof window !== 'undefined') {
  initBrowserMock();
}
