"use client";

import { useMemo, useState } from "react";
import { calculatePayslip } from "@/lib/calc";
import { DistributionMode, IndividualExpenseInput, MemberInput, SessionInput } from "@/lib/types";
import { calculateModePreviews } from "@/lib/modePreview";
import { translations, Lang } from "@/lib/i18n/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SessionSettings } from "./SessionSettings";
import { MembersTable } from "./MembersTable";
import { ResultsDisplay } from "./ResultsDisplay";

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

      <ResultsDisplay
        result={result}
        session={session}
        feeByPayer={feeByPayer}
        error={error}
        translations={t}
        lang={lang}
        currency="aUEC"
      />
    </div>
  );
}
