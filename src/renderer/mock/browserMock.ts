import type {
  Tender, Bid, Vendor, Alert, AutomationRule,
  AppSettings, DataEntrySheet, DashboardStats, Report, IpcResponse
} from '@shared/types'
import type {
  TenderCreateInput, TenderUpdateInput,
  BidCreateInput, BidUpdateInput,
  VendorCreateInput, VendorUpdateInput, PaginationParams
} from '@shared/schemas'
import { generateId, nowISO } from '@shared/utils'

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
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
  tenderSources: ['Tender24x7', 'TenderKart', 'CPPPortal', 'Government e-Marketplace (GeM)', 'Indian Railways e-Procurement'],
  apiKeys: {},
  createdAt: nowISO(),
  updatedAt: nowISO()
}

const INITIAL_TENDERS: Tender[] = [
  {
    id: 't-101',
    tenderNumber: 'CPWD/2026/CIVIL/8841',
    title: 'Construction of Multi-Specialty Hospital Block & Allied Infrastructure',
    description: 'Turnkey construction of 500-bed hospital building including civil structure, MEP, HVAC, electrical substations, firefighting systems, and external development.',
    organization: 'Central Public Works Department (CPWD)',
    category: 'Civil Works',
    value: 84500000,
    currency: 'INR',
    status: 'open',
    priority: 'critical',
    publishDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    submissionDeadline: new Date(Date.now() + 18 * 86400000).toISOString(),
    submissionLocation: 'New Delhi, Delhi NCR',
    contactPerson: 'Er. Rajeshwar Sharma (EE Civil)',
    contactEmail: 'rajeshwar.cpwd@nic.in',
    contactPhone: '+91 11 2338 4921',
    documents: ['NIT_Document_8841.pdf', 'BOQ_Civil_MEP.xlsx', 'Tender_Specs_v2.pdf'],
    tags: ['Hospital', 'Infrastructure', 'EPC', 'High Value'],
    notes: 'EMD of ₹16.9 Lakhs required via BG. Pre-bid meeting scheduled on 20th.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 't-102',
    tenderNumber: 'IRCTC/IT/CLOUD/2026-03',
    title: 'Enterprise Hybrid Cloud Infrastructure & Disaster Recovery Setup',
    description: 'Design, deployment, and 5-year 24x7 managed services for mission-critical ticketing and catering portal on multi-region Tier-IV cloud with 99.995% uptime SLA.',
    organization: 'Indian Railway Catering and Tourism Corp (IRCTC)',
    category: 'IT & Software',
    value: 42000000,
    currency: 'INR',
    status: 'open',
    priority: 'high',
    publishDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    submissionDeadline: new Date(Date.now() + 6 * 86400000).toISOString(),
    submissionLocation: 'New Delhi / Online GeM',
    contactPerson: 'Sanjay Deshmukh (GM IT)',
    contactEmail: 'it.tenders@irctc.co.in',
    contactPhone: '+91 11 4110 5000',
    documents: ['Cloud_RFP_IRCTC_2026.pdf', 'SLA_Framework.pdf'],
    tags: ['Cloud', 'Managed Services', 'High Availability', 'Security'],
    notes: 'Security audit by CERT-In empaneled auditor mandatory.',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 't-103',
    tenderNumber: 'ONGC/OFFSHORE/PIPE/2026/09',
    title: 'Supply and Installation of Subsea Carbon Steel Pipelines (Mumbai High)',
    description: 'Procurement of 48 km 16-inch API 5L Grade X65 seamless pipeline and offshore pipelay barge services for crude transportation.',
    organization: 'Oil and Natural Gas Corporation (ONGC)',
    category: 'Supply & Procurement',
    value: 125000000,
    currency: 'INR',
    status: 'open',
    priority: 'high',
    publishDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    submissionDeadline: new Date(Date.now() + 25 * 86400000).toISOString(),
    submissionLocation: 'Bandra-Kurla Complex, Mumbai',
    contactPerson: 'Anand Kulkarni (Chief Engineer Offshore)',
    contactEmail: 'kulkarni_anand@ongc.co.in',
    contactPhone: '+91 22 2656 3100',
    documents: ['ONGC_Pipe_Spec_2026.pdf', 'Offshore_Safety_Guidelines.pdf'],
    tags: ['Offshore', 'Oil & Gas', 'Pipelines'],
    notes: 'Strict compliance with OISD-141 norms required.',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 't-104',
    tenderNumber: 'NHAI/BOT/HWY-44/PKG-3',
    title: 'Four-Laning of National Highway Section km 120 to km 195 (EPC Mode)',
    description: 'Widening, strengthening, pavement construction, 6 major bridges, 18 culverts, toll plaza installation, and 10 years routine maintenance.',
    organization: 'National Highways Authority of India (NHAI)',
    category: 'Civil Works',
    value: 210000000,
    currency: 'INR',
    status: 'submitted',
    priority: 'critical',
    publishDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    submissionDeadline: new Date(Date.now() - 2 * 86400000).toISOString(),
    submissionLocation: 'NHAI HQ, Dwarka, New Delhi',
    contactPerson: 'V. Ramanathan (CGM Tech)',
    contactEmail: 'cgm.tech@nhai.gov.in',
    contactPhone: '+91 11 2507 4100',
    documents: ['NHAI_DPR_Vol1.pdf', 'Toll_Financial_Model.xlsx'],
    tags: ['Highway', 'EPC', 'NHAI', 'Mega Project'],
    notes: 'Technical bid opened. Financial bid evaluation in progress.',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 't-105',
    tenderNumber: 'BHEL/TURBINE/SOLAR/2026/41',
    title: 'Supply of 250 MW Solar PV Modules & Inverter Stations',
    description: 'Mono-crystalline PERC modules (550Wp+) with ALMM compliance, 1500V central inverters, and SCADA monitoring system.',
    organization: 'Bharat Heavy Electricals Limited (BHEL)',
    category: 'Manufacturing',
    value: 68000000,
    currency: 'INR',
    status: 'awarded',
    priority: 'medium',
    publishDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    submissionDeadline: new Date(Date.now() - 20 * 86400000).toISOString(),
    submissionLocation: 'Bengaluru, Karnataka',
    contactPerson: 'K. S. Narayanan (DGM Purchase)',
    contactEmail: 'ksnarayanan@bhel.in',
    contactPhone: '+91 80 2699 8000',
    documents: ['BHEL_Solar_Award_Letter.pdf'],
    tags: ['Solar', 'Renewable Energy', 'ALMM', 'BHEL'],
    notes: 'Contract awarded to Tata Power Solar. Delivery by Nov 2026.',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
  }
]

