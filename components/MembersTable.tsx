"use client";

import { useMemo } from "react";
import type { DistributionMode, IndividualExpenseInput, MemberInput, PayslipResult } from "@/lib/types";
import { MemberRow } from "./MemberRow";
import { MemberCard } from "./MemberCard";
import { Button } from "@/components/ui/button";

type Lang = "de" | "en";

/**
 * MembersTable component displays the table of all session members with their inputs and results.
 *
 * Renders a table with columns for member details (handle, role), financial inputs (revenue, investment),
 * expenses, results (taxes, profit share, net after fees), and distribution settings (percent share,
 * fixed bonus, fixed payout). Each row is rendered using the MemberRow component.
 *
 * @example
 * ```tsx
 * <MembersTable
 *   members={session.members}
 *   individualExpenses={session.individualExpenses ?? []}
 *   result={result}
 *   showRole={showRole}
 *   distributionMode={session.distributionMode}
 *   feeByPayer={feeByPayer}
 *   lang={lang}
 *   t={translations}
 *   format={formatFunction}
 *   onAddMember={handleAddMember}
 *   updateMember={handleUpdateMember}
 *   removeMember={handleRemoveMember}
 *   addIndividualExpense={handleAddIndividualExpense}
 *   updateIndividualExpense={handleUpdateIndividualExpense}
 *   removeIndividualExpense={handleRemoveIndividualExpense}
 * />
 * ```
 */
interface MembersTableProps {
  /** Array of session members */
  members: MemberInput[];
  /** Array of individual expenses for all members */
  individualExpenses: IndividualExpenseInput[];
  /** Calculated payslip result with member breakdowns */
  result: PayslipResult | null;
  /** Whether to display the role column */
  showRole: boolean;
  /** Current distribution mode (EQUAL, PERCENT, or ADJUSTABLE) */
  distributionMode: DistributionMode;
  /** Map of member IDs to their total fees paid */
  feeByPayer: Record<string, number>;
  /** Current language for formatting */
  lang: Lang;
  /** Translation strings object */
  t: Record<string, string>;
  /** Number formatting function */
  format: (amount: number, lang: Lang) => string;
  /** Callback to add a new member */
  onAddMember: () => void;
  /** Callback to update a member's properties */
  updateMember: (id: string, patch: Partial<MemberInput>) => void;
  /** Callback to remove a member */
  removeMember: (id: string) => void;
  /** Callback to add an individual expense for a member */
  addIndividualExpense: (memberId: string) => void;
  /** Callback to update an individual expense */
  updateIndividualExpense: (id: string, patch: Partial<IndividualExpenseInput>) => void;
  /** Callback to remove an individual expense */
  removeIndividualExpense: (id: string) => void;
}

export function MembersTable({
  members,
  individualExpenses,
  result,
  showRole,
  distributionMode,
  feeByPayer,
  lang,
  t,
  format,
  onAddMember,
  updateMember,
  removeMember,
  addIndividualExpense,
  updateIndividualExpense,
  removeIndividualExpense
}: MembersTableProps) {
  // Pre-compute member lookup Map to eliminate O(n²) find() calls
  const resultMemberMap = useMemo(() => {
    if (!result?.members) {return new Map();}
    return new Map(result.members.map((rm) => [rm.memberId, rm]));
  }, [result]);

  // Pre-compute expenses-by-member Map to eliminate O(n²) filter() calls
  const expensesByMember = useMemo(() => {
    const map = new Map<string, IndividualExpenseInput[]>();
    for (const expense of individualExpenses) {
      const memberId = expense.memberId;
      const existing = map.get(memberId) ?? [];
      map.set(memberId, [...existing, expense]);
    }
    return map;
  }, [individualExpenses]);

  return (
    <div className="glass p-6 space-y-4" role="region" aria-labelledby="members-heading">
      <div className="flex items-center justify-between">
        <h3 id="members-heading" className="text-xl font-display">{t.members}</h3>
        <Button onClick={onAddMember} aria-label={t.addMember}>{t.addMember}</Button>
      </div>

      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-base" aria-label={t.members} aria-describedby="members-heading">
          <caption className="sr-only">{t.members}</caption>
          <thead className="text-white/60 border-b border-white/10">
            <tr className="whitespace-nowrap">
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.handle}</th>
              {showRole && <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.role}</th>}
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.revenueLabel}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.investmentLabel}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.expensesLabel}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.taxesLabel}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.profitShareCol}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.netAfterFeesCol}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.percentShare}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.fixedBonus}</th>
              <th scope="col" className="py-3 px-3 text-left transition-colors duration-200">{t.fixedPayout}</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 [&>tr]:transition-colors [&>tr]:duration-200 [&>tr:hover]:bg-white/[0.02]">
            {members.map((m) => {
              const resultMember = resultMemberMap.get(m.id);
              const memberExpenses = m.id ? (expensesByMember.get(m.id) ?? []) : [];
              return (
                <MemberRow
                  key={m.id}
                  member={m}
                  showRole={showRole}
                  distributionMode={distributionMode}
                  individualExpenses={memberExpenses}
                  resultMember={resultMember}
                  feeByPayer={feeByPayer}
                  lang={lang}
                  t={t}
                  format={format}
                  updateMember={updateMember}
                  removeMember={removeMember}
                  addIndividualExpense={addIndividualExpense}
                  updateIndividualExpense={updateIndividualExpense}
                  removeIndividualExpense={removeIndividualExpense}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - shown on mobile, hidden on desktop */}
      <div className="block md:hidden space-y-4" role="list" aria-label={t.members}>
        {members.map((m) => {
          const resultMember = result?.members.find((x) => x.memberId === m.id);
          return (
            <MemberCard
              key={m.id}
              member={m}
              showRole={showRole}
              distributionMode={distributionMode}
              individualExpenses={individualExpenses}
              resultMember={resultMember}
              feeByPayer={feeByPayer}
              lang={lang}
              t={t}
              format={format}
              updateMember={updateMember}
              removeMember={removeMember}
              addIndividualExpense={addIndividualExpense}
              updateIndividualExpense={updateIndividualExpense}
              removeIndividualExpense={removeIndividualExpense}
            />
          );
        })}
      </div>
    </div>
  );
}
