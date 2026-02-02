"use client";

import { useMemo, useState } from "react";
import { calculatePayslip } from "@/lib/calc";
import { DistributionMode, IndividualExpenseInput, MemberInput, SessionInput, Transfer } from "@/lib/types";
import { calculateModePreviews } from "@/lib/modePreview";
import { translations, Lang } from "@/lib/i18n/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SessionSettings } from "./SessionSettings";
import { MembersTable } from "./MembersTable";

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
  const t = translations[lang];
  const [session, setSession] = useState<SessionInput>(buildInitialSession());
  const updateSession = setSession;
  const [error, setError] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(false);

  const result = useMemo(() => {
    try {
      setError(null);
      return calculatePayslip(session);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
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

  const removeIndividualExpense = (id: string) => {
    setSession((prev) => ({
      ...prev,
      individualExpenses: (prev.individualExpenses ?? []).filter((exp) => exp.id !== id)
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
        <LanguageSwitcher lang={lang} onLangChange={setLang} />
      </div>

      <SessionSettings
        session={session}
        onSessionUpdate={(updates) => setSession((prev) => ({ ...prev, ...updates }))}
        onDistributionChange={onDistributionChange}
        onReset={() => updateSession(buildInitialSession())}
        showRole={showRole}
        onShowRoleChange={setShowRole}
        translations={t}
        modePreviews={modePreviews}
        taxRate={taxFixed}
      />

      <MembersTable
        members={session.members}
        individualExpenses={session.individualExpenses ?? []}
        result={result}
        showRole={showRole}
        distributionMode={session.distributionMode}
        feeByPayer={feeByPayer}
        lang={lang}
        t={t}
        format={format}
        onAddMember={addMember}
        updateMember={updateMember}
        removeMember={removeMember}
        addIndividualExpense={addIndividualExpense}
        updateIndividualExpense={updateIndividualExpense}
        removeIndividualExpense={removeIndividualExpense}
      />

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
