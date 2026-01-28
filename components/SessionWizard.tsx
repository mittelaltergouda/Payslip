"use client";

import { useMemo, useState } from "react";
import { calculatePayslip } from "@/lib/calc";
import { DistributionMode, IndividualExpenseInput, MemberInput, SessionInput, Transfer } from "@/lib/types";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { UndoRedoControls } from "./UndoRedoControls";

type Lang = "de" | "en";

const tmap: Record<Lang, Record<string, string>> = {
  de: {
    appName: "SC Payout Split",
    heroSubtitle: "Profite und Kosten crew-weise erfassen, fair verteilen und SC-Transfergebühren berücksichtigen.",
    sessionSettings: "Session Einstellungen",
    distribution: "Verteilungsmodus",
    equal: "Gleich (alle bekommen denselben Anteil)",
    percent: "Prozent (Gewichte müssen 100% ergeben)",
    adjustable: "Anpassbar (Fix-Auszahlungen/Bonusse zuerst, Rest gleich oder prozentual)",
    taxToggle: "Transfer Tax berücksichtigen (0,5%)",
    members: "Eingabe",
    addMember: "+ Mitglied",
    handle: "Handle",
    role: "Rolle",
    revenue: "Umsatz",
    investment: "Investment",
    percentShare: "Anteil %",
    fixedBonus: "Fix-Bonus",
    fixedPayout: "Fix-Auszahlung",
    expenses: "Kosten",
    addExpense: "+ Kosten",
    remove: "Entfernen",
    reset: "Reset",
    results: "Payout",
    saleRevenue: "Umsatz",
    netProfit: "Gewinn (Brutto)",
    netAfterTax: "Gewinn (Netto)",
    noTransfers: "Keine Transfers nötig.",
    suggestedTransfers: "Vorgeschlagene Überweisungen",
    receive: "Erhält",
    pay: "Zahlt",
    explanation: "Erklärung",
    showRole: "Rollen anzeigen",
    netAfterFeesCol: "Überweisung",
    profitShareCol: "Gewinnanteil",
    summary: "Gesamt",
    revenueLabel: "Umsatz",
    investmentLabel: "Investment",
    expensesLabel: "Kosten",
    taxesLabel: "Steuern (Fees)",
    netProfitLabel: "Gewinn (Netto)"
  },
  en: {
    appName: "SC Payout Split",
    heroSubtitle: "Track profits and costs per crew, split fairly, and account for SC transfer fees.",
    sessionSettings: "Session Settings",
    distribution: "Distribution Mode",
    equal: "Equal (everyone gets the same share)",
    percent: "Percent (weights must sum to 100%)",
    adjustable: "Adjustable (fixed payouts/bonuses first, remainder equal or by percent)",
    taxToggle: "Include transfer tax (0.5%)",
    members: "Members",
    addMember: "+ Member",
    handle: "Handle",
    role: "Role",
    revenue: "Revenue",
    investment: "Investment",
    percentShare: "Share %",
    fixedBonus: "Fixed Bonus",
    fixedPayout: "Fixed Payout",
    expenses: "Expenses",
    addExpense: "+ Expense",
    remove: "Remove",
    reset: "Reset",
    results: "Payout",
    saleRevenue: "Revenue",
    netProfit: "Profit (Gross)",
    netAfterTax: "Profit (Net)",
    noTransfers: "No transfers required.",
    suggestedTransfers: "Suggested Transfers",
    receive: "Receive",
    pay: "Pay",
    explanation: "Explanation",
    showRole: "Show role field",
    netAfterFeesCol: "Transfer",
    profitShareCol: "Profit Share",
    summary: "Totals",
    revenueLabel: "Revenue",
    investmentLabel: "Investment",
    expensesLabel: "Expenses",
    taxesLabel: "Taxes (fees)",
    netProfitLabel: "Profit (Net)"
  }
};