const INITIAL_BIDS: Bid[] = [
  {
    id: 'b-201',
    tenderId: 't-101',
    bidNumber: 'BID-2026-CPWD-01',
    bidderName: 'Larsen & Toubro Ltd. (ECC Division)',
    bidValue: 81200000,
    currency: 'INR',
    submissionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'pending',
    technicalScore: 94.5,
    financialScore: 88.0,
    overallScore: 91.2,
    isWinning: false,
    documents: ['Technical_Proposal_LT.pdf', 'Financial_Bid_LT.pdf'],
    notes: 'Strong technical compliance and proven experience in hospital builds.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'b-202',
    tenderId: 't-101',
    bidNumber: 'BID-2026-CPWD-02',
    bidderName: 'Shapoorji Pallonji & Co. Ltd.',
    bidValue: 79800000,
    currency: 'INR',
    submissionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'pending',
    technicalScore: 91.0,
    financialScore: 92.5,
    overallScore: 91.8,
    isWinning: false,
    documents: ['SP_Technical_Sub.pdf', 'Price_Schedule.pdf'],
    notes: 'Lowest financial quote among qualified bidders so far.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'b-203',
    tenderId: 't-102',
    bidNumber: 'BID-2026-IRCTC-01',
    bidderName: 'Tata Consultancy Services (TCS)',
    bidValue: 39500000,
    currency: 'INR',
    submissionDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    status: 'pending',
    technicalScore: 96.0,
    financialScore: 89.0,
    overallScore: 92.5,
    isWinning: false,
    documents: ['TCS_Cloud_Solution.pdf', 'SLA_Compliance.pdf'],
    notes: 'Includes active-active multi-region DR architecture.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'b-204',
    tenderId: 't-104',
    bidNumber: 'BID-2026-NHAI-01',
    bidderName: 'Dilip Buildcon Limited',
    bidValue: 198000000,
    currency: 'INR',
    submissionDate: new Date(Date.now() - 15 * 86400000).toISOString(),
    status: 'won',
    technicalScore: 92.0,
    financialScore: 95.0,
    overallScore: 93.5,
    isWinning: true,
    documents: ['DBL_EPC_Proposal.pdf', 'Equipment_Deployment.pdf'],
    notes: 'Declared L1 and awarded letter of acceptance.',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'b-205',
    tenderId: 't-105',
    bidNumber: 'BID-2026-BHEL-01',
    bidderName: 'Tata Power Solar Systems Ltd.',
    bidValue: 64200000,
    currency: 'INR',
    submissionDate: new Date(Date.now() - 45 * 86400000).toISOString(),
    status: 'won',
    technicalScore: 95.0,
    financialScore: 94.0,
    overallScore: 94.5,
    isWinning: true,
    documents: ['Tata_Solar_Proposal.pdf'],
    notes: 'Highest composite score in QCBS evaluation.',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString()
  }
]

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'v-301',
    name: 'Larsen & Toubro Ltd.',
    registrationNumber: 'L99999MH1946PLC004768',
    taxId: '27AAACL0140P1ZT',
    email: 'tenders.infra@larsentoubro.com',
    phone: '+91 22 6752 5656',
    address: 'L&T House, Ballard Estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    contactPerson: 'Vikram Sengupta (VP Business Dev)',
    categories: ['Civil Works', 'Infrastructure', 'EPC', 'Power'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'CMMI Level 5'],
    rating: 4.9,
    status: 'active',
    notes: 'Grade A+ EPC contractor with pan-India execution capacity.',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'v-302',
    name: 'Tata Consultancy Services Ltd.',
    registrationNumber: 'L22210MH1995PLC084781',
    taxId: '27AAACT2727Q1ZW',
    email: 'gov.solutions@tcs.com',
    phone: '+91 22 6778 9999',
    address: 'TCS House, Raveline Street, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    contactPerson: 'Meera Nambiar (Client Partner)',
    categories: ['IT & Software', 'Consulting', 'Cloud', 'Cybersecurity'],
    certifications: ['CMMI Level 5 v2.0', 'ISO 27001', 'SOC 2 Type II', 'FedRAMP'],
    rating: 4.8,
    status: 'active',
    notes: 'Prime IT partner for national mission-mode e-governance systems.',
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'v-303',
    name: 'Shapoorji Pallonji & Co. Ltd.',
    registrationNumber: 'U45200MH1943PLC003812',
    taxId: '27AAACS1234F1Z8',
    email: 'sp.bids@shapoorji.com',
    phone: '+91 22 6749 0000',
    address: 'SP Centre, 41/44 Minoo Desai Marg, Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400005',
    contactPerson: 'Farhan Contractor (Head Tendering)',
    categories: ['Civil Works', 'High-Rise', 'Healthcare', 'Commercial'],
    certifications: ['ISO 9001:2015', 'LEED Platinum Certified Builder'],
    rating: 4.7,
    status: 'active',
    notes: 'Extensive track record in hospital and institutional campuses.',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: 'v-304',
    name: 'Dilip Buildcon Limited',
    registrationNumber: 'L45201MP2006PLC018689',
    taxId: '23AABCD5678G1ZP',
    email: 'dbl.tenders@dilipbuildcon.co.in',
    phone: '+91 755 402 9999',
    address: 'Plot No. 5, Inside Govind Narayan Singh Gate, Chuna Bhatti',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    pincode: '462016',
    contactPerson: 'Rohan Suryavanshi (Director Operations)',
    categories: ['Civil Works', 'Highways', 'Bridges', 'Mining'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015'],
    rating: 4.6,
    status: 'active',
    notes: 'Owns one of the largest heavy equipment fleets in India.',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString()
  }
]

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'a-401',
    title: 'Submission Deadline Approaching: IRCTC Cloud RFP',
    message: 'Submission deadline is in 6 days (IRCTC/IT/CLOUD/2026-03). Verify digital signature tokens and upload financial schedule.',
    severity: 'warning',
    tenderId: 't-102',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'a-402',
    title: 'New High-Value Tender Published: ONGC Mumbai High Subsea',
    message: 'ONGC published tender ONGC/OFFSHORE/PIPE/2026/09 valued at ₹12.5 Cr. Pre-qualification criteria requires 35km pipelaying experience.',
    severity: 'info',
    tenderId: 't-103',
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
  },
  {
    id: 'a-403',
    title: 'Bid Winner Notification: NHAI Highway 44 Package-3',
    message: 'Dilip Buildcon Ltd. has been confirmed as L1 winner for ₹19.8 Cr project. LOA dispatched.',
    severity: 'success',
    tenderId: 't-104',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: 'a-404',
    title: 'EMD Bank Guarantee Verification Pending: CPWD Hospital',
    message: 'Bank guarantee confirmation for CPWD/2026/CIVIL/8841 is pending from SBI Treasury Branch.',
    severity: 'error',
    tenderId: 't-101',
    isRead: false,
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString()
  }
]

