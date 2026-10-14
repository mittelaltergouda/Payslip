import type { MemberBreakdown, PayslipResult, SessionInput, SettlementDetail, Transfer } from "./types";
import { translations, type Lang } from "./i18n/translations";

/**
 * One line of the calculation. `text` is the plain-language line shown in the
 * UI; label/expression/result split a calculation for tabular output (PDF).
 * Lines without a label are explanatory notes.
 */
export type ArithmeticRow = {
  text: string;
  label?: string;
  expression?: string;
  result?: string;
  /** How the result follows from the expression: "=" (default), "→" or "" (none). */
  joiner?: string;
  emphasis?: boolean;
};

/** One titled block of the step-by-step calculation, shared by UI and PDF. */
export type ArithmeticSection = { title: string; lines: string[]; rows: ArithmeticRow[] };

const note = (text: string): ArithmeticRow => ({ text });

/** A calculation row; the text defaults to "label: expression = result". */
function calc(label: string, expression: string, result: string, text = `${label}: ${expression} = ${result}`, emphasis = false, joiner?: string): ArithmeticRow {
  return { text, label, expression, result, ...(emphasis ? { emphasis } : {}), ...(joiner !== undefined ? { joiner } : {}) };
}

function section(title: string, rows: ArithmeticRow[]): ArithmeticSection {
  return { title, lines: rows.map((row) => row.text), rows };
}

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
  const lines: ArithmeticRow[] = [];
  for (const member of session.members) {
    for (const [label, items] of [[de ? "Umsatz" : "revenue", member.revenues], ["Investments", member.investments]] as const) {
      if (items && items.length > 0) {
        const parts = items.map((item) => `${item.label} ${num(item.amount)}`).join(" + ");
        lines.push(calc(`${member.handle} ${label}`, parts, num(items.reduce((sum, item) => sum + item.amount, 0))));
      }
    }
  }
  const sumLine = (label: string, pick: (m: MemberBreakdown) => number) => {
    const total = result.members.reduce((sum, m) => sum + pick(m), 0);
    lines.push(calc(label, result.members.map((m) => `${m.handle} ${num(pick(m))}`).join(" + "), num(total)));
    return total;
  };
  const revenue = sumLine(de ? "Umsatz" : "Revenue", (m) => m.revenue);
  const investment = sumLine("Investments", (m) => m.investment);
  const expenses = sumLine(de ? "Kosten" : "Costs", (m) => m.expenses);
  if ((session.sharedExpenses ?? []).length > 0) {
    lines.push(note(de
      ? "Gemeinsame Kosten werden gleich auf ihre Teilnehmer verteilt und diesen erstattet."
      : "Shared costs are split equally among their participants and reimbursed to them."));
  }
  const fees = (session.paidTransfers ?? [])
    .filter((t) => t.kind === "SESSION_CASH" || t.kind === "COST_CONTRIBUTION")
    .reduce((sum, t) => sum + t.feeAmount, 0);
  if (fees > 0) {
    const feeLabel = de ? "Bereits bezahlte Service Fees aus Vorschüssen und Kostenbeteiligungen" : "Service fees already paid on advances and cost contributions";
    lines.push(calc(feeLabel, "", num(fees), `${feeLabel}: ${num(fees)}`));
  }
  const label = result.netProfit < 0 ? (de ? "Ergebnis (Verlust)" : "Result (loss)") : (de ? "Gewinn" : "Profit");
  const feeTerm = fees > 0 ? ` − ${num(fees)}` : "";
  const expression = `${num(revenue)} − ${num(investment)} − ${num(expenses)}${feeTerm}`;
  lines.push(calc(label, expression, num(result.netProfit), `${label} = ${expression} = ${num(result.netProfit)}`, true));
  return section(de ? "1. Gewinn" : "1. Profit", lines);
}

