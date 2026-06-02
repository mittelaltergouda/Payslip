import { z } from "zod";

/**
 * Regular expression for valid member handles.
 * Allows: letters, numbers, spaces, hyphens, underscores, periods, apostrophes
 * Prevents: empty strings, only whitespace, control characters
 */
const HANDLE_REGEX = /^[a-zA-Z0-9\s\-_.'\u00C0-\u017F]+$/;

export const memberSchema = z.object({
  id: z.string().optional(),
  handle: z
    .string()
    .min(1, "Handle cannot be empty")
    .max(64, "Handle cannot exceed 64 characters")
    .regex(HANDLE_REGEX, "Handle contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, periods, and apostrophes are allowed")
    .refine((val) => val.trim().length > 0, {
      message: "Handle cannot be only whitespace"
    }),
  role: z.string().max(64, "Role cannot exceed 64 characters").optional(),
  active: z.boolean().optional().default(true),
  revenue: z.number().int("Revenue must be an integer").nonnegative("Revenue cannot be negative").max(2147483647, "Revenue cannot exceed 2147483647").default(0),
  investment: z.number().int("Investment must be an integer").nonnegative("Investment cannot be negative").max(2147483647, "Investment cannot exceed 2147483647").default(0),
  percentShare: z
    .number()
    .min(0, "Percent share cannot be negative")
    .max(100, "Percent share cannot exceed 100%")
    .optional()
    .nullable(),
  fixedBonus: z
    .number()
    .int("Fixed bonus must be an integer")
    .nonnegative("Fixed bonus cannot be negative")
    .max(2147483647, "Fixed bonus cannot exceed 2147483647")
    .optional()
    .nullable(),
  fixedPayout: z
    .number()
    .int("Fixed payout must be an integer")
    .nonnegative("Fixed payout cannot be negative")
    .max(2147483647, "Fixed payout cannot exceed 2147483647")
    .optional()
    .nullable()
});

export const sharedExpenseSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label cannot be empty").max(128, "Label cannot exceed 128 characters"),
  amount: z.number().int("Amount must be an integer").nonnegative("Amount cannot be negative").max(2147483647, "Amount cannot exceed 2147483647"),
  participantIds: z
    .array(z.string())
    .min(1, "Participant IDs must include at least one member if provided")
    .optional()
});

export const individualExpenseSchema = z.object({
  id: z.string().optional(),
  memberId: z.string().min(1, "Member ID cannot be empty"),
  label: z.string().min(1, "Label cannot be empty").max(128, "Label cannot exceed 128 characters"),
  amount: z.number().int("Amount must be an integer").nonnegative("Amount cannot be negative").max(2147483647, "Amount cannot exceed 2147483647")
});

export const sessionSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Session name cannot be empty").max(128, "Session name cannot exceed 128 characters"),
    type: z.enum(["TRADING", "PIRACY", "SALVAGE", "MINING", "BOUNTY", "OTHER"], {
      errorMap: () => ({ message: "Invalid session type" })
    }),
    currency: z.string().optional().default("aUEC"),
    totalRevenue: z
      .number()
      .int("Total revenue must be an integer")
      .nonnegative("Total revenue cannot be negative")
      .max(2147483647, "Total revenue cannot exceed 2147483647")
      .optional()
      .default(0),
    distributionMode: z.enum(["EQUAL", "PERCENT", "ADJUSTABLE"], {
      errorMap: () => ({ message: "Invalid distribution mode" })
    }),
    taxEnabled: z.boolean().optional().default(true),
    taxRate: z
      .number()
      .min(0, "Tax rate cannot be negative")
      .max(1, "Tax rate cannot exceed 100% (1.0)")
      .optional()
      .default(0.005),
    members: z.array(memberSchema).min(1, "Session must have at least one member"),
    sharedExpenses: z.array(sharedExpenseSchema).optional(),
    individualExpenses: z.array(individualExpenseSchema).optional()
  })
  .refine(
    (data) => {
      // In PERCENT mode, validate that percentShare values sum to 100%
      if (data.distributionMode !== "PERCENT") {
        return true;
      }

      const activeMembers = data.members.filter((m) => m.active !== false);
      const totalPercentShare = activeMembers.reduce((sum, member) => {
        return sum + (member.percentShare ?? 0);
      }, 0);

      // Allow small floating point precision tolerance (0.01%)
      return Math.abs(totalPercentShare - 100) < 0.01;
    },
    {
      message: "In PERCENT mode, the sum of percentShare values for active members must equal 100%"
    }
  )
  .refine(
    (data) => {
      // In PERCENT mode, all active members must have percentShare defined
      if (data.distributionMode !== "PERCENT") {
        return true;
      }

      const activeMembers = data.members.filter((m) => m.active !== false);
      return activeMembers.every((member) => member.percentShare != null);
    },
    {
      message: "In PERCENT mode, all active members must have a percentShare value"
    }
  );

export type SessionPayload = z.infer<typeof sessionSchema>;

export const exportTokenSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string().min(1, "Session ID cannot be empty"),
  token: z
    .string()
    .min(1, "Token cannot be empty")
    .regex(/^[A-Za-z0-9_-]+$/, "Token must be URL-safe (base64url format)")
    .optional(),
  expiresAt: z
    .string()
    .datetime("Expiry date must be a valid ISO 8601 datetime string")
    .optional()
    .nullable()
});

export type ExportTokenPayload = z.infer<typeof exportTokenSchema>;

export const sessionIdParamSchema = z.object({
  id: z.string().uuid("Invalid session ID format. Session ID must be a valid UUID")
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
