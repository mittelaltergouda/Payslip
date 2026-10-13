import type { PayslipResult, SessionInput, MemberInput, SettlementDetail, Transfer } from "./types";
import type { Lang } from "./i18n/translations";

export function memberAmount(member: MemberInput, kind: "revenue" | "investment"): number {
  const items = kind === "revenue" ? member.revenues : member.investments;
  return items ? items.reduce((sum, item) => sum + item.amount, 0) : member[kind] ?? 0;
}

const isSettlementDetail = (t: Transfer | SettlementDetail): t is SettlementDetail => "exactBudget" in t;

/** Shared by UI and PDF: no recalculation or rounded intermediate arithmetic. */
export function buildArithmeticExplanation(session: SessionInput, result: PayslipResult, lang: Lang): string[] {
  const de = lang === "de";
  const n = (v: number) => String(v);
  const revenue = result.members.reduce((sum, m) => sum + m.revenue, 0);
  const investment = result.members.reduce((sum, m) => sum + m.investment, 0);
  const expenses = result.members.reduce((sum, m) => sum + m.expenses, 0);
  const historicalFees = (session.paidTransfers ?? []).filter(t => t.kind === "SESSION_CASH" || t.kind === "COST_CONTRIBUTION").reduce((sum, t) => sum + t.feeAmount, 0);
  const name = (id: string) => result.members.find(m => m.memberId === id)?.handle ?? id;
  const lines = [
    de ? "Umsatz = gehaltener Session-Erlös vor erfassten Transfers. Bereits enthaltene Transfers nicht erneut erfassen; Bestände zuerst zurückrechnen." : "Revenue = session proceeds held before recorded transfers. Do not record transfers already included in holdings; reconstruct original holdings first.",
    `${de ? "Gewinn" : "Profit"}: ${n(revenue)} - ${n(investment)} - ${n(expenses)} - ${n(historicalFees)} = ${n(result.netProfit)}`,
    de ? "Investments und Auslagen werden einmal abgezogen und den Geldgebern erstattet. Gemeinsame Kosten: Teilnehmer sind die Geldgeber, gleichmäßig erstattet." : "Investments and expenses are deducted once and reimbursed to funders. Shared expense participants are equal funders.",
    de ? "Externes Kapital: Kostenbeteiligung verschiebt die Erstattung vom Käufer zum Geldgeber; kein zusätzlicher Umsatz oder doppelter Kostenabzug. Kosten des Käufers vollständig erfassen." : "External capital: cost contributions move reimbursement from buyer to funder, without adding revenue or deducting costs twice. Record buyer costs in full.",
    `${de ? "Verteilung" : "Distribution"}: ${session.distributionMode}`,
  ];
  const active = session.members.filter(m => m.active !== false);
  for (const m of result.members) {
    const input = session.members.find(x => x.id === m.memberId);
    lines.push(`${m.handle}: ${de ? "Gewinnanteil" : "profit share"} = ${n(m.profitShare)} (${input?.active === false ? "inactive" : session.distributionMode === "EQUAL" ? `${n(result.netProfit)} / ${active.length}` : `share ${input?.percentShare ?? 0}%, bonus ${input?.fixedBonus ?? 0}, fixed ${input?.fixedPayout ?? 0}`})`);
    lines.push(`${m.handle}: ${de ? "Ziel" : "target"} = ${n(m.investment)} + ${n(m.expenses)} + ${n(m.fundingAdjustment ?? 0)} + ${n(m.profitShare)} = ${n(m.finalNet)}`);
    const outgoing = (session.paidTransfers ?? []).filter(t => t.kind !== "COST_CONTRIBUTION" && t.fromMemberId === m.memberId).reduce((sum, t) => sum + t.netAmount + t.feeAmount, 0);
    const incoming = (session.paidTransfers ?? []).filter(t => t.kind !== "COST_CONTRIBUTION" && t.toMemberId === m.memberId).reduce((sum, t) => sum + t.netAmount + (t.kind === "SESSION_CASH" ? 0 : t.feeAmount), 0);
    lines.push(`${m.handle}: ${de ? "Rest vor Vorschlag" : "remaining before suggestion"} = ${n(m.finalNet)} - ${n(m.revenue)} + ${n(outgoing)} - ${n(incoming)} = ${n(m.finalNet - m.revenue + outgoing - incoming)}`);
    for (const [label, items] of [[de ? "Umsatz" : "Revenue", input?.revenues], [de ? "Investment" : "Investment", input?.investments]] as const) {
      for (const item of items ?? []) {lines.push(`${m.handle} / ${label} / ${item.label}: ${n(item.amount)}`);}
    }
  }
  for (const t of session.paidTransfers ?? []) {
    lines.push(`${de ? "Erfasst" : "Recorded"} ${t.label ?? ""} ${name(t.fromMemberId)} -> ${name(t.toMemberId)} [${t.kind ?? "SETTLEMENT"}]: ${n(t.netAmount)} + ${n(t.feeAmount)} = ${n(t.netAmount + t.feeAmount)}`);
  }
  lines.push(de ? "SETTLEMENT: Empfänger trägt die Gebühr im Bruttoanspruch. SESSION_CASH: Nettobestand verschoben, historische Gebühr einmal im Gewinn. COST_CONTRIBUTION: externes Geld, Erstattung plus Gebühr an Geldgeber." : "SETTLEMENT: fee consumes recipient gross entitlement. SESSION_CASH: net holdings moved, historical fee deducted once from profit. COST_CONTRIBUTION: external funding, funder reimbursed plus fee.");
  for (const t of result.settlementDetails ?? result.suggestedTransfers) {
    lines.push(`${de ? "Vorschlag" : "Suggested"} ${name(t.fromMemberId)} -> ${name(t.toMemberId)}: ${n(t.netAmount)} + ${n(t.feeAmount)} = ${n(t.grossAmount)}`);
    if (isSettlementDetail(t)) {lines.push(`${de ? "Budget / Rundung" : "Budget / rounding"}: ${n(t.exactBudget)} -> ${n(t.budgetAmount)}, ${n(t.roundingRemainder)}`);}
  }
  lines.push(`${de ? "Vorschlagsgebühr" : "Suggested fee"}: ceil(net * ${n(result.taxRateApplied)}), minimum 1 when enabled; net + fee fits integer sender budget.`);
  for (const r of result.unsettledBalances ?? []) {lines.push(`${de ? "Rest" : "Residual"} ${name(r.memberId)}: ${n(r.amount)}`);}
  return lines;
}
