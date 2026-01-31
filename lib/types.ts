export type DistributionMode = "EQUAL" | "PERCENT" | "ADJUSTABLE";

export type SessionType =
  | "TRADING"
  | "PIRACY"
  | "SALVAGE"
  | "MINING"
  | "BOUNTY"
  | "OTHER";

export type MemberInput = {
  id?: string;
  handle: string;
  role?: string;
  active?: boolean;
  revenue?: number;
  investment?: number;
  percentShare?: number | null;
  fixedBonus?: number | null;
  fixedPayout?: number | null;
};

export type SharedExpenseInput = {
  id?: string;
  label: string;
  amount: number;
  participantIds?: string[]; // default to all active if missing/empty
};

export type IndividualExpenseInput = {
  id?: string;
  memberId: string;
  label: string;
  amount: number;
};

export type SessionInput = {
  id?: string;
  name: string;
  type: SessionType;
  currency?: string;
  totalRevenue?: number;
  distributionMode: DistributionMode;
  taxEnabled?: boolean;
  taxRate?: number;
  members: MemberInput[];
  sharedExpenses?: SharedExpenseInput[];
  individualExpenses?: IndividualExpenseInput[];
};

export type MemberBreakdown = {
  memberId: string;
  handle: string;
  role?: string;
  revenue: number;
  investment: number;
  expenses: number;
  sharedExpenses: number;
  individualExpenses: number;
  profitShare: number;
  finalNet: number;
};

export type Transfer = {
  fromMemberId: string;
  toMemberId: string;
  netAmount: number;
  grossAmount: number;
  feeAmount: number;
};

export type SummaryStatistics = {
  minPayout: number;
  maxPayout: number;
  averagePayout: number;
  totalTransfers: number;
  largestTransfer: number;
  highestEarner: string; // member handle
  lowestEarner: string; // member handle
};

export type PayslipResult = {
  saleRevenue: number;
  netProfit: number;
  taxRateApplied: number;
  members: MemberBreakdown[];
  suggestedTransfers: Transfer[];
  summaryStatistics?: SummaryStatistics;
};

// History stack types for undo/redo functionality
export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export type SessionSnapshot = SessionInput;