const INITIAL_AUTOMATION: AutomationRule[] = [
  {
    id: 'r-501',
    name: 'Daily Tender Discovery & GeM Sync',
    description: 'Fetch new government and corporate tender notifications from Tender24x7, CPPPortal, and GeM.',
    trigger: 'cron',
    cronSchedule: '0 8 * * 1-6',
    action: 'sync_tenders',
    params: { autoCategorize: true, minBudget: 500000 },
    isEnabled: true,
    lastRun: new Date(Date.now() - 6 * 3600000).toISOString(),
    nextRun: new Date(Date.now() + 18 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'r-502',
    name: '24h Submission Deadline Alert',
    description: 'Send high-priority notification and email reminder 24 hours before any tender submission deadline.',
    trigger: 'cron',
    cronSchedule: '0 */4 * * *',
    action: 'send_deadline_reminder',
    params: { leadHours: 24, recipients: ['bid.team@bidfly.app'] },
    isEnabled: true,
    lastRun: new Date(Date.now() - 2 * 3600000).toISOString(),
    nextRun: new Date(Date.now() + 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'r-503',
    name: 'Weekly Management Analytics Digest',
    description: 'Compile weekly pipeline report, win rates, and budget allocations in PDF format.',
    trigger: 'cron',
    cronSchedule: '0 9 * * 1',
    action: 'export_report',
    params: { format: 'pdf', includeCharts: true },
    isEnabled: true,
    lastRun: new Date(Date.now() - 4 * 86400000).toISOString(),
    nextRun: new Date(Date.now() + 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'r-504',
    name: 'Database Backup & Snapshot',
    description: 'Create encrypted snapshot of SQLite database and store in backup directory.',
    trigger: 'manual',
    action: 'backup_db',
    params: { compress: true },
    isEnabled: true,
    lastRun: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
]

const INITIAL_SHEETS: DataEntrySheet[] = [
  {
    id: 's-601',
    name: 'CPWD Hospital BOQ & Cost Analysis',
    tenderId: 't-101',
    rows: 15,
    cols: 7,
    columnHeaders: ['Item Code', 'Description', 'Unit', 'Qty', 'Rate (₹)', 'Est. Amount (₹)', 'Vendor Quote (₹)'],
    cells: {
      '0:0': { row: 0, col: 0, value: 'Item #' },
      '0:1': { row: 0, col: 1, value: 'Scope Description' },
      '0:2': { row: 0, col: 2, value: 'Unit' },
      '0:3': { row: 0, col: 3, value: 'Quantity' },
      '0:4': { row: 0, col: 4, value: 'Est. Rate' },
      '0:5': { row: 0, col: 5, value: 'Total Est.' },
      '0:6': { row: 0, col: 6, value: 'L1 Bid Quote' },
      '1:0': { row: 1, col: 0, value: '1.01' },
      '1:1': { row: 1, col: 1, value: 'Earthwork in excavation in foundation' },
      '1:2': { row: 1, col: 2, value: 'Cum' },
      '1:3': { row: 1, col: 3, value: '12500' },
      '1:4': { row: 1, col: 4, value: '450' },
      '1:5': { row: 1, col: 5, value: '=D2*E2' },
      '1:6': { row: 1, col: 6, value: '5200000' },
      '2:0': { row: 2, col: 0, value: '1.02' },
      '2:1': { row: 2, col: 1, value: 'Reinforced cement concrete M35 in column' },
      '2:2': { row: 2, col: 2, value: 'Cum' },
      '2:3': { row: 2, col: 3, value: '4800' },
      '2:4': { row: 2, col: 4, value: '7800' },
      '2:5': { row: 2, col: 5, value: '=D3*E3' },
      '2:6': { row: 2, col: 6, value: '35800000' },
      '3:0': { row: 3, col: 0, value: '1.03' },
      '3:1': { row: 3, col: 1, value: 'Thermo-mechanically treated Fe500D steel' },
      '3:2': { row: 3, col: 2, value: 'MT' },
      '3:3': { row: 3, col: 3, value: '620' },
      '3:4': { row: 3, col: 4, value: '68000' },
      '3:5': { row: 3, col: 5, value: '=D4*E4' },
      '3:6': { row: 3, col: 6, value: '41200000' },
      '4:0': { row: 4, col: 0, value: 'TOTAL' },
      '4:1': { row: 4, col: 1, value: 'Grand Total Civil Package' },
      '4:2': { row: 4, col: 2, value: '—' },
      '4:3': { row: 4, col: 3, value: '—' },
      '4:4': { row: 4, col: 4, value: '—' },
      '4:5': { row: 4, col: 5, value: '=SUM(F2:F4)' },
      '4:6': { row: 4, col: 6, value: '=SUM(G2:G4)' }
    },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
]

class BrowserStorageManager {
  private get<T>(key: string, def: T): T {
    try {
      const raw = localStorage.getItem(`bidfly_${key}`)
      return raw ? (JSON.parse(raw) as T) : def
    } catch {
      return def
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`bidfly_${key}`, JSON.stringify(val))
    } catch (e) {
      console.warn('LocalStorage save failed', e)
    }
  }

  getTenders(): Tender[] { return this.get('tenders', INITIAL_TENDERS) }
  setTenders(v: Tender[]): void { this.set('tenders', v) }

  getBids(): Bid[] { return this.get('bids', INITIAL_BIDS) }
  setBids(v: Bid[]): void { this.set('bids', v) }

  getVendors(): Vendor[] { return this.get('vendors', INITIAL_VENDORS) }
  setVendors(v: Vendor[]): void { this.set('vendors', v) }

  getAlerts(): Alert[] { return this.get('alerts', INITIAL_ALERTS) }
  setAlerts(v: Alert[]): void { this.set('alerts', v) }

  getAutomation(): AutomationRule[] { return this.get('automation', INITIAL_AUTOMATION) }
  setAutomation(v: AutomationRule[]): void { this.set('automation', v) }

  getSheets(): DataEntrySheet[] { return this.get('sheets', INITIAL_SHEETS) }
  setSheets(v: DataEntrySheet[]): void { this.set('sheets', v) }

  getSettings(): AppSettings { return this.get('settings', INITIAL_SETTINGS) }
  setSettings(v: AppSettings): void { this.set('settings', v) }

  resetToSampleData(): void {
    this.setTenders(INITIAL_TENDERS)
    this.setBids(INITIAL_BIDS)
    this.setVendors(INITIAL_VENDORS)
    this.setAlerts(INITIAL_ALERTS)
    this.setAutomation(INITIAL_AUTOMATION)
    this.setSheets(INITIAL_SHEETS)
    this.setSettings(INITIAL_SETTINGS)
  }
}

const store = new BrowserStorageManager()

export function createBrowserMockAPI() {
  return {
    hello: async () => ok('BidFly Browser Mock v1.0.0'),

    getStats: async (): Promise<IpcResponse<DashboardStats>> => {
      const tenders = store.getTenders()
      const bids = store.getBids()
      const alerts = store.getAlerts()
      const openTenders = tenders.filter(t => t.status === 'open').length
      const activeBids = bids.filter(b => b.status === 'pending').length
      const wonBids = bids.filter(b => b.status === 'won' || b.isWinning).length
      const totalValue = tenders.reduce((acc, t) => acc + (t.value || 0), 0)
      const pendingAlerts = alerts.filter(a => !a.isRead).length
      const upcomingDeadlines = tenders.filter(t => t.status === 'open' && new Date(t.submissionDeadline).getTime() > Date.now()).length

      return ok({
        totalTenders: tenders.length,
        openTenders,
        activeBids,
        wonBids,
        totalValue,
        pendingAlerts,
        upcomingDeadlines
      })
    },

    tender: {
      create: async (data: TenderCreateInput) => {
        const list = store.getTenders()
        const item: Tender = {
          id: generateId(),
          tenderNumber: data.tenderNumber,
          title: data.title,
          organization: data.organization,
          category: data.category,
          value: data.value,
          currency: data.currency ?? 'INR',
          status: data.status ?? 'draft',
          priority: data.priority ?? 'medium',
          publishDate: data.publishDate,
          submissionDeadline: data.submissionDeadline,
          documents: data.documents ?? [],
          tags: data.tags ?? [],
          notes: data.notes ?? '',
          description: data.description ?? '',
          submissionLocation: data.submissionLocation ?? '',
          contactPerson: data.contactPerson ?? '',
          contactEmail: data.contactEmail ?? '',
          contactPhone: data.contactPhone ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setTenders(list)
        return ok(item)
      },

      getById: async (id: string) => {
        const item = store.getTenders().find(t => t.id === id)
        return item ? ok(item) : { success: false, error: 'Tender not found' }
      },

      list: async (params: PaginationParams = {}) => {
        const { page = 1, limit = 50, search, filters, sortBy = 'created_at', sortOrder = 'desc' } = params
        let items = store.getTenders()
        if (search && search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.tenderNumber.toLowerCase().includes(q) ||
            t.organization.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
          )
        }
        if (filters) {
          if (filters.status) items = items.filter(t => t.status === filters.status)
          if (filters.priority) items = items.filter(t => t.priority === filters.priority)
          if (filters.category) items = items.filter(t => t.category === filters.category)
          if (filters.organization) items = items.filter(t => t.organization === filters.organization)
        }
        items.sort((a, b) => {
          let av = (a as any)[sortBy] ?? a.createdAt
          let bv = (b as any)[sortBy] ?? b.createdAt
          if (typeof av === 'string') av = av.toLowerCase()
          if (typeof bv === 'string') bv = bv.toLowerCase()
          if (av < bv) return sortOrder === 'asc' ? -1 : 1
          if (av > bv) return sortOrder === 'asc' ? 1 : -1
          return 0
        })
        const total = items.length
        const paged = items.slice((page - 1) * limit, page * limit)
        return ok({ items: paged, total, page, limit })
      },

      update: async (data: TenderUpdateInput) => {
        const list = store.getTenders()
        const idx = list.findIndex(t => t.id === data.id)
        if (idx === -1) return { success: false, error: 'Tender not found' }
        const merged: Tender = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setTenders(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getTenders().filter(t => t.id !== id)
        store.setTenders(list)
        return ok(true)
      },

      getCategories: async () => {
        const map = new Map<string, number>()
        store.getTenders().forEach(t => {
          map.set(t.category, (map.get(t.category) ?? 0) + 1)
        })
        return ok(Array.from(map.entries()).map(([category, count]) => ({ category, count })))
      },

      getOrganizations: async () => {
        const map = new Map<string, number>()
        store.getTenders().forEach(t => {
          map.set(t.organization, (map.get(t.organization) ?? 0) + 1)
        })
        return ok(Array.from(map.entries()).map(([organization, count]) => ({ organization, count })))
      },

      getMonthlyTrend: async () => {
        const map = new Map<string, { count: number; value: number }>()
        store.getTenders().forEach(t => {
          const m = t.publishDate.slice(0, 7)
          const curr = map.get(m) ?? { count: 0, value: 0 }
          map.set(m, { count: curr.count + 1, value: curr.value + (t.value || 0) })
        })
        const res = Array.from(map.entries()).map(([month, data]) => ({ month, ...data }))
        res.sort((a, b) => b.month.localeCompare(a.month))
        return ok(res.slice(0, 12))
      }
    },

    bid: {
      create: async (data: BidCreateInput) => {
        const list = store.getBids()
        const item: Bid = {
          id: generateId(),
          tenderId: data.tenderId,
          bidNumber: data.bidNumber,
          bidderName: data.bidderName,
          bidValue: data.bidValue,
          currency: data.currency ?? 'INR',
          submissionDate: data.submissionDate,
          status: data.status ?? 'pending',
          technicalScore: data.technicalScore,
          financialScore: data.financialScore,
          overallScore: data.overallScore,
          isWinning: data.isWinning ?? false,
          documents: data.documents ?? [],
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setBids(list)
        return ok(item)
      },

      getById: async (id: string) => {
        const item = store.getBids().find(b => b.id === id)
        return item ? ok(item) : { success: false, error: 'Bid not found' }
      },

      list: async (params: PaginationParams & { tenderId?: string } = {}) => {
        const { page = 1, limit = 50, search, filters, tenderId } = params
        let items = store.getBids()
        if (tenderId) items = items.filter(b => b.tenderId === tenderId)
        if (search && search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(b => b.bidderName.toLowerCase().includes(q) || b.bidNumber.toLowerCase().includes(q))
        }
        if (filters?.status) items = items.filter(b => b.status === filters.status)
        const total = items.length
        const paged = items.slice((page - 1) * limit, page * limit)
        return ok({ items: paged, total, page, limit })
      },

      update: async (data: BidUpdateInput) => {
        const list = store.getBids()
        const idx = list.findIndex(b => b.id === data.id)
        if (idx === -1) return { success: false, error: 'Bid not found' }
        const merged: Bid = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setBids(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getBids().filter(b => b.id !== id)
        store.setBids(list)
        return ok(true)
      },

      getByTender: async (tenderId: string) => {
        return ok(store.getBids().filter(b => b.tenderId === tenderId))
      },

      getSummary: async () => {
        const bids = store.getBids()
        const won = bids.filter(b => b.status === 'won' || b.isWinning).length
        const lost = bids.filter(b => b.status === 'lost').length
        const pending = bids.filter(b => b.status === 'pending').length
        const totalValue = bids.reduce((acc, b) => acc + (b.bidValue || 0), 0)
        const wonValue = bids.filter(b => b.status === 'won' || b.isWinning).reduce((acc, b) => acc + (b.bidValue || 0), 0)
        return ok({ total: bids.length, won, lost, pending, totalValue, wonValue })
      }
    },

    vendor: {
      create: async (data: VendorCreateInput) => {
        const list = store.getVendors()
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
          country: data.country ?? '',
          pincode: data.pincode ?? '',
          contactPerson: data.contactPerson ?? '',
          categories: data.categories ?? [],
          certifications: data.certifications ?? [],
          rating: data.rating,
          status: data.status ?? 'active',
          notes: data.notes ?? '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setVendors(list)
        return ok(item)
      },

      getById: async (id: string) => {
        const item = store.getVendors().find(v => v.id === id)
        return item ? ok(item) : { success: false, error: 'Vendor not found' }
      },

      list: async (params: PaginationParams = {}) => {
        const { page = 1, limit = 50, search, filters } = params
        let items = store.getVendors()
        if (search && search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.email.toLowerCase().includes(q) ||
            v.registrationNumber.toLowerCase().includes(q) ||
            v.contactPerson.toLowerCase().includes(q)
          )
        }
        if (filters?.status) items = items.filter(v => v.status === filters.status)
        const total = items.length
        const paged = items.slice((page - 1) * limit, page * limit)
        return ok({ items: paged, total, page, limit })
      },

      update: async (data: VendorUpdateInput) => {
        const list = store.getVendors()
        const idx = list.findIndex(v => v.id === data.id)
        if (idx === -1) return { success: false, error: 'Vendor not found' }
        const merged: Vendor = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setVendors(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getVendors().filter(v => v.id !== id)
        store.setVendors(list)
        return ok(true)
      }
    },

    alert: {
      list: async (opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}) => {
        const { page = 1, limit = 50, unreadOnly = false } = opts
        let items = store.getAlerts()
        if (unreadOnly) items = items.filter(a => !a.isRead)
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return ok({ items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit })
      },

      markRead: async (id: string) => {
        const list = store.getAlerts().map(a => a.id === id ? { ...a, isRead: true } : a)
        store.setAlerts(list)
        return ok(true)
      },

      markAllRead: async () => {
        const list = store.getAlerts().map(a => ({ ...a, isRead: true }))
        store.setAlerts(list)
        return ok(list.length)
      },

      delete: async (id: string) => {
        const list = store.getAlerts().filter(a => a.id !== id)
        store.setAlerts(list)
        return ok(true)
      }
    },

    automation: {
      list: async () => ok(store.getAutomation()),

      getById: async (id: string) => {
        const item = store.getAutomation().find(a => a.id === id)
        return item ? ok(item) : { success: false, error: 'Automation rule not found' }
      },

      create: async (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getAutomation()
        const item: AutomationRule = {
          id: generateId(),
          ...data,
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setAutomation(list)
        return ok(item)
      },

      update: async (id: string, data: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>) => {
        const list = store.getAutomation()
        const idx = list.findIndex(a => a.id === id)
        if (idx === -1) return { success: false, error: 'Automation rule not found' }
        const merged: AutomationRule = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setAutomation(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getAutomation().filter(a => a.id !== id)
        store.setAutomation(list)
        return ok(true)
      },

      toggle: async (id: string, enabled: boolean) => {
        const list = store.getAutomation().map(a => a.id === id ? { ...a, isEnabled: enabled, updatedAt: nowISO() } : a)
        store.setAutomation(list)
        return ok(true)
      }
    },

    settings: {
      get: async () => ok(store.getSettings()),
      update: async (data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>) => {
        const curr = store.getSettings()
        const merged: AppSettings = { ...curr, ...data, updatedAt: nowISO() }
        store.setSettings(merged)
        return ok(merged)
      }
    },

    sheet: {
      list: async () => ok(store.getSheets()),

      getById: async (id: string) => {
        const item = store.getSheets().find(s => s.id === id)
        return item ? ok(item) : { success: false, error: 'Sheet not found' }
      },

      create: async (data: Omit<DataEntrySheet, 'id' | 'createdAt' | 'updatedAt'>) => {
        const list = store.getSheets()
        const item: DataEntrySheet = {
          id: generateId(),
          ...data,
          cells: data.cells ?? {},
          columnHeaders: data.columnHeaders ?? [],
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        list.unshift(item)
        store.setSheets(list)
        return ok(item)
      },

      update: async (id: string, data: Partial<Omit<DataEntrySheet, 'id' | 'createdAt'>>) => {
        const list = store.getSheets()
        const idx = list.findIndex(s => s.id === id)
        if (idx === -1) return { success: false, error: 'Sheet not found' }
        const merged: DataEntrySheet = { ...list[idx], ...data, updatedAt: nowISO() }
        list[idx] = merged
        store.setSheets(list)
        return ok(merged)
      },

      delete: async (id: string) => {
        const list = store.getSheets().filter(s => s.id !== id)
        store.setSheets(list)
        return ok(true)
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
        })
      },
      list: async () => ok([])
    },

    resetSampleData: () => {
      store.resetToSampleData()
    }
  }
}
