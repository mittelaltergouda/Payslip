"use client";
import { useState } from "react";
import type { IndividualExpenseInput } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { NumericInput } from "./ui/numeric-input";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = {
  memberId: string;
  handle: string;
  expenses: IndividualExpenseInput[];
  lang: Lang;
  t: Record<string, string>;
  format: (amount: number, lang: Lang) => string;
  addIndividualExpense: (memberId: string, init?: Partial<IndividualExpenseInput>) => void;
  updateIndividualExpense: (id: string, patch: Partial<IndividualExpenseInput>) => void;
  removeIndividualExpense: (id: string) => void;
  rowIndex?: number;
  /** "row" for the desktop table, "card" for the mobile card. */
  variant?: "row" | "card";
};

/**
 * Expense editor with the same pattern as revenue/investment: the first amount
 * is directly editable, "+ Kosten" splits it into labelled positions.
 */
export function ExpenseItemsEditor({
  memberId,
  handle,
  expenses,
  lang,
  t,
  format,
  addIndividualExpense,
  updateIndividualExpense,
  removeIndividualExpense,
  rowIndex,
  variant = "row",
}: Props) {
  const card = variant === "card";
  const [expanded, setExpanded] = useState(false);
  const defaultLabel = t.expenses;
  // A single unlabelled expense is shown as the open amount field, like a revenue without positions.
  const single = expenses.length === 0 || (expenses.length === 1 && expenses[0].label === defaultLabel);
  const showRows = expanded || !single;
  const sum = expenses.reduce((s, e) => s + e.amount, 0);
  const forHandle = `${t.for || "for"} ${handle}`;
  const LabelInput = card ? Input : "input";

  const setSingleAmount = (amount: number) => {
    if (expenses[0]) {
      updateIndividualExpense(expenses[0].id!, { amount });
    } else {
      addIndividualExpense(memberId, { amount });
    }
  };
  const add = () => {
    setExpanded(true);
    addIndividualExpense(memberId);
  };

  return (
    <div className={card ? "space-y-2" : "flex flex-col gap-2 min-w-[220px]"} role="group" aria-label={`${t.expensesLabel} ${handle}`}>
      {!showRows && (
        <NumericInput
          className={card ? undefined : "input w-full"}
          value={expenses[0]?.amount ?? 0}
          lang={lang}
          data-nav-col="expenses"
          data-nav-row={rowIndex}
          aria-label={`${t.expensesLabel} ${handle}`}
          onValueChange={setSingleAmount}
        />
      )}
      {showRows && expenses.map((e, index) => (
        <div key={e.id} className="flex gap-2 items-center">
          <LabelInput
            className={card ? "flex-1" : "input min-w-0 flex-1"}
            value={e.label}
            onChange={(ev) => updateIndividualExpense(e.id!, { label: ev.target.value })}
            aria-label={`${t.expensesLabel} ${t.label || "label"} ${forHandle}`}
          />
          <NumericInput
            className={card ? "w-24" : "input w-28"}
            value={e.amount}
            onValueChange={(value) => updateIndividualExpense(e.id!, { amount: value })}
            lang={lang}
            data-nav-col={index === 0 ? "expenses" : undefined}
            data-nav-row={index === 0 ? rowIndex : undefined}
            aria-label={`${t.expensesLabel} ${t.amount || "amount"} ${forHandle}`}
          />
          {card ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 h-8 w-8 p-0"
              onClick={() => removeIndividualExpense(e.id!)}
              title={t.remove}
              aria-label={`${t.remove} ${t.expensesLabel} ${forHandle}`}
            >
              🗑
            </Button>
          ) : (
            <button
              type="button"
              className="text-red-400"
              onClick={() => removeIndividualExpense(e.id!)}
              title={t.remove}
              aria-label={`${t.remove} ${t.expensesLabel} ${forHandle}`}
            >
              🗑
            </button>
          )}
        </div>
      ))}
      {card ? (
        <Button size="sm" onClick={add} aria-label={`${t.addExpense} ${forHandle}`}>
          {t.addExpense}
        </Button>
      ) : (
        <button type="button" className="btn text-xs self-start" onClick={add}>
          {t.addExpense}
        </button>
      )}
      <div className="text-xs text-white/60" aria-label={`${t.total || "Total"} ${t.expensesLabel}`}>
        Σ {format(sum, lang)}
      </div>
    </div>
  );
}
