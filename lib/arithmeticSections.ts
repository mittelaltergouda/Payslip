import type { MemberBreakdown, PayslipResult, SessionInput, SettlementDetail, Transfer } from "./types";
import { translations, type Lang } from "./i18n/translations";

/** One titled block of the step-by-step calculation, shared by UI and PDF. */
export type ArithmeticSection = { title: string; lines: string[] };

type Ctx = {
  session: SessionInput;
  result: PayslipResult;
  de: boolean;
  num: (value: number) => string;
  name: (id: string) => string;
};

const isSettlementDetail = (t: Transfer | SettlementDetail): t is SettlementDetail => "exactBudget" in t;

/** Exact, locale-formatted numbers: shares stay recomputable (no rounding to whole aUEC). */
function exactNumber(lang: Lang) {
  const locale = lang === "de" ? "de-DE" : "en-US";
  return (value: number) => (Object.is(value, -0) ? 0 : value).toLocaleString(locale, { maximumFractionDigits: 2 });
}

/** "+ 5" or "− 5", so negative terms read like the hand calculation. */
function signed(value: number, num: (v: number) => string): string {
  return value < 0 ? `− ${num(-value)}` : `+ ${num(value)}`;
}

function profitSection(ctx: Ctx): ArithmeticSection {
  const { session, result, de, num } = ctx;
  const lines: string[] = [];
  for (const member of session.members) {
    for (const [label, items] of [[de ? "Umsatz" : "revenue", member.revenues], ["Investments", member.investments]] as const) {
      if (items && items.length > 0) {
        const parts = items.map((item) => `${item.label} ${num(item.amount)}`).join(" + ");
        lines.push(`${member.handle} ${label}: ${parts} = ${num(items.reduce((sum, item) => sum + item.amount, 0))}`);
      }
    }
  }
  const sumLine = (label: string, pick: (m: MemberBreakdown) => number) => {
    const total = result.members.reduce((sum, m) => sum + pick(m), 0);
    lines.push(`${label}: ${result.members.map((m) => `${m.handle} ${num(pick(m))}`).join(" + ")} = ${num(total)}`);
    return total;
  };
  const revenue = sumLine(de ? "Umsatz" : "Revenue", (m) => m.revenue);
  const investment = sumLine("Investments", (m) => m.investment);
  const expenses = sumLine(de ? "Kosten" : "Costs", (m) => m.expenses);
  if ((session.sharedExpenses ?? []).length > 0) {
    lines.push(de
      ? "Gemeinsame Kosten werden gleich auf ihre Teilnehmer verteilt und diesen erstattet."
      : "Shared costs are split equally among their participants and reimbursed to them.");
  }
  const fees = (session.paidTransfers ?? [])
    .filter((t) => t.kind === "SESSION_CASH" || t.kind === "COST_CONTRIBUTION")
    .reduce((sum, t) => sum + t.feeAmount, 0);
  if (fees > 0) {
    lines.push(`${de ? "Bereits bezahlte Service Fees aus Vorschüssen und Kostenbeteiligungen" : "Service fees already paid on advances and cost contributions"}: ${num(fees)}`);
  }
  const label = result.netProfit < 0 ? (de ? "Ergebnis (Verlust)" : "Result (loss)") : (de ? "Gewinn" : "Profit");
  const feeTerm = fees > 0 ? ` − ${num(fees)}` : "";
  lines.push(`${label} = ${num(revenue)} − ${num(investment)} − ${num(expenses)}${feeTerm} = ${num(result.netProfit)}`);
  return { title: de ? "1. Gewinn" : "1. Profit", lines };
}

