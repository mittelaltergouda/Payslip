import { z } from "zod";

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
  active?: boolean;
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

// Zod schemas for localStorage session management

const memberInputSchema = z.object({
  id: z.string().optional(),
  handle: z.string(),
  role: z.string().optional(),
  active: z.boolean().optional(),
  revenue: z.number().optional(),
  investment: z.number().optional(),
  percentShare: z.number().nullable().optional(),
  fixedBonus: z.number().nullable().optional(),
  fixedPayout: z.number().nullable().optional(),
});

const sharedExpenseInputSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  amount: z.number(),
  participantIds: z.array(z.string()).optional(),
});

const individualExpenseInputSchema = z.object({
  id: z.string().optional(),
  memberId: z.string(),
  label: z.string(),
  amount: z.number(),
});

const sessionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.enum(["TRADING", "PIRACY", "SALVAGE", "MINING", "BOUNTY", "OTHER"]),
  currency: z.string().optional(),
  totalRevenue: z.number().optional(),
  distributionMode: z.enum(["EQUAL", "PERCENT", "ADJUSTABLE"]),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().optional(),
  members: z.array(memberInputSchema),
  sharedExpenses: z.array(sharedExpenseInputSchema).optional(),
  individualExpenses: z.array(individualExpenseInputSchema).optional(),
});

export const savedSessionSchema = z.object({
  id: z.string(),
  session: sessionInputSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedSession = z.infer<typeof savedSessionSchema>;
