"use client";

import { DistributionMode, IndividualExpenseInput, MemberBreakdown, MemberInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  addIndividualExpense: (memberId: string) => void;

  /**
   * Callback to update an individual expense.
   */
  updateIndividualExpense: (id: string, patch: Partial<IndividualExpenseInput>) => void;

  /**
   * Callback to remove an individual expense.
   */
  removeIndividualExpense: (id: string) => void;
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
 * - Taxes: Display of total transfer fees (read-only)
 * - Profit Share: Display of calculated profit share (read-only)
 * - Net After Fees: Display of final payout amount (color-coded: green for positive, red for negative)
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
  resultMember,
  feeByPayer,
  lang,
  t,
  format,
  updateMember,
  removeMember,
  addIndividualExpense,
  updateIndividualExpense,
  removeIndividualExpense
}: MemberRowProps) {
  const exp = individualExpenses.filter((e) => e.memberId === member.id);
  const expSum = exp.reduce((s, e) => s + e.amount, 0);
  const netAfterFees = (resultMember?.finalNet ?? 0) - (feeByPayer[member.id!] ?? 0);

  return (
    <tr key={member.id} className="align-top">
      <td className="py-3 px-3">
        <Input
          className="w-36"
          value={member.handle}
          onChange={(e) => updateMember(member.id!, { handle: e.target.value })}
          aria-label={`${t.handle} ${t.for || "for"} ${member.handle}`}
        />
      </td>
      {showRole && (
        <td className="py-3 px-3">
          <Input
            className="w-32"
            value={member.role ?? ""}
            onChange={(e) => updateMember(member.id!, { role: e.target.value })}
            aria-label={`${t.role} ${t.for || "for"} ${member.handle}`}
          />
        </td>
      )}
      <td className="py-3 px-3 w-[300px]">
        <Input
          type="number"
          className="w-full"
          value={member.revenue ?? 0}
          onChange={(e) => updateMember(member.id!, { revenue: Number(e.target.value) })}
          aria-label={`${t.revenueLabel} ${t.for || "for"} ${member.handle}`}
        />
      </td>
      <td className="py-3 px-3 w-[300px]">
        <Input
          type="number"
          className="w-full"
          value={member.investment ?? 0}
          onChange={(e) => updateMember(member.id!, { investment: Number(e.target.value) })}
          aria-label={`${t.investmentLabel} ${t.for || "for"} ${member.handle}`}
        />
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-col gap-1 min-w-[220px]">
          {exp.map((e) => (
            <div key={e.id} className="flex gap-2 items-center">
              <Input
                className="flex-1"
                value={e.label}
                onChange={(ev) => updateIndividualExpense(e.id!, { label: ev.target.value })}
                aria-label={`${t.expensesLabel} ${t.label || "label"} ${t.for || "for"} ${member.handle}`}
              />
              <Input
                type="number"
                className="w-24"
                value={e.amount}
                onChange={(ev) => updateIndividualExpense(e.id!, { amount: Number(ev.target.value) })}
                aria-label={`${t.expensesLabel} ${t.amount || "amount"} ${t.for || "for"} ${member.handle}`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 h-8 w-8 p-0"
                onClick={() => removeIndividualExpense(e.id!)}
                title={t.remove}
                aria-label={`${t.remove} ${t.expensesLabel} ${t.for || "for"} ${member.handle}`}
              >
                🗑
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => addIndividualExpense(member.id!)}
            aria-label={`${t.addExpense} ${t.for || "for"} ${member.handle}`}
          >
            {t.addExpense}
          </Button>
          <div className="text-xs text-white/60" aria-label={`${t.total || "Total"} ${t.expensesLabel}`}>
            Σ {format(expSum, lang)}
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <span aria-label={`${t.taxesLabel} ${t.for || "for"} ${member.handle}`}>
          {format(feeByPayer[member.id!] ?? 0, lang)}
        </span>
      </td>
      <td className="py-3 px-3">
        <span aria-label={`${t.profitShareCol} ${t.for || "for"} ${member.handle}`}>
          {format(resultMember?.profitShare ?? 0, lang)}
        </span>
      </td>
      <td className="py-3 px-3 font-semibold">
        <span
          className={netAfterFees >= 0 ? "text-neon" : "text-red-400"}
          aria-label={`${t.netAfterFeesCol} ${t.for || "for"} ${member.handle}: ${format(netAfterFees, lang)}`}
        >
          {format(netAfterFees, lang)}
        </span>
      </td>
      <td className="py-3 px-3 w-[160px]">
        <Input
          type="number"
          className="w-full"
          value={member.percentShare ?? 0}
          disabled={distributionMode === "EQUAL"}
          onChange={(e) =>
            updateMember(member.id!, { percentShare: Number(e.target.value) })
          }
          aria-label={`${t.percentShare} ${t.for || "for"} ${member.handle}`}
          aria-disabled={distributionMode === "EQUAL"}
        />
      </td>
      <td className="py-3 px-3 w-[240px]">
        <Input
          type="number"
          className="w-full"
          value={(member as any).fixedBonus ?? 0}
          disabled={distributionMode !== "ADJUSTABLE"}
          onChange={(e) =>
            updateMember(member.id!, { fixedBonus: Number(e.target.value) as any })
          }
          aria-label={`${t.fixedBonus} ${t.for || "for"} ${member.handle}`}
          aria-disabled={distributionMode !== "ADJUSTABLE"}
        />
      </td>
      <td className="py-3 px-3 w-[240px]">
        <Input
          type="number"
          className="w-full"
          value={member.fixedPayout ?? 0}
          disabled={distributionMode !== "ADJUSTABLE"}
          onChange={(e) =>
            updateMember(member.id!, { fixedPayout: Number(e.target.value) })
          }
          aria-label={`${t.fixedPayout} ${t.for || "for"} ${member.handle}`}
          aria-disabled={distributionMode !== "ADJUSTABLE"}
        />
      </td>
      <td className="py-3 px-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 h-8 w-8 p-0"
          onClick={() => removeMember(member.id!)}
          title={t.remove}
          aria-label={`${t.remove} ${t.member || "member"} ${member.handle}`}
        >
          🗑
        </Button>
      </td>
    </tr>
  );
}