function adjustableLines(ctx: Ctx, active: SessionInput["members"]): string[] {
  const { result, de, num } = ctx;
  const t = translations[de ? "de" : "en"];
  const share = (id?: string) => result.members.find((m) => m.memberId === id)?.profitShare ?? 0;
  const fixedTotal = active.reduce((sum, m) => sum + (m.fixedPayout ?? m.fixedBonus ?? 0), 0);
  const lines: string[] = [];
  const status = result.fixedAmountsStatus;

  if (status === "SUSPENDED_FOR_LOSS") {
    lines.push(t.fixedAmountsSuspended);
    for (const m of active) {
      lines.push(m.fixedPayout != null
        ? `${m.handle}: ${de ? "Fixauszahlung" : "fixed payout"} ${num(m.fixedPayout)} ${de ? "ausgesetzt" : "suspended"} → 0`
        : `${m.handle}: ${num(share(m.id))}`);
    }
    return lines;
  }
  if (status === "SCALED_TO_PROFIT") {
    const factor = fixedTotal > 0 ? (result.netProfit / fixedTotal) * 100 : 0;
    lines.push(t.fixedAmountsScaled);
    lines.push(`${de ? "Kürzung" : "Reduction"}: ${num(result.netProfit)} ÷ ${num(fixedTotal)} = ${num(factor)} % ${de ? "jedes Fixbetrags" : "of every fixed amount"}`);
    for (const m of active) {
      const fixed = m.fixedPayout ?? m.fixedBonus ?? 0;
      const kind = m.fixedPayout != null ? (de ? "Fixauszahlung" : "fixed payout") : (de ? "Fixbonus" : "fixed bonus");
      lines.push(fixed > 0 ? `${m.handle}: ${kind} ${num(fixed)} × ${num(factor)} % = ${num(share(m.id))}` : `${m.handle}: 0`);
    }
    return lines;
  }
  if (fixedTotal > 0) {
    lines.push(`${de ? "Fixauszahlungen und Fixboni zuerst, Rest" : "Fixed payouts and bonuses first, remainder"} = ${num(result.netProfit)} − ${num(fixedTotal)} = ${num(result.netProfit - fixedTotal)}`);
  }
  for (const m of active) {
    if (m.fixedPayout != null) {
      lines.push(`${m.handle}: ${de ? "Fixauszahlung" : "fixed payout"} ${num(m.fixedPayout)}`);
    } else if ((m.fixedBonus ?? 0) > 0) {
      const bonus = m.fixedBonus ?? 0;
      lines.push(`${m.handle}: ${num(share(m.id) - bonus)} ${de ? "Anteil am Rest" : "share of remainder"} + ${num(bonus)} ${de ? "Fixbonus" : "fixed bonus"} = ${num(share(m.id))}`);
    } else {
      lines.push(`${m.handle}: ${de ? "Anteil am Rest" : "share of remainder"} ${m.percentShare != null ? `(${num(m.percentShare)} %) ` : ""}= ${num(share(m.id))}`);
    }
  }
  return lines;
}

function distributionSection(ctx: Ctx): ArithmeticSection {
  const { session, result, de, num } = ctx;
  const active = session.members.filter((m) => m.active !== false);
  const share = (id?: string) => result.members.find((m) => m.memberId === id)?.profitShare ?? 0;
  const lines: string[] = [];

  if (session.distributionMode === "EQUAL") {
    lines.push(`${de ? `Gleich verteilt auf ${active.length} aktive Spieler` : `Split equally among ${active.length} active players`}: ${num(result.netProfit)} ÷ ${active.length} = ${num(share(active[0]?.id))}`);
  } else if (session.distributionMode === "PERCENT") {
    for (const m of active) {
      lines.push(`${m.handle}: ${num(result.netProfit)} × ${num(m.percentShare ?? 0)} % = ${num(share(m.id))}`);
    }
  } else {
    lines.push(...adjustableLines(ctx, active));
  }
  for (const m of session.members.filter((x) => x.active === false)) {
    lines.push(`${m.handle}: ${de ? "nicht aktiv, kein Anteil" : "inactive, no share"}`);
  }
  if (result.netProfit < 0) {
    lines.push(de
      ? "Bei Verlust ist der Anteil negativ: Jeder bekommt seine Investments und Kosten erstattet, abzüglich seines Verlustanteils."
      : "With a loss the share is negative: everyone gets their investments and costs back, minus their share of the loss.");
  }
  return { title: de ? "2. Verteilung" : "2. Distribution", lines };
}

