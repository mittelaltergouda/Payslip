"use client";

import { DistributionMode, IndividualExpenseInput, MemberBreakdown, MemberInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Lang = "de" | "en";

/**
 * Props for the MemberCard component (mobile layout).
 */
interface MemberCardProps {
  /**
   * The member data to display and edit.
   */
  member: MemberInput;

  /**
   * Whether to show the role field.
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
 * MemberCard component renders a single member as a card for mobile view.
 * Displays all the same information as MemberRow but in a vertical, card-based layout
 * optimized for smaller screens.
 *
 * @example
 * ```tsx
 * <MemberCard
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
export function MemberCard({
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
}: MemberCardProps) {
  const exp = individualExpenses.filter((e) => e.memberId === member.id);
  const expSum = exp.reduce((s, e) => s + e.amount, 0);
  const netAfterFees = (resultMember?.finalNet ?? 0) - (feeByPayer[member.id!] ?? 0);

  return (
    <div className="glass p-4 space-y-4">
      {/* Header with Handle and Remove Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <label className="block text-xs text-white/60 mb-1">{t.handle}</label>
          <Input
            value={member.handle}
            onChange={(e) => updateMember(member.id!, { handle: e.target.value })}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 h-8 w-8 p-0 mt-5"
          onClick={() => removeMember(member.id!)}
          title={t.remove}
        >
          🗑
        </Button>
      </div>

      {/* Role (optional) */}
      {showRole && (
        <div>
          <label className="block text-xs text-white/60 mb-1">{t.role}</label>
          <Input
            value={member.role ?? ""}
            onChange={(e) => updateMember(member.id!, { role: e.target.value })}
          />
        </div>
      )}

      {/* Financial Inputs Section */}
      <div className="space-y-3 border-t border-white/10 pt-3">
        <h4 className="text-sm font-semibold text-white/80">{t.financialInputs || "Financial Inputs"}</h4>

        <div>
          <label className="block text-xs text-white/60 mb-1">{t.revenueLabel}</label>
          <Input
            type="number"
            value={member.revenue ?? 0}
            onChange={(e) => updateMember(member.id!, { revenue: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">{t.investmentLabel}</label>
          <Input
            type="number"
            value={member.investment ?? 0}
            onChange={(e) => updateMember(member.id!, { investment: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Expenses Section */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <label className="block text-sm font-semibold text-white/80">{t.expensesLabel}</label>
        {exp.map((e) => (
          <div key={e.id} className="flex gap-2 items-center">
            <Input
              className="flex-1"
              value={e.label}
              onChange={(ev) => updateIndividualExpense(e.id!, { label: ev.target.value })}
            />
            <Input
              type="number"
              className="w-24"
              value={e.amount}
              onChange={(ev) => updateIndividualExpense(e.id!, { amount: Number(ev.target.value) })}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 h-8 w-8 p-0"
              onClick={() => removeIndividualExpense(e.id!)}
              title={t.remove}
            >
              🗑
            </Button>
          </div>
        ))}
        <Button size="sm" onClick={() => addIndividualExpense(member.id!)}>
          {t.addExpense}
        </Button>
        <div className="text-xs text-white/60">Σ {format(expSum, lang)}</div>
      </div>

      {/* Results Section */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <h4 className="text-sm font-semibold text-white/80">{t.results || "Results"}</h4>

        <div className="flex justify-between items-center">
          <span className="text-xs text-white/60">{t.taxesLabel}</span>
          <span className="font-mono">{format(feeByPayer[member.id!] ?? 0, lang)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-white/60">{t.profitShareCol}</span>
          <span className="font-mono">{format(resultMember?.profitShare ?? 0, lang)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-white/60">{t.netAfterFeesCol}</span>
          <span className={`font-mono font-semibold ${netAfterFees >= 0 ? "text-neon" : "text-red-400"}`}>
            {format(netAfterFees, lang)}
          </span>
        </div>
      </div>

      {/* Distribution Settings Section */}
      <div className="space-y-3 border-t border-white/10 pt-3">
        <h4 className="text-sm font-semibold text-white/80">{t.distributionSettings || "Distribution Settings"}</h4>

        <div>
          <label className="block text-xs text-white/60 mb-1">{t.percentShare}</label>
          <Input
            type="number"
            value={member.percentShare ?? 0}
            disabled={distributionMode === "EQUAL"}
            onChange={(e) =>
              updateMember(member.id!, { percentShare: Number(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">{t.fixedBonus}</label>
          <Input
            type="number"
            value={(member as any).fixedBonus ?? 0}
            disabled={distributionMode !== "ADJUSTABLE"}
            onChange={(e) =>
              updateMember(member.id!, { fixedBonus: Number(e.target.value) as any })
            }
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">{t.fixedPayout}</label>
          <Input
            type="number"
            value={member.fixedPayout ?? 0}
            disabled={distributionMode !== "ADJUSTABLE"}
            onChange={(e) =>
              updateMember(member.id!, { fixedPayout: Number(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}
