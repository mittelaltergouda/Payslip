import { z } from "zod";

export type DistributionMode = "EQUAL" | "PERCENT" | "ADJUSTABLE";

export type SessionType =
  | "TRADING"
  | "PIRACY"
  | "SALVAGE"
  | "MINING"
  | "BOUNTY"
  | "OTHER";

export type MoneyItemInput = {
  id?: string;
  label: string;
  amount: number;
};

export type PaidTransferInput = {
  id?: string;
  fromMemberId: string;
  toMemberId: string;
  netAmount: number;
  feeAmount: number;
  /** Legacy transfers default to SETTLEMENT (recipient bears fee). */
  label?: string;
  kind?: "SETTLEMENT" | "SESSION_CASH" | "COST_CONTRIBUTION";
};

export type MemberInput = {
  id?: string;
  handle: string;
  role?: string;
  active?: boolean;
  revenue?: number;
  investment?: number;
  /** Itemized values replace, rather than add to, the legacy scalar. */
  revenues?: MoneyItemInput[];
  /** Itemized values replace, rather than add to, the legacy scalar. */
  investments?: MoneyItemInput[];
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
  paidTransfers?: PaidTransferInput[];
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
  fundingAdjustment?: number;
};

export type Transfer = {
  fromMemberId: string;
  toMemberId: string;
  netAmount: number;
  grossAmount: number;
  feeAmount: number;
};

export type SettlementDetail = Transfer & {
  exactBudget: number;
  budgetAmount: number;
  roundingRemainder: number;
};

export type UnsettledBalance = {
  memberId: string;
  /** Positive = still to receive, negative = excess cash still retained. */
  amount: number;
};

export type PayslipResult = {
  saleRevenue: number;
  netProfit: number;
  taxRateApplied: number;
  members: MemberBreakdown[];
  suggestedTransfers: Transfer[];
  unsettledBalances?: UnsettledBalance[];
  paidTransferFees?: number;
  settlementDetails?: SettlementDetail[];
  /** ADJUSTABLE only: how fixed payouts/bonuses were treated (loss, low profit). */
  fixedAmountsStatus?: 'APPLIED' | 'SCALED_TO_PROFIT' | 'SUSPENDED_FOR_LOSS';
  /** Transfers recorded as already paid; exports need them for final payouts. */
  paidTransfers?: PaidTransferInput[];
};

// Zod schemas for localStorage session management

const moneySchema = z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER);
const memberInputSchema = z.object({
  id: z.string().optional(),
  handle: z.string(),
  role: z.string().optional(),
  active: z.boolean().optional(),
  revenue: z.number().optional(),
  investment: z.number().optional(),
  revenues: z.array(z.object({ id: z.string().optional(), label: z.string(), amount: moneySchema })).optional(),
  investments: z.array(z.object({ id: z.string().optional(), label: z.string(), amount: moneySchema })).optional(),
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

const paidTransferInputSchema = z.object({
  id: z.string().optional(),
  fromMemberId: z.string(),
  toMemberId: z.string(),
  netAmount: moneySchema,
  feeAmount: moneySchema,
  label: z.string().optional(),
  kind: z.enum(["SETTLEMENT", "SESSION_CASH", "COST_CONTRIBUTION"]).optional(),
});

const sessionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.enum(["TRADING", "PIRACY", "SALVAGE", "MINING", "BOUNTY", "OTHER"]),
  currency: z.string().optional(),
  totalRevenue: z.number().optional(),
  distributionMode: z.enum(["EQUAL", "PERCENT", "ADJUSTABLE"]),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).lt(1).optional(),
  members: z.array(memberInputSchema),
  sharedExpenses: z.array(sharedExpenseInputSchema).optional(),
  individualExpenses: z.array(individualExpenseInputSchema).optional(),
  paidTransfers: z.array(paidTransferInputSchema).optional(),
}).superRefine((session, ctx) => {
  const ids = session.members.map(m => m.id).filter((id): id is string => !!id);
  // Only recorded transfers need unambiguous member references. Older
  // sessions with duplicate IDs stayed valid and must not be dropped on load.
  if ((session.paidTransfers ?? []).length > 0 && new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate member IDs" });
  }
  for (const transfer of session.paidTransfers ?? []) {
    if (!ids.includes(transfer.fromMemberId) || !ids.includes(transfer.toMemberId) || transfer.fromMemberId === transfer.toMemberId || transfer.netAmount + transfer.feeAmount > Number.MAX_SAFE_INTEGER) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid recorded transfer" });
    }
  }
});

export const savedSessionSchema = z.object({
  id: z.string(),
  session: sessionInputSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedSession = z.infer<typeof savedSessionSchema>;

// Zod schemas for crew preset management

export type PresetMember = {
  handle: string;
  role?: string;
  percentShare?: number | null;
};

const presetMemberSchema = z.object({
  handle: z.string(),
  role: z.string().optional(),
  percentShare: z.number().nullable().optional(),
});

export const crewPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(presetMemberSchema),
  distributionMode: z.enum(["EQUAL", "PERCENT", "ADJUSTABLE"]).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CrewPreset = z.infer<typeof crewPresetSchema>;