function recordedTransfers(ctx: Ctx, memberId: string) {
  const paid = (ctx.session.paidTransfers ?? []).filter((t) => t.kind !== "COST_CONTRIBUTION");
  const outgoing = paid.filter((t) => t.fromMemberId === memberId).reduce((sum, t) => sum + t.netAmount + t.feeAmount, 0);
  const incoming = paid
    .filter((t) => t.toMemberId === memberId)
    .reduce((sum, t) => sum + t.netAmount + (t.kind === "SESSION_CASH" ? 0 : t.feeAmount), 0);
  return { outgoing, incoming };
}

function targetSection(ctx: Ctx): ArithmeticSection {
  const { result, de, num } = ctx;
  const lines = [de
    ? "Ziel = eigene Investments + eigene Kosten + Anteil. Das steht jedem am Ende zu."
    : "Target = own investments + own costs + share. This is what everyone ends up with."];
  for (const m of result.members) {
    const funding = m.fundingAdjustment ?? 0;
    const fundingTerm = funding !== 0 ? ` ${signed(funding, num)} ${de ? "Kostenbeteiligung" : "cost contribution"}` : "";
    lines.push(`${m.handle}: ${num(m.investment)} Investment + ${num(m.expenses)} ${de ? "Kosten" : "costs"}${fundingTerm} ${signed(m.profitShare, num)} ${de ? "Anteil" : "share"} = ${num(m.finalNet)}`);
    if (m.finalNet < 0) {
      lines.push(de
        ? `${m.handle} zahlt ${num(-m.finalNet)} aus eigener Tasche, damit der Verlust fair verteilt ist.`
        : `${m.handle} pays ${num(-m.finalNet)} out of pocket so the loss is shared fairly.`);
    }
  }
  for (const m of result.members) {
    const { outgoing, incoming } = recordedTransfers(ctx, m.memberId);
    const remaining = m.finalNet - m.revenue + outgoing - incoming;
    const paid = outgoing || incoming
      ? `, ${de ? "bereits gezahlt" : "already paid"} ${num(outgoing)}, ${de ? "bereits erhalten" : "already received"} ${num(incoming)}`
      : "";
    const outcome = remaining > 0
      ? `${de ? "bekommt noch" : "still receives"} ${num(remaining)}`
      : remaining < 0
        ? (de ? `gibt ${num(-remaining)} ab` : `pays out ${num(-remaining)}`)
        : (de ? "ist ausgeglichen" : "is settled");
    lines.push(`${m.handle} ${de ? "hält" : "holds"} ${num(m.revenue)}${paid} → ${outcome}`);
  }
  return { title: de ? "3. Ziel je Spieler" : "3. Target per player", lines };
}

