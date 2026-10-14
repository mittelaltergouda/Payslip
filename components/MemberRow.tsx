"use client";
import { MoneyItemsEditor } from "./MoneyItemsEditor";
import { ExpenseItemsEditor } from "./ExpenseItemsEditor";
import { distributionColumns } from "@/lib/accounting";

import type { DistributionMode, IndividualExpenseInput, MemberBreakdown, MemberInput } from "@/lib/types";
import { NumericInput } from "@/components/ui/numeric-input";

type Lang = "de" | "en";

/**
 * Props for the MemberRow component.
 */
interface MemberRowProps {
  /**
   * The member data to display and edit.
   */
  member: MemberInput;

  /**
   * Whether to show the role field column.
   */
  showRole: boolean;

  /**
   * Current distribution mode (affects which fields are editable).
   */
  distributionMode: DistributionMode;

  /**
   * Array of all individual expenses for filtering by member.
   */
  individualExpenses: IndividualExpenseInput[];

  /**
   * Calculated result data for this member, or undefined if not yet calculated.
   */
  resultMember: MemberBreakdown | undefined;

  /**
   * Map of member IDs to their total transfer fees paid.
   */
  feeByPayer: Record<string, number>;

  /**
   * Current language for number formatting.
   */
  lang: Lang;

  /**
   * Translation strings object.
   */
  t: Record<string, string>;

  /**
   * Number formatting function.
   */
  format: (amount: number, lang: Lang) => string;

  /**
   * Callback to update a member's properties.
   */
  updateMember: (id: string, patch: Partial<MemberInput>) => void;

  /**
   * Callback to remove this member.
   */
  removeMember: (id: string) => void;

  /**
   * Callback to add a new individual expense for this member.
   */
  addIndividualExpense: (memberId: string, init?: Partial<IndividualExpenseInput>) => void;

  /**
   * Callback to update an individual expense.
   */
  updateIndividualExpense: (id: string, patch: Partial<IndividualExpenseInput>) => void;

  /**
   * Callback to remove an individual expense.
   */
  removeIndividualExpense: (id: string) => void;

  /** Zero-based row index within the table (used for Enter-Navigation). */
  rowIndex: number;
}

/**
 * MemberRow component renders a single table row for a member with editable inputs
 * and calculated results.
 *
 * The row displays:
 * - Handle: Editable text input for member name
 * - Role: Optional editable text input (shown if showRole is true)
 * - Revenue: Editable number input for income generated
 * - Investment: Editable number input for capital invested
 * - Expenses: List of editable individual expenses with add/remove controls
 * - Percent Share: Editable in PERCENT and ADJUSTABLE modes
 * - Fixed Bonus: Editable only in ADJUSTABLE mode
 * - Fixed Payout: Editable only in ADJUSTABLE mode
 * - Remove button: Deletes this member from the session
 *
 * @example
 * ```tsx
 * <MemberRow
 *   member={member}
 *   showRole={true}
 *   distributionMode="ADJUSTABLE"
 *   individualExpenses={session.individualExpenses ?? []}
 *   resultMember={result?.members.find(m => m.memberId === member.id)}
 *   feeByPayer={feeByPayer}
 *   lang="en"
 *   t={translations.en}
 *   format={formatNumber}
 *   updateMember={handleUpdateMember}
 *   removeMember={handleRemoveMember}
 *   addIndividualExpense={handleAddExpense}
 *   updateIndividualExpense={handleUpdateExpense}
 *   removeIndividualExpense={handleRemoveExpense}
 * />
 * ```
 */
export function MemberRow({
  member,
  showRole,
  distributionMode,
  individualExpenses,
  resultMember: _resultMember,
  feeByPayer: _feeByPayer,
  lang,
  t,
  format,
  updateMember,
  removeMember,
  addIndividualExpense,
  updateIndividualExpense,
  removeIndividualExpense,
  rowIndex
}: MemberRowProps) {
  const columns = distributionColumns(distributionMode);

  return (
    <tr key={member.id} className="align-top">
      <td className="py-3 px-3">
        <input
          className="input w-36"
          data-nav-col="handle"
          data-nav-row={rowIndex}
          value={member.handle}
          onChange={(e) => updateMember(member.id!, { handle: e.target.value })}
        />
      </td>
      {showRole && (
        <td className="py-3 px-3">
          <input
            className="input w-32"
            data-nav-col="role"
            data-nav-row={rowIndex}
            value={member.role ?? ""}
            onChange={(e) => updateMember(member.id!, { role: e.target.value })}
          />
        </td>
      )}
      <td className="py-3 px-3 w-[300px]">
        <MoneyItemsEditor member={member} kind="revenue" lang={lang} onChange={patch => updateMember(member.id!, patch)} rowIndex={rowIndex} />
      </td>
      <td className="py-3 px-3 w-[300px]">
        <MoneyItemsEditor member={member} kind="investment" lang={lang} onChange={patch => updateMember(member.id!, patch)} rowIndex={rowIndex} />
      </td>
      <td className="py-3 px-3 w-[300px]">
        {/* individualExpenses is pre-filtered by MembersTable */}
        <ExpenseItemsEditor
          memberId={member.id!}
          handle={member.handle}
          expenses={individualExpenses}
          lang={lang}
          t={t}
          format={format}
          addIndividualExpense={addIndividualExpense}
          updateIndividualExpense={updateIndividualExpense}
          removeIndividualExpense={removeIndividualExpense}
          rowIndex={rowIndex}
        />
      </td>
      {columns.percentShare && (
        <td className="py-3 px-3 w-[160px]">
          <NumericInput
            className="input w-full"
            data-nav-col="percentShare"
            data-nav-row={rowIndex}
            value={member.percentShare ?? 0}
            onValueChange={(v) => updateMember(member.id!, { percentShare: v })}
            lang={lang}
          />
        </td>
      )}
      {columns.fixedAmounts && (
        <td className="py-3 px-3 w-[240px]">
          <NumericInput
            className="input w-full"
            data-nav-col="fixedBonus"
            data-nav-row={rowIndex}
            value={(member as any).fixedBonus ?? 0}
            onValueChange={(v) => updateMember(member.id!, { fixedBonus: v as any })}
            lang={lang}
          />
        </td>
      )}
      {columns.fixedAmounts && (
        <td className="py-3 px-3 w-[240px]">
          <NumericInput
            className="input w-full"
            data-nav-col="fixedPayout"
            data-nav-row={rowIndex}
            value={member.fixedPayout ?? 0}
            onValueChange={(v) => updateMember(member.id!, { fixedPayout: v })}
            lang={lang}
          />
        </td>
      )}
      <td className="py-3 px-3 text-right">
        <button
          className="text-red-400 text-xl leading-none"
          onClick={() => removeMember(member.id!)}
          title={t.remove}
        >
          🗑
        </button>
      </td>
    </tr>
  );
}
