"use client";

import { DistributionMode, IndividualExpenseInput, MemberInput, PayslipResult } from "@/lib/types";
import { MemberRow } from "./MemberRow";

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
  return (
    <div className="glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display">{t.members}</h3>
        <button className="btn" onClick={onAddMember}>{t.addMember}</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-base">
          <thead className="text-white/60 border-b border-white/10">
            <tr className="whitespace-nowrap">
              <th className="py-3 px-3 text-left">{t.handle}</th>
              {showRole && <th className="py-3 px-3 text-left">{t.role}</th>}
              <th className="py-3 px-3 text-left">{t.revenueLabel}</th>
              <th className="py-3 px-3 text-left">{t.investmentLabel}</th>
              <th className="py-3 px-3 text-left">{t.expensesLabel}</th>
              <th className="py-3 px-3 text-left">{t.taxesLabel}</th>
              <th className="py-3 px-3 text-left">{t.profitShareCol}</th>
              <th className="py-3 px-3 text-left">{t.netAfterFeesCol}</th>
              <th className="py-3 px-3 text-left">{t.percentShare}</th>
              <th className="py-3 px-3 text-left">{t.fixedBonus}</th>
              <th className="py-3 px-3 text-left">{t.fixedPayout}</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {members.map((m) => {
              const resultMember = result?.members.find((x) => x.memberId === m.id);
              return (
                <MemberRow
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
