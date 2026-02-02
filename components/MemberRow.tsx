"use client";

import { DistributionMode, IndividualExpenseInput, MemberBreakdown, MemberInput } from "@/lib/types";

type Lang = "de" | "en";

interface MemberRowProps {
  member: MemberInput;
  showRole: boolean;
  distributionMode: DistributionMode;
  individualExpenses: IndividualExpenseInput[];
  resultMember: MemberBreakdown | undefined;
  feeByPayer: Record<string, number>;
  lang: Lang;
  t: Record<string, string>;
  format: (amount: number, lang: Lang) => string;
  updateMember: (id: string, patch: Partial<MemberInput>) => void;
  removeMember: (id: string) => void;
  addIndividualExpense: (memberId: string) => void;
  updateIndividualExpense: (id: string, patch: Partial<IndividualExpenseInput>) => void;
  removeIndividualExpense: (id: string) => void;
}

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
        <input
          className="input w-36"
          value={member.handle}
          onChange={(e) => updateMember(member.id!, { handle: e.target.value })}
        />
      </td>
      {showRole && (
        <td className="py-3 px-3">
          <input
            className="input w-32"
            value={member.role ?? ""}
            onChange={(e) => updateMember(member.id!, { role: e.target.value })}
          />
        </td>
      )}
      <td className="py-3 px-3 w-[300px]">
        <input
          type="number"
          className="input w-full"
          value={member.revenue ?? 0}
          onChange={(e) => updateMember(member.id!, { revenue: Number(e.target.value) })}
        />
      </td>
      <td className="py-3 px-3 w-[300px]">
        <input
          type="number"
          className="input w-full"
          value={member.investment ?? 0}
          onChange={(e) => updateMember(member.id!, { investment: Number(e.target.value) })}
        />
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-col gap-1 min-w-[220px]">
          {exp.map((e) => (
            <div key={e.id} className="flex gap-2 items-center">
              <input
                className="input flex-1"
                value={e.label}
                onChange={(ev) => updateIndividualExpense(e.id!, { label: ev.target.value })}
              />
              <input
                type="number"
                className="input w-24"
                value={e.amount}
                onChange={(ev) => updateIndividualExpense(e.id!, { amount: Number(ev.target.value) })}
              />
              <button
                className="text-red-400 text-xl leading-none"
                onClick={() => removeIndividualExpense(e.id!)}
                title={t.remove}
              >
                🗑
              </button>
            </div>
          ))}
          <button className="btn text-xs" onClick={() => addIndividualExpense(member.id!)}>
            {t.addExpense}
          </button>
          <div className="text-xs text-white/60">Σ {format(expSum, lang)}</div>
        </div>
      </td>
      <td className="py-3 px-3">
        {format(feeByPayer[member.id!] ?? 0, lang)}
      </td>
      <td className="py-3 px-3">
        {format(resultMember?.profitShare ?? 0, lang)}
      </td>
      <td className="py-3 px-3 font-semibold">
        <span className={netAfterFees >= 0 ? "text-neon" : "text-red-400"}>
          {format(netAfterFees, lang)}
        </span>
      </td>
      <td className="py-3 px-3 w-[160px]">
        <input
          type="number"
          className="input w-full"
          value={member.percentShare ?? 0}
          disabled={distributionMode === "EQUAL"}
          onChange={(e) =>
            updateMember(member.id!, { percentShare: Number(e.target.value) })
          }
        />
      </td>
      <td className="py-3 px-3 w-[240px]">
        <input
          type="number"
          className="input w-full"
          value={(member as any).fixedBonus ?? 0}
          disabled={distributionMode !== "ADJUSTABLE"}
          onChange={(e) =>
            updateMember(member.id!, { fixedBonus: Number(e.target.value) as any })
          }
        />
      </td>
      <td className="py-3 px-3 w-[240px]">
        <input
          type="number"
          className="input w-full"
          value={member.fixedPayout ?? 0}
          disabled={distributionMode !== "ADJUSTABLE"}
          onChange={(e) =>
            updateMember(member.id!, { fixedPayout: Number(e.target.value) })
          }
        />
      </td>
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
