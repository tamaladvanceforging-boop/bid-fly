import { ReactNode } from "react";

export type LayoutProps = Readonly<{
  children: ReactNode;
}>;

export type IpcResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type UserRole = 'ceo' | 'admin' | 'bid_manager' | 'analyst' | 'engineer' | 'freelancer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  companyName?: string;
  assignedCompanies?: string[];
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginInput {
  email: string;
  password?: string;
  role?: UserRole;
  designation?: string;
  name?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password?: string;
  companyName?: string;
  designation?: string;
  role?: UserRole;
}

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'draft' | 'submitted' | 'active' | 'evaluating' | 'archived';
export type TenderPriority = 'low' | 'medium' | 'high' | 'critical';
export type BidStatus = 'pending' | 'won' | 'lost' | 'disqualified' | 'active' | 'withdrawn';
export type BidStage = 'discovery' | 'drafting' | 'review' | 'submitted' | 'awarded' | 'lost';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';
export type AutomationTrigger = 'cron' | 'event' | 'manual';

export interface Tender {
  id: string;
  tenderNumber: string;
  title: string;
  description: string;
  organization: string;
  departmentName?: string;
  category: string;
  value: number;
  emdAmount?: number;
  preBidDate?: string;
  currency: string;
  status: TenderStatus;
  priority: TenderPriority;
  publishDate: string;
  submissionDeadline: string;
  submissionLocation: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  portal?: 'GeM Portal' | 'CPPP Portal' | 'State Water Works' | 'Indian Railways' | 'Private' | string;
  documents?: string[];
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EMDMode = 'DD' | 'BG' | 'Online Transfer' | 'FDR';
export type EMDStatus = 'active' | 'expiring_soon' | 'expired' | 'released' | 'claimed';

export interface EMDRecord {
  id: string;
  tenderId?: string;
  bidId?: string;
  tenderNumber?: string;
  tenderTitle?: string;
  amount: number;
  currency: string;
  mode: EMDMode;
  bankName: string;
  referenceNumber: string;
  issueDate: string;
  expiryDate: string;
  claimExpiryDate?: string;
  status: EMDStatus;
  favourOf?: string;
  payableAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  bidNumber: string;
  bidderName: string;
  bidValue: number;
  currency: string;
  submissionDate: string;
  status: BidStatus;
  stage?: BidStage;
  profitMargin?: number;
  clientName?: string;
  tenderTitle?: string;
  tenderNumber?: string;
  estimatedValue?: number;
  quotedAmount?: number;
  technicalScore?: number;
  financialScore?: number;
  overallScore?: number;
  technicalWeightage?: number;
  financialWeightage?: number;
  emdAmount?: number;
  emdMode?: EMDMode;
  emdExpiryDate?: string;
  emdStatus?: EMDStatus;
  isWinning?: boolean;
  documents?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorStatus = 'active' | 'inactive' | 'blacklisted';

export interface Vendor {
  id: string;
  name: string;
  registrationNumber?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  contactPerson?: string;
  categories?: string[];
  certifications?: string[];
  category?: string;
  vendorType?: 'Supplier' | 'Sub-contractor' | 'OEM' | 'Service Provider';
  domain?: string;
  rating?: number;
  status: VendorStatus;
  gstin?: string;
  pan?: string;
  bankDetails?: string;
  materialsCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BOQCostingItem {
  id: string;
  sheetId?: string;
  tenderId?: string;
  itemNo: string;
  scheduleGroup: string;
  boqRef: string;
  description: string;
  quantity: number;
  uom: string;
  basicMaterialRate: number;
  laborFabricationCost: number;
  freightOverhead: number;
  netUnitCost: number;
  marginPercent: number;
  sellingUnitRate: number;
  totalAmount: number;
  gstPercent: number;
  finalTotal: number;
  competitorL1Rate?: number;
  competitorL1Name?: string;
  notes?: string;
}

export interface DataEntryCell {
  row: number;
  col: number;
  value: string;
  formula?: string;
  style?: Record<string, unknown>;
}

export interface DataEntrySheet {
  id: string;
  tenderId?: string;
  name: string;
  rows: number;
  cols: number;
  cells: Record<string, DataEntryCell>;
  columnHeaders?: string[];
  boqItems?: BOQCostingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type?: 'deadline' | 'award' | 'portal' | 'system' | 'urgent' | 'warning' | 'info' | 'emd_expiry' | 'corrigendum';
  tenderId?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  cronSchedule?: string;
  cron_schedule?: string;
  triggerConfig?: Record<string, unknown>;
  action: string;
  actionConfig?: Record<string, unknown>;
  params?: Record<string, unknown>;
  enabled?: boolean;
  isEnabled?: boolean;
  lastRun?: string;
  lastRunAt?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  deadlineReminderHours: number;
  tenderSources?: string[];
  apiKeys?: Record<string, string>;
  gemApiKey?: string;
  cpppApiKey?: string;
  tenderKartApiKey?: string;
  sqliteVaultEnabled?: boolean;
  cloudSyncEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'word' | 'print';

export type ClarificationStage = 'pre_bid' | 'post_bid' | 'corrigendum';
export type ClarificationStatus = 'pending' | 'submitted' | 'answered' | 'pending_response' | 'clarified' | 'rejected' | 'amendment_issued' | 'under_evaluation';

export interface Clarification {
  id: string;
  stage: ClarificationStage;
  tenderId: string;
  tenderNumber: string;
  tenderTitle?: string;
  querySubject: string;
  clauseReference: string;
  clarificationDetails?: string;
  authorityResponse?: string;
  queryDate: string;
  status: ClarificationStatus;
  reminderDate: string;
  reminderHoursBefore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CompetitorStrength = 'low' | 'medium' | 'high' | 'dominant' | 'aggressive';

export interface Competitor {
  id: string;
  name: string;
  gstin?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  marketStrength: CompetitorStrength;
  typicalDiscountRate?: number;
  historicalWinRate?: number;
  bidsSubmittedCount?: number;
  bidsWonCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CompetitorRank = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'Disqualified';

export interface CompetitorBid {
  id: string;
  tenderId: string;
  tenderNumber: string;
  tenderTitle?: string;
  competitorId: string;
  competitorName: string;
  quotedPrice: number;
  ourPrice?: number;
  technicalScore?: number;
  rank?: CompetitorRank;
  isWinner?: boolean;
  priceVariancePercent?: number;
  marginSpread?: number;
  submissionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BOQItem {
  id: string;
  tenderId: string;
  groupName: string;
  itemCode: string;
  description: string;
  quantity: number;
  uom: string;
  estimatedRate: number;
  ourQuotedRate: number;
  competitorRates?: { competitorId: string; competitorName: string; rate: number }[];
  lowestCompetitorRate?: number;
  lowestCompetitorName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompetitorItemRate {
  id: string;
  boqItemId: string;
  competitorId: string;
  competitorName: string;
  unitRate?: number;
  quotedUnitRate?: number;
  totalAmount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalTenders: number;
  activeTenders: number;
  archivedTenders?: number;
  technicalStageCount?: number;
  financialStageCount?: number;
  awardedTendersCount?: number;
  submittedBids: number;
  wonBids: number;
  totalBidValue: number;
  wonBidValue: number;
  activeVendors: number;
  pendingAlerts: number;
  totalCompetitors: number;
  totalLockedEMD: number;
  expiringEMDCount: number;
  qcbsAverageScore?: number;
  avgMarketDiscount?: number;
  targetL1MarginSpread?: string;
  recentTenders: Tender[];
  recentBids: Bid[];
  expiringEMDs?: EMDRecord[];
}

export interface Report {
  id: string;
  name: string;
  type: 'win_loss' | 'pipeline' | 'competitor_benchmark' | 'emd_locked_capital' | 'vendor_compliance' | 'monthly_summary';
  filters?: Record<string, unknown>;
  generatedAt: string;
  data?: any;
}
