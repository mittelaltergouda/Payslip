import type { PayslipResult, SessionInput, MemberInput, PaidTransferInput, DistributionMode } from "./types";
import { calculateServiceFee } from "./calc/tax";
import { buildArithmeticSections } from "./arithmeticSections";
import type { Lang } from "./i18n/translations";

export function memberAmount(member: MemberInput, kind: "revenue" | "investment"): number {
  const items = kind === "revenue" ? member.revenues : member.investments;
  return items ? items.reduce((sum, item) => sum + item.amount, 0) : member[kind] ?? 0;
}

export { buildArithmeticSections } from "./arithmeticSections";
export type { ArithmeticSection } from "./arithmeticSections";

/** Shared by UI and PDF: the sections as a flat list, each title followed by its lines. */
export function buildArithmeticExplanation(session: SessionInput, result: PayslipResult, lang: Lang): string[] {
  return buildArithmeticSections(session, result, lang).flatMap((section) => [section.title, ...section.lines]);
}

/** Older sessions stored only the fee amount; a recorded fee means it was paid. */
export function isServiceFeeIncluded(transfer: Pick<PaidTransferInput, "feeAmount" | "feeIncluded">): boolean {
  return transfer.feeIncluded ?? transfer.feeAmount > 0;
}

/**
 * Amount and fee of a recorded transfer. Same rule as for suggested transfers:
 * the service fee is charged on top of the amount entered in the game.
 */
export function withServiceFee(netAmount: number, feeIncluded: boolean, taxRate: number): Pick<PaidTransferInput, "netAmount" | "feeAmount" | "feeIncluded"> {
  return { netAmount, feeIncluded, feeAmount: feeIncluded ? calculateServiceFee(netAmount, taxRate) : 0 };
}

/** Distribution inputs that are only shown where the mode actually uses them. */
export function distributionColumns(mode: DistributionMode): { percentShare: boolean; fixedAmounts: boolean } {
  return { percentShare: mode !== "EQUAL", fixedAmounts: mode === "ADJUSTABLE" };
}

export type SessionTotals = {
  revenue: number;
  investment: number;
  expenses: number;
  /** Revenue − investments − costs, before any service fee. */
  grossProfit: number;
  /** Every service fee of the session: transfers already made and suggested ones. */
  serviceFees: number;
  /** Gross profit after all service fees: what the crew really keeps. */
  netProfit: number;
};

/** Totals for the summary (UI and PDF), so both always count the same fees. */
export function sessionTotals(session: SessionInput, result: PayslipResult): SessionTotals {
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const revenue = sum(result.members.map((m) => m.revenue));
  const investment = sum(result.members.map((m) => m.investment));
  const expenses = sum(result.members.map((m) => m.expenses));
  const serviceFees =
    sum((session.paidTransfers ?? []).map((t) => t.feeAmount)) +
    sum(result.suggestedTransfers.map((t) => t.feeAmount));
  const grossProfit = revenue - investment - expenses;
  return { revenue, investment, expenses, grossProfit, serviceFees, netProfit: grossProfit - serviceFees };
}
