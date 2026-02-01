"use client";

import { useMemo, useState } from "react";
import { calculatePayslip } from "@/lib/calc";
import { DistributionMode, IndividualExpenseInput, MemberInput, SessionInput, Transfer } from "@/lib/types";
import { ModePreview } from "./ModePreview";
import { calculateModePreviews } from "@/lib/modePreview";

type Lang = "de" | "en";

const tmap: Record<Lang, Record<string, string>> = {
  de: {
    appName: "SC Payslip",
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
    netProfitLabel: "Gewinn (Netto)",
    statistics: "Statistiken",
    minPayout: "Min. Auszahlung",
    maxPayout: "Max. Auszahlung",
    avgPayout: "Durchschn. Auszahlung",
    transferCount: "Anzahl Transfers",
    largestTransfer: "Größter Transfer",
    highestEarner: "Höchster Verdienst",
    lowestEarner: "Niedrigster Verdienst"
  },
  en: {
    appName: "SC Payslip",
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
    netProfitLabel: "Profit (Net)",
    statistics: "Statistics",
    minPayout: "Min. Payout",
    maxPayout: "Max. Payout",
    avgPayout: "Avg. Payout",
    transferCount: "Transfer Count",
    largestTransfer: "Largest Transfer",
    highestEarner: "Highest Earner",
    lowestEarner: "Lowest Earner"
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
  const [session, setSession] = useState<SessionInput>(buildInitialSession());
  const updateSession = setSession;
  const [error, setError] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<DistributionMode | null>(null);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const result = useMemo(() => {
    try {
      setError(null);
      return calculatePayslip(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [session]);

  const modePreviews = useMemo(() => calculateModePreviews(session), [session]);

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
    setSession((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...patch } : m))
    }));
  };

  const addMember = () => {
    setSession((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { id: rndId(), handle: "Crew", role: showRole ? "" : undefined, revenue: 0, investment: 0, active: true }
      ]
    }));
  };

  const addIndividualExpense = (memberId: string) => {
    setSession((prev) => ({
      ...prev,
      individualExpenses: [
        ...(prev.individualExpenses ?? []),
        { id: rndId(), memberId, label: t.expenses, amount: 0 }
      ]
    }));
  };

  const updateIndividualExpense = (id: string, patch: Partial<IndividualExpenseInput>) => {
    setSession((prev) => ({
      ...prev,
      individualExpenses: (prev.individualExpenses ?? []).map((exp) =>
        exp.id === id ? { ...exp, ...patch } : exp
      )
    }));
  };

  const removeMember = (id: string) => {
    setSession((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      individualExpenses: (prev.individualExpenses ?? []).filter((exp) => exp.memberId !== id)
    }));
  };

  const onDistributionChange = (mode: DistributionMode) => {
    if (mode === "PERCENT") {
      setSession((prev) => {
        const active = prev.members.filter((m) => m.active !== false);
        const share = active.length ? 100 / active.length : 0;
        return {
          ...prev,
          distributionMode: mode,
          members: prev.members.map((m) => (m.active === false ? m : { ...m, percentShare: share }))
        };
      });
    } else {
      setSession((prev) => ({ ...prev, distributionMode: mode }));
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
          <button className="btn" onClick={() => updateSession(buildInitialSession())}>
            {t.reset}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1 relative">
            <span className="text-sm text-white/70">{t.distribution}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                onBlur={() => {
                  // Delay closing to allow click events on options to fire
                  setTimeout(() => setIsModeDropdownOpen(false), 200);
                }}
                className="input w-full text-left flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={isModeDropdownOpen}
              >
                <span>
                  {session.distributionMode === "EQUAL" ? t.equal :
                   session.distributionMode === "PERCENT" ? t.percent : t.adjustable}
                </span>
                <span className="text-white/50">{isModeDropdownOpen ? "▲" : "▼"}</span>
              </button>

              {isModeDropdownOpen && (
                <div
                  className="absolute z-10 w-full bg-night border border-white/20 rounded-lg mt-1 shadow-lg overflow-hidden"
                  role="listbox"
                >
                  {(['EQUAL', 'PERCENT', 'ADJUSTABLE'] as DistributionMode[]).map(mode => (
                    <div
                      key={mode}
                      role="option"
                      aria-selected={session.distributionMode === mode}
                      onMouseEnter={() => setHoveredMode(mode)}
                      onMouseLeave={() => setHoveredMode(null)}
                      onClick={() => {
                        onDistributionChange(mode);
                        setIsModeDropdownOpen(false);
                        setHoveredMode(null);
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        session.distributionMode === mode
                          ? 'bg-neon/20 text-neon'
                          : 'hover:bg-white/10 text-white/80'
                      }`}
                    >
                      {mode === "EQUAL" ? t.equal :
                       mode === "PERCENT" ? t.percent : t.adjustable}
                    </div>
                  ))}
                </div>
              )}

              {hoveredMode && hoveredMode !== session.distributionMode && (
                <ModePreview
                  mode={hoveredMode}
                  preview={modePreviews[hoveredMode]}
                  visible={true}
                  currency={session.currency}
                  className="top-full mt-2"
                />
              )}
            </div>
            <span className="text-xs text-white/60">
              {t.explanation}:{" "}
              {session.distributionMode === "EQUAL"
                ? t.equal
                : session.distributionMode === "PERCENT"
                  ? t.percent
                  : t.adjustable}
            </span>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={session.taxEnabled ?? true}
              onChange={(e) => setSession((prev) => ({ ...prev, taxEnabled: e.target.checked, taxRate: taxFixed }))}
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
              {session.members.map((m) => {
                const exp = (session.individualExpenses ?? []).filter((e) => e.memberId === m.id);
                const expSum = exp.reduce((s, e) => s + e.amount, 0);
                const netAfterFees =
                  (result?.members.find((x) => x.memberId === m.id)?.finalNet ?? 0) -
                  (feeByPayer[m.id!] ?? 0);
                return (
                  <tr key={m.id} className="align-top">
                    <td className="py-3 px-3">
                      <input
                        className="input w-36"
                        value={m.handle}
                        onChange={(e) => updateMember(m.id!, { handle: e.target.value })}
                      />
                    </td>
                    {showRole && (
                      <td className="py-3 px-3">
                        <input
                          className="input w-32"
                          value={m.role ?? ""}
                          onChange={(e) => updateMember(m.id!, { role: e.target.value })}
                        />
                      </td>
                    )}
                    <td className="py-3 px-3 w-[300px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={m.revenue ?? 0}
                        onChange={(e) => updateMember(m.id!, { revenue: Number(e.target.value) })}
                      />
                    </td>
                    <td className="py-3 px-3 w-[300px]">
                      <input
                        type="number"
                        className="input w-full"
                        value={m.investment ?? 0}
                        onChange={(e) => updateMember(m.id!, { investment: Number(e.target.value) })}
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
                              onClick={() =>
                                setSession((prev) => ({
                                  ...prev,
                                  individualExpenses: (prev.individualExpenses ?? []).filter(
                                    (ie) => ie.id !== e.id
                                  )
                                }))
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
                    <td className="py-3 px-3">
                      {format(feeByPayer[m.id!] ?? 0, lang)}
                    </td>
                    <td className="py-3 px-3">
                      {format(result?.members.find((x) => x.memberId === m.id)?.profitShare ?? 0, lang)}
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
                        value={m.percentShare ?? 0}
                        disabled={session.distributionMode === "EQUAL"}
                        onChange={(e) =>
                          updateMember(m.id!, { percentShare: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="py-3 px-3 w-[240px]">
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
                    <td className="py-3 px-3 w-[240px]">
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
                    <td className="py-3 px-3 text-right">
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
              {result.summaryStatistics && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-white/80">{t.statistics}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <span className="text-white/70">{t.minPayout}</span>
                    <span>{format(result.summaryStatistics.minPayout, lang)} aUEC</span>
                    <span className="text-white/70">{t.maxPayout}</span>
                    <span>{format(result.summaryStatistics.maxPayout, lang)} aUEC</span>
                    <span className="text-white/70">{t.avgPayout}</span>
                    <span>{format(result.summaryStatistics.averagePayout, lang)} aUEC</span>
                    <span className="text-white/70">{t.transferCount}</span>
                    <span>{result.summaryStatistics.totalTransfers}</span>
                    <span className="text-white/70">{t.largestTransfer}</span>
                    <span>{format(result.summaryStatistics.largestTransfer, lang)} aUEC</span>
                    <span className="text-white/70">{t.highestEarner}</span>
                    <span>{result.summaryStatistics.highestEarner}</span>
                    <span className="text-white/70">{t.lowestEarner}</span>
                    <span>{result.summaryStatistics.lowestEarner}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-white/80">{t.members}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-base">
                    <thead className="text-white/60 border-b border-white/10">
                      <tr className="whitespace-nowrap">
                        <th className="py-3 px-3 text-left">{t.handle}</th>
                        <th className="py-3 px-3 text-left">{t.revenueLabel}</th>
                        <th className="py-3 px-3 text-left">{t.investmentLabel}</th>
                        <th className="py-3 px-3 text-left">{t.expensesLabel}</th>
                        <th className="py-3 px-3 text-left">{t.taxesLabel}</th>
                        <th className="py-3 px-3 text-left">{t.profitShareCol}</th>
                        <th className="py-3 px-3 text-left">{t.netAfterFeesCol}</th>
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
                            <td className="py-3 px-3">{m.handle}</td>
                            <td className="py-3 px-3">{format(m.revenue, lang)}</td>
                            <td className="py-3 px-3">{format(m.investment, lang)}</td>
                            <td className="py-3 px-3">
                              {format(m.expenses, lang)}
                              <div className="text-xs text-white/60">{memberExp}</div>
                            </td>
                            <td className="py-3 px-3">{format(taxes, lang)}</td>
                            <td className="py-3 px-3">{format(m.profitShare, lang)}</td>
                            <td className="py-3 px-3 font-semibold">
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