const rndId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(16).slice(2)}`;

const taxFixed = 0.005;

function format(amount: number, lang: Lang) {
  return Math.round(amount).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

function buildInitialSession(): SessionInput {
  return {
    name: "SC Session",
    type: "TRADING",
    currency: "aUEC",
    distributionMode: "EQUAL",
    taxEnabled: true,
    taxRate: taxFixed,
    members: [
      { id: rndId(), handle: "Pilot", role: "Trader", revenue: 0, investment: 0, active: true },
      { id: rndId(), handle: "Escort", role: "Escort", revenue: 0, investment: 0, active: true }
    ],
    individualExpenses: [],
    sharedExpenses: []
  };
}

type Props = { initialLang?: Lang };

export function SessionWizard({ initialLang = "de" }: Props) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = tmap[lang];
  const { session, updateSession, undo, redo, canUndo, canRedo } = useSessionHistory(buildInitialSession());
  const [error, setError] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(false);

  // Set up keyboard shortcuts for undo/redo
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    enabled: true,
  });

  const result = useMemo(() => {
    try {
      setError(null);
      return calculatePayslip(session);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
      return null;
    }
  }, [session]);

  const feeByPayer =
    result?.suggestedTransfers.reduce<Record<string, number>>((acc, tr) => {
      acc[tr.fromMemberId] = (acc[tr.fromMemberId] ?? 0) + tr.feeAmount;
      return acc;
    }, {}) ?? {};

  const totalRevenue = session.members.reduce((sum, m) => sum + (m.revenue ?? 0), 0);
  const totalInvestment = session.members.reduce((sum, m) => sum + (m.investment ?? 0), 0);
  const totalExpenses = result?.members.reduce((sum, m) => sum + m.expenses, 0) ?? 0;
  const totalFees = result?.suggestedTransfers.reduce((sum, tr) => sum + tr.feeAmount, 0) ?? 0;
  const netAfterTax = (result?.netProfit ?? 0) - totalFees;

  const updateMember = (id: string, patch: Partial<MemberInput>) => {
    updateSession({
      ...session,
      members: session.members.map((m) => (m.id === id ? { ...m, ...patch } : m))
    });
  };

  const addMember = () => {
    updateSession({
      ...session,
      members: [
        ...session.members,
        { id: rndId(), handle: "Crew", role: showRole ? "" : undefined, revenue: 0, investment: 0, active: true }
      ]
    });
  };

  const addIndividualExpense = (memberId: string) => {
    updateSession({
      ...session,
      individualExpenses: [
        ...(session.individualExpenses ?? []),
        { id: rndId(), memberId, label: t.expenses, amount: 0 }
      ]
    });
  };

  const updateIndividualExpense = (id: string, patch: Partial<IndividualExpenseInput>) => {
    updateSession({
      ...session,
      individualExpenses: (session.individualExpenses ?? []).map((exp) =>
        exp.id === id ? { ...exp, ...patch } : exp
      )
    });
  };

  const removeMember = (id: string) => {
    updateSession({
      ...session,
      members: session.members.filter((m) => m.id !== id),
      individualExpenses: (session.individualExpenses ?? []).filter((exp) => exp.memberId !== id)
    });
  };

  const onDistributionChange = (mode: DistributionMode) => {
    if (mode === "PERCENT") {
      const active = session.members.filter((m) => m.active !== false);
      const share = active.length ? 100 / active.length : 0;
      updateSession({
        ...session,
        distributionMode: mode,
        members: session.members.map((m) => (m.active === false ? m : { ...m, percentShare: share }))
      });
    } else {
      updateSession({ ...session, distributionMode: mode });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm uppercase text-neon/80 font-semibold">{t.appName}</p>
          <p className="text-white/70 max-w-2xl text-sm">{t.heroSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-2 rounded-lg ${lang === "de" ? "bg-neon text-night" : "bg-white/10"}`}
            onClick={() => setLang("de")}
          >
            DE
          </button>
          <button
            className={`px-3 py-2 rounded-lg ${lang === "en" ? "bg-neon text-night" : "bg-white/10"}`}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-display">{t.sessionSettings}</h2>
          <div className="flex gap-2">
            <UndoRedoControls
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
            <button className="btn" onClick={() => updateSession(buildInitialSession())}>
              {t.reset}
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t.distribution}</span>
            <select
              className="input"
              value={session.distributionMode}
              onChange={(e) => onDistributionChange(e.target.value as DistributionMode)}
            >
              <option value="EQUAL">{t.equal}</option>
              <option value="PERCENT">{t.percent}</option>
              <option value="ADJUSTABLE">{t.adjustable}</option>
            </select>
            <span className="text-xs text-white/60">
              {t.explanation}:{" "}
              {session.distributionMode === "EQUAL"
                ? t.equal
                : session.distributionMode === "PERCENT"
                  ? t.percent
                  : t.adjustable}
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={session.taxEnabled ?? true}
              onChange={(e) => updateSession({ ...session, taxEnabled: e.target.checked, taxRate: taxFixed })}
            />
            <span className="text-sm text-white/80">{t.taxToggle}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRole}
              onChange={(e) => setShowRole(e.target.checked)}
            />
            <span className="text-sm text-white/80">{t.showRole}</span>
          </label>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display">{t.members}</h3>
          <button className="btn" onClick={addMember}>{t.addMember}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-white/60 border-b border-white/10">
              <tr className="whitespace-nowrap">
                <th className="py-2 px-2 text-left">{t.handle}</th>
                {showRole && <th className="py-2 px-2 text-left">{t.role}</th>}
                <th className="py-2 px-2 text-left">{t.revenueLabel}</th>
                <th className="py-2 px-2 text-left">{t.investmentLabel}</th>
                <th className="py-2 px-2 text-left">{t.expensesLabel}</th>
                <th className="py-2 px-2 text-left">{t.taxesLabel}</th>
                <th className="py-2 px-2 text-left">{t.profitShareCol}</th>
                <th className="py-2 px-2 text-left">{t.netAfterFeesCol}</th>
                <th className="py-2 px-2 text-left">{t.percentShare}</th>
                <th className="py-2 px-2 text-left">{t.fixedBonus}</th>
                <th className="py-2 px-2 text-left">{t.fixedPayout}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {session.members.map((m) => {
                const exp = (session.individualExpenses ?? []).filter((e) => e.memberId === m.id);
                const expSum = exp.reduce((s, e) => s + e.amount, 0);
                const netAfterFees =
                  (result?.members.find((x) => x.memberId === m.id)?.finalNet ?? 0) -
                  (feeByPayer[m.id!] ?? 0);
                return (
                  <tr key={m.id} className="align-top">
                    <td className="py-2 px-2">
                      <input
                        className="input w-36"
                        value={m.handle}
                        onChange={(e) => updateMember(m.id!, { handle: e.target.value })}
                      />
                    </td>
                    {showRole && (
                      <td className="py-2 px-2">
                        <input
                          className="input w-32"
                          value={m.role ?? ""}
                          onChange={(e) => updateMember(m.id!, { role: e.target.value })}
                        />
                      </td>
                    )}
                    <td className="py-2 px-2 w-[300px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={m.revenue ?? 0}
                        onChange={(e) => updateMember(m.id!, { revenue: Number(e.target.value) })}
                      />
                    </td>
                    <td className="py-2 px-2 w-[300px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={m.investment ?? 0}
                        onChange={(e) => updateMember(m.id!, { investment: Number(e.target.value) })}
                      />
                    </td>
                    <td className="py-2 px-2">
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
                              onClick={() =>
                                updateSession({
                                  ...session,
                                  individualExpenses: (session.individualExpenses ?? []).filter(
                                    (ie) => ie.id !== e.id
                                  )
                                })
                              }
                              title={t.remove}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                        <button className="btn text-xs" onClick={() => addIndividualExpense(m.id!)}>
                          {t.addExpense}
                        </button>
                        <div className="text-xs text-white/60">Σ {format(expSum, lang)}</div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {format(feeByPayer[m.id!] ?? 0, lang)}
                    </td>
                    <td className="py-2 px-2">
                      {format(result?.members.find((x) => x.memberId === m.id)?.profitShare ?? 0, lang)}
                    </td>
                    <td className="py-2 px-2 font-semibold">
                      <span className={netAfterFees >= 0 ? "text-neon" : "text-red-400"}>
                        {format(netAfterFees, lang)}
                      </span>
                    </td>
                    <td className="py-2 px-2 w-[160px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={m.percentShare ?? 0}
                        disabled={session.distributionMode === "EQUAL"}
                        onChange={(e) =>
                          updateMember(m.id!, { percentShare: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 w-[240px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={(m as any).fixedBonus ?? 0}
                        disabled={session.distributionMode !== "ADJUSTABLE"}
                        onChange={(e) =>
                          updateMember(m.id!, { fixedBonus: Number(e.target.value) as any })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 w-[240px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={m.fixedPayout ?? 0}
                        disabled={session.distributionMode !== "ADJUSTABLE"}
                        onChange={(e) =>
                          updateMember(m.id!, { fixedPayout: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        className="text-red-400 text-xl leading-none"
                        onClick={() => removeMember(m.id!)}
                        title={t.remove}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display">{t.results}</h3>
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </div>
        </div>
        {result && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-white/80">{t.summary}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-white/70">{t.revenueLabel}</span>
                <span>{format(totalRevenue, lang)} aUEC</span>
                <span className="text-white/70">{t.investmentLabel}</span>
                <span>{format(totalInvestment, lang)} aUEC</span>
                <span className="text-white/70">{t.expensesLabel}</span>
                <span>{format(totalExpenses, lang)} aUEC</span>
                <span className="text-white/70">{t.netProfit}</span>
                <span>{format(result.netProfit, lang)} aUEC</span>
                <span className="text-white/70">{t.taxesLabel}</span>
                <span>{format(totalFees, lang)} aUEC</span>
                <span className="text-white/70">{t.netProfitLabel}</span>
                <span className={netAfterTax >= 0 ? "text-neon font-semibold" : "text-red-400 font-semibold"}>
                  {format(netAfterTax, lang)} aUEC
                </span>
              </div>
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-white/80">{t.members}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-white/60 border-b border-white/10">
                      <tr className="whitespace-nowrap">
                        <th className="py-2 px-2 text-left">{t.handle}</th>
                        <th className="py-2 px-2 text-left">{t.revenueLabel}</th>
                        <th className="py-2 px-2 text-left">{t.investmentLabel}</th>
                        <th className="py-2 px-2 text-left">{t.expensesLabel}</th>
                        <th className="py-2 px-2 text-left">{t.taxesLabel}</th>
                        <th className="py-2 px-2 text-left">{t.profitShareCol}</th>
                        <th className="py-2 px-2 text-left">{t.netAfterFeesCol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {result.members.map((m) => {
                        const taxes = feeByPayer[m.memberId] ?? 0;
                        const net = m.finalNet - taxes;
                        const memberExp =
                          session.individualExpenses
                            ?.filter((e) => e.memberId === m.memberId)
                            .map((e) => `${e.label}: ${format(e.amount, lang)}`)
                            .join(" • ") || "-";
                        return (
                          <tr key={m.memberId}>
                            <td className="py-2 px-2">{m.handle}</td>
                            <td className="py-2 px-2">{format(m.revenue, lang)}</td>
                            <td className="py-2 px-2">{format(m.investment, lang)}</td>
                            <td className="py-2 px-2">
                              {format(m.expenses, lang)}
                              <div className="text-xs text-white/60">{memberExp}</div>
                            </td>
                            <td className="py-2 px-2">{format(taxes, lang)}</td>
                            <td className="py-2 px-2">{format(m.profitShare, lang)}</td>
                            <td className="py-2 px-2 font-semibold">
                              <span className={net >= 0 ? "text-neon" : "text-red-400"}>
                                {format(net, lang)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white/80">{t.suggestedTransfers}</h4>
              </div>
              {result.suggestedTransfers.length === 0 && (
                <p className="text-white/60 text-sm">{t.noTransfers}</p>
              )}
              <div className="space-y-2">
                {result.suggestedTransfers.map((tr: Transfer, idx) => {
                  const from = session.members.find((m) => m.id === tr.fromMemberId)?.handle ?? "-";
                  const to = session.members.find((m) => m.id === tr.toMemberId)?.handle ?? "-";
                  const gross = format(tr.grossAmount, lang);
                  const net = format(tr.netAmount, lang);
                  const fee = format(tr.feeAmount, lang);
                  return (
                    <div key={idx} className="border border-white/10 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span>
                          {from} → {to}
                        </span>
                        <span className="font-semibold">
                          {gross} aUEC <span className="text-white/60 text-xs">(net {net})</span>
                        </span>
                      </div>
                      {tr.feeAmount > 0 && (
                        <p className="text-xs text-white/60">Fee: {fee} aUEC</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