function recordedSection(ctx: Ctx): ArithmeticSection | null {
  const { session, de, num, name } = ctx;
  const paid = session.paidTransfers ?? [];
  if (paid.length === 0) {return null;}
  const kinds = {
    SETTLEMENT: {
      label: de ? "Ausgleich / Auszahlung" : "Settlement / payout",
      rule: de ? "zählt als Teil der Auszahlung, die Service Fee trägt der Empfänger." : "counts toward the payout, the recipient bears the service fee.",
    },
    SESSION_CASH: {
      label: de ? "Vorschuss aus Session-Geld" : "Advance from session cash",
      rule: de ? "verschiebt nur, wer das Session-Geld hält. Die Service Fee mindert den Gewinn einmal." : "only moves who holds the session cash. The service fee reduces profit once.",
    },
    COST_CONTRIBUTION: {
      label: de ? "Externe Kostenbeteiligung" : "External cost contribution",
      rule: de ? "eigenes Geld für die Kosten eines anderen. Die Erstattung samt Service Fee geht an den Geldgeber." : "own money toward another player's costs. The reimbursement including the service fee goes to the funder.",
    },
  } as const;
  const lines = [de
    ? "Umsatz ist das Geld, das vor diesen Überweisungen gehalten wurde. Schon im Umsatz enthaltene Zahlungen nicht noch einmal erfassen."
    : "Revenue is the money held before these transfers. Do not record payments already included in revenue again."];
  for (const t of paid) {
    const kind = kinds[t.kind ?? "SETTLEMENT"];
    const label = t.label ? ` (${t.label})` : "";
    lines.push(`${kind.label}${label}: ${name(t.fromMemberId)} → ${name(t.toMemberId)}: Amount ${num(t.netAmount)} + Service Fee ${num(t.feeAmount)} = Total Cost ${num(t.netAmount + t.feeAmount)}`);
  }
  for (const kind of new Set(paid.map((t) => t.kind ?? "SETTLEMENT"))) {
    lines.push(`${kinds[kind].label}: ${kinds[kind].rule}`);
  }
  return { title: de ? "Bereits erfolgte Überweisungen" : "Already recorded transfers", lines };
}

function transferSection(ctx: Ctx): ArithmeticSection {
  const { result, de, num, name } = ctx;
  const t = translations[de ? "de" : "en"];
  const lines: string[] = [];
  const transfers = result.settlementDetails ?? result.suggestedTransfers;
  if (transfers.length === 0) {
    lines.push(de ? "Keine Überweisungen nötig." : "No transfers needed.");
  }
  for (const transfer of transfers) {
    lines.push(`${name(transfer.fromMemberId)} → ${name(transfer.toMemberId)}: Amount ${num(transfer.netAmount)} + Service Fee ${num(transfer.feeAmount)} = Total Cost ${num(transfer.grossAmount)}`);
    if (isSettlementDetail(transfer) && transfer.exactBudget !== transfer.budgetAmount) {
      lines.push(`Budget ${num(transfer.exactBudget)} → ${de ? "ganzzahlig" : "whole"} ${num(transfer.budgetAmount)}, ${de ? "Rest" : "remainder"} ${num(transfer.roundingRemainder)}`);
    }
  }
  if (result.taxRateApplied > 0) {
    const rate = num(result.taxRateApplied * 100);
    lines.push(de
      ? `Service Fee = ${rate} % vom Amount (kommt beim Empfänger an), aufgerundet. Amount + Service Fee = Total Cost passt ins Budget des Absenders.`
      : `Service Fee = ${rate} % of the amount (what the recipient gets), rounded up. Amount + Service Fee = Total Cost fits the sender's budget.`);
  }
  lines.push(de
    ? "Überwiesen werden nur ganze aUEC. Was darunter liegt, bleibt als Rest offen."
    : "Only whole aUEC are transferred. Anything below stays open as a remainder.");
  for (const r of result.unsettledBalances ?? []) {
    lines.push(`${de ? "Rest" : "Residual"} ${name(r.memberId)}: ${r.amount > 0 ? t.stillToReceive : t.excessRetained} ${num(Math.abs(r.amount))}`);
  }
  return { title: de ? "4. Überweisungen" : "4. Transfers", lines };
}

/** Step-by-step calculation in plain language: profit, distribution, targets, transfers. */
export function buildArithmeticSections(session: SessionInput, result: PayslipResult, lang: Lang): ArithmeticSection[] {
  const ctx: Ctx = {
    session,
    result,
    de: lang === "de",
    num: exactNumber(lang),
    name: (id) => result.members.find((m) => m.memberId === id)?.handle ?? id,
  };
  const recorded = recordedSection(ctx);
  return [
    profitSection(ctx),
    distributionSection(ctx),
    targetSection(ctx),
    ...(recorded ? [recorded] : []),
    transferSection(ctx),
  ];
}
