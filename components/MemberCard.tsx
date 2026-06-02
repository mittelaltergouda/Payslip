"use client";

import type { DistributionMode, IndividualExpenseInput, MemberBreakdown, MemberInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";

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
  resultMember: _resultMember,
  feeByPayer: _feeByPayer,
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

  return (
    <div className="glass p-4 space-y-4" role="article" aria-labelledby={`member-card-${member.id}`}>
      {/* Header with Handle and Remove Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <label className="block text-xs text-white/60 mb-1" id={`member-card-${member.id}`}>{t.handle}</label>
          <Input
            value={member.handle}
            onChange={(e) => updateMember(member.id!, { handle: e.target.value })}
            aria-label={`${t.handle} ${t.for || "for"} ${member.handle}`}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 h-8 w-8 p-0 mt-5"
          onClick={() => removeMember(member.id!)}
          title={t.remove}
          aria-label={`${t.remove} ${t.member || "member"} ${member.handle}`}
        >
          🗑
        </Button>
      </div>

      {/* Role (optional) */}
      {showRole && (
        <div>
          <label className="block text-xs text-white/60 mb-1" htmlFor={`role-${member.id}`}>{t.role}</label>
          <Input
            id={`role-${member.id}`}
            value={member.role ?? ""}
            onChange={(e) => updateMember(member.id!, { role: e.target.value })}
            aria-label={`${t.role} ${t.for || "for"} ${member.handle}`}
          />
        </div>
      )}

      {/* Financial Inputs Section */}
      <div className="space-y-3 border-t border-white/10 pt-3" role="group" aria-labelledby={`financial-inputs-${member.id}`}>
        <h4 id={`financial-inputs-${member.id}`} className="text-sm font-semibold text-white/80">{t.financialInputs || "Financial Inputs"}</h4>

        <div>
          <label className="block text-xs text-white/60 mb-1" htmlFor={`revenue-${member.id}`}>{t.revenueLabel}</label>
          <NumericInput
            id={`revenue-${member.id}`}
            value={member.revenue ?? 0}
            onValueChange={(value) => updateMember(member.id!, { revenue: value })}
            lang={lang}
            aria-label={`${t.revenueLabel} ${t.for || "for"} ${member.handle}`}
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1" htmlFor={`investment-${member.id}`}>{t.investmentLabel}</label>
          <NumericInput
            id={`investment-${member.id}`}
            value={member.investment ?? 0}
            onValueChange={(value) => updateMember(member.id!, { investment: value })}
            lang={lang}
            aria-label={`${t.investmentLabel} ${t.for || "for"} ${member.handle}`}
          />
        </div>
      </div>

      {/* Expenses Section */}
      <div className="space-y-2 border-t border-white/10 pt-3" role="group" aria-labelledby={`expenses-${member.id}`}>
        <label id={`expenses-${member.id}`} className="block text-sm font-semibold text-white/80">{t.expensesLabel}</label>
        {exp.map((e) => (
          <div key={e.id} className="flex gap-2 items-center">
            <Input
              className="flex-1"
              value={e.label}
              onChange={(ev) => updateIndividualExpense(e.id!, { label: ev.target.value })}
              aria-label={`${t.expensesLabel} ${t.label || "label"} ${t.for || "for"} ${member.handle}`}
            />
            <NumericInput
              className="w-24"
              value={e.amount}
              onValueChange={(value) => updateIndividualExpense(e.id!, { amount: value })}
              lang={lang}
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

      {/* Distribution Settings Section */}
      <div className="space-y-3 border-t border-white/10 pt-3" role="group" aria-labelledby={`distribution-settings-${member.id}`}>
        <h4 id={`distribution-settings-${member.id}`} className="text-sm font-semibold text-white/80">{t.distributionSettings || "Distribution Settings"}</h4>

        <div>
          <label className="block text-xs text-white/60 mb-1" htmlFor={`percent-share-${member.id}`}>{t.percentShare}</label>
          <NumericInput
            id={`percent-share-${member.id}`}
            value={member.percentShare ?? 0}
            disabled={distributionMode === "EQUAL"}
            onValueChange={(value) =>
              updateMember(member.id!, { percentShare: value })
            }
            lang={lang}
            aria-label={`${t.percentShare} ${t.for || "for"} ${member.handle}`}
            aria-disabled={distributionMode === "EQUAL"}
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1" htmlFor={`fixed-bonus-${member.id}`}>{t.fixedBonus}</label>
          <NumericInput
            id={`fixed-bonus-${member.id}`}
            value={(member as any).fixedBonus ?? 0}
            disabled={distributionMode !== "ADJUSTABLE"}
            onValueChange={(value) =>
              updateMember(member.id!, { fixedBonus: value as any })
            }
            lang={lang}
            aria-label={`${t.fixedBonus} ${t.for || "for"} ${member.handle}`}
            aria-disabled={distributionMode !== "ADJUSTABLE"}
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1" htmlFor={`fixed-payout-${member.id}`}>{t.fixedPayout}</label>
          <NumericInput
            id={`fixed-payout-${member.id}`}
            value={member.fixedPayout ?? 0}
            disabled={distributionMode !== "ADJUSTABLE"}
            onValueChange={(value) =>
              updateMember(member.id!, { fixedPayout: value })
            }
            lang={lang}
            aria-label={`${t.fixedPayout} ${t.for || "for"} ${member.handle}`}
            aria-disabled={distributionMode !== "ADJUSTABLE"}
          />
        </div>
      </div>
    </div>
  );
}