function adjustableLines(ctx: Ctx, active: SessionInput["members"]): ArithmeticRow[] {
  const { result, de, num } = ctx;
  const t = translations[de ? "de" : "en"];
  const share = (id?: string) => result.members.find((m) => m.memberId === id)?.profitShare ?? 0;
  const fixedTotal = active.reduce((sum, m) => sum + (m.fixedPayout ?? m.fixedBonus ?? 0), 0);
  const lines: ArithmeticRow[] = [];
  const status = result.fixedAmountsStatus;

  if (status === "SUSPENDED_FOR_LOSS") {
    lines.push(note(t.fixedAmountsSuspended));
    for (const m of active) {
      if (m.fixedPayout != null) {
        const expression = `${de ? "Fixauszahlung" : "fixed payout"} ${num(m.fixedPayout)} ${de ? "ausgesetzt" : "suspended"}`;
        lines.push(calc(m.handle, expression, "0", `${m.handle}: ${expression} → 0`, false, "→"));
      } else {
        lines.push(calc(m.handle, "", num(share(m.id)), `${m.handle}: ${num(share(m.id))}`));
      }
    }
    return lines;
  }
  if (status === "SCALED_TO_PROFIT") {
    const factor = fixedTotal > 0 ? (result.netProfit / fixedTotal) * 100 : 0;
    lines.push(note(t.fixedAmountsScaled));
    lines.push(calc(de ? "Kürzung" : "Reduction", `${num(result.netProfit)} ÷ ${num(fixedTotal)}`, `${num(factor)} % ${de ? "jedes Fixbetrags" : "of every fixed amount"}`));
    for (const m of active) {
      const fixed = m.fixedPayout ?? m.fixedBonus ?? 0;
      const kind = m.fixedPayout != null ? (de ? "Fixauszahlung" : "fixed payout") : (de ? "Fixbonus" : "fixed bonus");
      lines.push(fixed > 0 ? calc(m.handle, `${kind} ${num(fixed)} × ${num(factor)} %`, num(share(m.id))) : calc(m.handle, "", "0", `${m.handle}: 0`));
    }
    return lines;
  }
  if (fixedTotal > 0) {
    const label = de ? "Fixauszahlungen und Fixboni zuerst, Rest" : "Fixed payouts and bonuses first, remainder";
    const expression = `${num(result.netProfit)} − ${num(fixedTotal)}`;
    lines.push(calc(label, expression, num(result.netProfit - fixedTotal), `${label} = ${expression} = ${num(result.netProfit - fixedTotal)}`));
  }
  for (const m of active) {
    if (m.fixedPayout != null) {
      const kind = de ? "Fixauszahlung" : "fixed payout";
      lines.push(calc(m.handle, kind, num(m.fixedPayout), `${m.handle}: ${kind} ${num(m.fixedPayout)}`));
    } else if ((m.fixedBonus ?? 0) > 0) {
      const bonus = m.fixedBonus ?? 0;
      lines.push(calc(m.handle, `${num(share(m.id) - bonus)} ${de ? "Anteil am Rest" : "share of remainder"} + ${num(bonus)} ${de ? "Fixbonus" : "fixed bonus"}`, num(share(m.id))));
    } else {
      lines.push(calc(m.handle, `${de ? "Anteil am Rest" : "share of remainder"}${m.percentShare != null ? ` (${num(m.percentShare)} %)` : ""}`, num(share(m.id))));
    }
  }
  return lines;
}

