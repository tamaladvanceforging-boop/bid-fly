import type {
  Tender, Bid, Vendor, Alert, AutomationRule,
  AppSettings, DataEntrySheet, DashboardStats, Report, IpcResponse,
  User, AuthSession, LoginInput, RegisterInput, Clarification, Competitor,
  CompetitorBid, BOQItem, CompetitorItemRate, EMDRecord, BOQCostingItem
} from '@/lib/types';
import type {
  TenderCreateInput, TenderUpdateInput,
  BidCreateInput, BidUpdateInput,
  VendorCreateInput, VendorUpdateInput, PaginationParams
} from '@/lib/schemas';

declare global {
  interface Window {
    bidfly?: {
      getStats: () => Promise<IpcResponse<DashboardStats>>;
      ping: () => Promise<IpcResponse<string>>;
      auth: {
        login: (data: LoginInput) => Promise<IpcResponse<AuthSession>>;
        register: (data: RegisterInput) => Promise<IpcResponse<AuthSession>>;
        updateProfile: (userId: string, data: Partial<User>) => Promise<IpcResponse<User>>;
        getSession: () => Promise<IpcResponse<AuthSession | null>>;
        changePassword?: (data: any) => Promise<IpcResponse<boolean>>;
      };
      tender: {
        create: (data: TenderCreateInput & Record<string, any>) => Promise<IpcResponse<Tender>>;
        getById: (id: string) => Promise<IpcResponse<Tender>>;
        list: (params?: PaginationParams) => Promise<IpcResponse<{ items: Tender[]; total: number; page: number; limit: number }>>;
        update: (data: TenderUpdateInput & Record<string, any>) => Promise<IpcResponse<Tender>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
        getExpiringSoon: (hours?: number) => Promise<IpcResponse<Tender[]>>;
        getCategories: () => Promise<IpcResponse<{ category: string; count: number }[]>>;
        getOrganizations: () => Promise<IpcResponse<{ organization: string; count: number }[]>>;
        getMonthlyTrend: () => Promise<IpcResponse<{ month: string; count: number; value: number }[]>>;
      };
      bid: {
        create: (data: BidCreateInput & Record<string, any>) => Promise<IpcResponse<Bid>>;
        getById: (id: string) => Promise<IpcResponse<Bid>>;
        list: (params?: PaginationParams & { tenderId?: string }) => Promise<IpcResponse<{ items: Bid[]; total: number; page: number; limit: number }>>;
        update: (data: BidUpdateInput & Record<string, any>) => Promise<IpcResponse<Bid>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
        getByTender: (tenderId: string) => Promise<IpcResponse<Bid[]>>;
        getSummary: () => Promise<IpcResponse<{ total: number; won: number; lost: number; pending: number; totalValue: number; wonValue: number }>>;
      };
      emd: {
        list: () => Promise<IpcResponse<EMDRecord[]>>;
        create: (data: Omit<EMDRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<EMDRecord>>;
        update: (id: string, data: Partial<EMDRecord>) => Promise<IpcResponse<EMDRecord>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
        getExpiringSoon: (days?: number) => Promise<IpcResponse<EMDRecord[]>>;
      };
      vendor: {
        create: (data: VendorCreateInput & Record<string, any>) => Promise<IpcResponse<Vendor>>;
        getById: (id: string) => Promise<IpcResponse<Vendor>>;
        list: (params?: PaginationParams) => Promise<IpcResponse<{ items: Vendor[]; total: number; page: number; limit: number }>>;
        update: (data: VendorUpdateInput & Record<string, any>) => Promise<IpcResponse<Vendor>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
      };
      alert: {
        list: (opts?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<IpcResponse<{ items: Alert[]; total: number; page: number; limit: number }>>;
        markRead: (id: string) => Promise<IpcResponse<boolean>>;
        markAllRead: () => Promise<IpcResponse<number>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
      };
      automation: {
        list: () => Promise<IpcResponse<AutomationRule[]>>;
        getById: (id: string) => Promise<IpcResponse<AutomationRule>>;
        create: (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<AutomationRule>>;
        update: (id: string, data: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>) => Promise<IpcResponse<AutomationRule>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
        toggle: (id: string, enabled: boolean) => Promise<IpcResponse<boolean>>;
      };
      settings: {
        get: () => Promise<IpcResponse<AppSettings>>;
        update: (data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>) => Promise<IpcResponse<AppSettings>>;
      };
      sheet: {
        list: () => Promise<IpcResponse<DataEntrySheet[]>>;
        getById: (id: string) => Promise<IpcResponse<DataEntrySheet>>;
        create: (data: Omit<DataEntrySheet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<DataEntrySheet>>;
        update: (id: string, data: Partial<Omit<DataEntrySheet, 'id' | 'createdAt'>>) => Promise<IpcResponse<DataEntrySheet>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
        saveBOQItems: (sheetId: string, items: BOQCostingItem[]) => Promise<IpcResponse<BOQCostingItem[]>>;
        getBOQItems: (sheetId: string) => Promise<IpcResponse<BOQCostingItem[]>>;
      };
      report: {
        generate: (name: string, type: Report['type'], filters?: Record<string, unknown>) => Promise<IpcResponse<Report>>;
        list: () => Promise<IpcResponse<Report[]>>;
      };
      clarification: {
        list: (tenderId?: string) => Promise<IpcResponse<Clarification[]>>;
        create: (data: Omit<Clarification, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<Clarification>>;
        update: (id: string, data: Partial<Clarification>) => Promise<IpcResponse<Clarification>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
      };
      competitor: {
        list: () => Promise<IpcResponse<Competitor[]>>;
        create: (data: Omit<Competitor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<Competitor>>;
        update: (id: string, data: Partial<Competitor>) => Promise<IpcResponse<Competitor>>;
        delete: (id: string) => Promise<IpcResponse<boolean>>;
        getBids: (tenderId?: string) => Promise<IpcResponse<CompetitorBid[]>>;
        createBid: (data: Omit<CompetitorBid, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<CompetitorBid>>;
        deleteBid: (id: string) => Promise<IpcResponse<boolean>>;
        getBOQItems: (tenderId?: string) => Promise<IpcResponse<BOQItem[]>>;
        createBOQItem: (data: Omit<BOQItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<BOQItem>>;
        deleteBOQItem: (id: string) => Promise<IpcResponse<boolean>>;
        getCompetitorItemRates: (boqItemId?: string) => Promise<IpcResponse<CompetitorItemRate[]>>;
        saveCompetitorItemRate: (data: Omit<CompetitorItemRate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<CompetitorItemRate>>;
      };
      clearAllData?: () => void;
      loadSampleData?: () => void;
      resetSampleData: () => void;
    };
  }
}
