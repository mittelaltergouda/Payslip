import { z } from "zod";

export const memberSchema = z.object({
  id: z.string().optional(),
  handle: z.string().min(1).max(64),
  role: z.string().max(64).optional(),
  active: z.boolean().optional().default(true),
  revenue: z.number().int().nonnegative().default(0),
  investment: z.number().int().nonnegative().default(0),
  percentShare: z.number().min(0).max(100).optional().nullable(),
  fixedBonus: z.number().int().optional().nullable(),
  fixedPayout: z.number().int().optional().nullable()
});

export const sharedExpenseSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(128),
  amount: z.number().int().nonnegative(),
  participantIds: z.array(z.string()).optional()
});

export const individualExpenseSchema = z.object({
  id: z.string().optional(),
  memberId: z.string(),
  label: z.string().min(1).max(128),
  amount: z.number().int().nonnegative()
});

export const sessionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(128),
  type: z.enum(["TRADING", "PIRACY", "SALVAGE", "MINING", "BOUNTY", "OTHER"]),
  currency: z.string().optional().default("aUEC"),
  totalRevenue: z.number().int().nonnegative().optional().default(0),
  distributionMode: z.enum(["EQUAL", "PERCENT", "ADJUSTABLE"]),
  taxEnabled: z.boolean().optional().default(true),
  taxRate: z.number().min(0).max(1).optional().default(0.005),
  members: z.array(memberSchema).min(1),
  sharedExpenses: z.array(sharedExpenseSchema).optional(),
  individualExpenses: z.array(individualExpenseSchema).optional()
});

export type SessionPayload = z.infer<typeof sessionSchema>;