function distributionSection(ctx: Ctx): ArithmeticSection {
  const { session, result, de, num } = ctx;
  const active = session.members.filter((m) => m.active !== false);
  const share = (id?: string) => result.members.find((m) => m.memberId === id)?.profitShare ?? 0;
  const lines: ArithmeticRow[] = [];

  if (session.distributionMode === "EQUAL") {
    lines.push(calc(de ? `Gleich verteilt auf ${active.length} aktive Spieler` : `Split equally among ${active.length} active players`, `${num(result.netProfit)} ÷ ${active.length}`, num(share(active[0]?.id))));
  } else if (session.distributionMode === "PERCENT") {
    for (const m of active) {
      lines.push(calc(m.handle, `${num(result.netProfit)} × ${num(m.percentShare ?? 0)} %`, num(share(m.id))));
    }
  } else {
    lines.push(...adjustableLines(ctx, active));
  }
  for (const m of session.members.filter((x) => x.active === false)) {
    const inactive = de ? "nicht aktiv, kein Anteil" : "inactive, no share";
    lines.push(calc(m.handle, inactive, "", `${m.handle}: ${inactive}`));
  }
  if (result.netProfit < 0) {
    lines.push(note(de
      ? "Bei Verlust ist der Anteil negativ: Jeder bekommt seine Investments und Kosten erstattet, abzüglich seines Verlustanteils."
      : "With a loss the share is negative: everyone gets their investments and costs back, minus their share of the loss."));
  }
  return section(de ? "2. Verteilung" : "2. Distribution", lines);
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
  const lines = [note(de
    ? "Ziel = eigene Investments + eigene Kosten + Anteil. Das steht jedem am Ende zu."
    : "Target = own investments + own costs + share. This is what everyone ends up with.")];
  for (const m of result.members) {
    const funding = m.fundingAdjustment ?? 0;
    const fundingTerm = funding !== 0 ? ` ${signed(funding, num)} ${de ? "Kostenbeteiligung" : "cost contribution"}` : "";
    lines.push(calc(m.handle, `${num(m.investment)} Investment + ${num(m.expenses)} ${de ? "Kosten" : "costs"}${fundingTerm} ${signed(m.profitShare, num)} ${de ? "Anteil" : "share"}`, num(m.finalNet)));
    if (m.finalNet < 0) {
      lines.push(note(de
        ? `${m.handle} zahlt ${num(-m.finalNet)} aus eigener Tasche, damit der Verlust fair verteilt ist.`
        : `${m.handle} pays ${num(-m.finalNet)} out of pocket so the loss is shared fairly.`));
    }
  }
  lines.push(note(de
    ? "Abgleich mit dem Geld, das jeder gerade hält:"
    : "Compared with the money each player currently holds:"));
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
    const holds = `${de ? "hält" : "holds"} ${num(m.revenue)}${paid}`;
    lines.push(calc(m.handle, holds, outcome, `${m.handle} ${holds} → ${outcome}`, true, "→"));
  }
  return section(de ? "3. Ziel je Spieler" : "3. Target per player", lines);
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
  const lines = [note(de
    ? "Umsatz ist das Geld, das vor diesen Überweisungen gehalten wurde. Schon im Umsatz enthaltene Zahlungen nicht noch einmal erfassen."
    : "Revenue is the money held before these transfers. Do not record payments already included in revenue again.")];
  for (const t of paid) {
    const kind = kinds[t.kind ?? "SETTLEMENT"];
    const label = t.label ? ` (${t.label})` : "";
    const route = `${name(t.fromMemberId)} → ${name(t.toMemberId)}`;
    const expression = `Amount ${num(t.netAmount)} + Service Fee ${num(t.feeAmount)}`;
    const total = `Total Cost ${num(t.netAmount + t.feeAmount)}`;
    lines.push(calc(`${route}\n${kind.label}${label}`, expression, total, `${kind.label}${label}: ${route}: ${expression} = ${total}`));
  }
  for (const kind of new Set(paid.map((t) => t.kind ?? "SETTLEMENT"))) {
    lines.push(note(`${kinds[kind].label}: ${kinds[kind].rule}`));
  }
  return section(de ? "Bereits erfolgte Überweisungen" : "Already recorded transfers", lines);
}

function transferSection(ctx: Ctx): ArithmeticSection {
  const { result, de, num, name } = ctx;
  const lines: ArithmeticRow[] = [];
  const transfers = result.settlementDetails ?? result.suggestedTransfers;
  if (result.taxRateApplied > 0) {
    const rate = num(result.taxRateApplied * 100);
    lines.push(note(de
      ? `Service Fee = ${rate} % vom Amount (kommt beim Empfänger an), aufgerundet. Amount + Service Fee = Total Cost passt ins Budget des Absenders.`
      : `Service Fee = ${rate} % of the amount (what the recipient gets), rounded up. Amount + Service Fee = Total Cost fits the sender's budget.`));
  }
  lines.push(note(de
    ? "Überwiesen werden nur ganze aUEC. Bruchteile darunter bleiben einfach stehen."
    : "Only whole aUEC are transferred. Fractions below that simply stay put."));
  if (transfers.length === 0) {
    lines.push(note(de ? "Keine Überweisungen nötig." : "No transfers needed."));
  }
  for (const transfer of transfers) {
    lines.push(calc(`${name(transfer.fromMemberId)} → ${name(transfer.toMemberId)}`, `Amount ${num(transfer.netAmount)} + Service Fee ${num(transfer.feeAmount)}`, `Total Cost ${num(transfer.grossAmount)}`, undefined, true));
    if (isSettlementDetail(transfer) && transfer.exactBudget !== transfer.budgetAmount) {
      const expression = `${num(transfer.exactBudget)} → ${de ? "ganzzahlig" : "whole"} ${num(transfer.budgetAmount)}`;
      const remainder = `${de ? "Rest" : "remainder"} ${num(transfer.roundingRemainder)}`;
      lines.push(calc("Budget", expression, remainder, `Budget ${expression}, ${remainder}`, false, ""));
    }
  }
  return section(de ? "4. Überweisungen" : "4. Transfers", lines);
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
