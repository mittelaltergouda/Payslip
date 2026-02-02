"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { calculatePayslip } from "@/lib/calc";
import type { DistributionMode, IndividualExpenseInput, MemberInput, SessionInput, SavedSession } from "@/lib/types";
import { calculateModePreviews } from "@/lib/modePreview";
import type { Lang } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SessionSettings } from "./SessionSettings";
import { MembersTable } from "./MembersTable";
import { ResultsDisplay } from "./ResultsDisplay";
import { useAutoSave } from "@/hooks/useAutoSave";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { SessionHistory } from "./SessionHistory";
import { SessionActions } from "./SessionActions";
import { useToast } from "./Toast";
import { getAll, deleteSession as deleteStoredSession } from "@/lib/storage/sessionStorage";
import { Button } from "./ui/button";
import { FormField } from "./ui/form-field";

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

  // Session management state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Auto-save and toast hooks
  const { saveStatus, manualSave, error: saveError } = useAutoSave(session, true);
  const { showToast } = useToast();

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

  // Load saved sessions on mount
  useEffect(() => {
    refreshSessionList();
  }, []);

  // Refresh session list from localStorage
  const refreshSessionList = useCallback(() => {
    const sessions = getAll();
    setSavedSessions(sessions);
  }, []);

  // Show toast on save error
  useEffect(() => {
    if (saveError) {
      showToast(saveError, "error");
    }
  }, [saveError, showToast]);

  // Keyboard shortcuts (Ctrl+S for save, Ctrl+O for history)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Manual save
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        void manualSave();
        showToast(t.sessionSaved || "Session saved", "success");
      }
      // Ctrl+O: Open history
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        setIsHistoryOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manualSave, showToast, t.sessionSaved]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved" || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // Handle session load
  const handleLoadSession = useCallback(
    (savedSession: SavedSession) => {
      setSession(savedSession.session);
      setIsHistoryOpen(false);
      showToast(`${t.sessionLoaded || "Session loaded"}: ${savedSession.session.name}`, "success");
    },
    [showToast, t.sessionLoaded]
  );

  // Handle session delete
  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      const result = deleteStoredSession(sessionId);
      if (result.success) {
        showToast(t.sessionDeleted || "Session deleted", "success");
        refreshSessionList();
      } else {
        showToast(result.error || "Failed to delete session", "error");
      }
    },
    [showToast, refreshSessionList, t.sessionDeleted]
  );

  // Handle session name update
  const handleSessionNameChange = (name: string) => {
    setSession((prev) => ({ ...prev, name }));
  };

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
    <div className="space-y-8" role="main" aria-label={t.appName}>
      {/* Header with app name and language switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm uppercase text-neon/80 font-semibold">{t.appName}</p>
          <p className="text-white/70 max-w-2xl text-sm">{t.heroSubtitle}</p>
        </div>
        <LanguageSwitcher lang={lang} onLangChange={setLang} />
      </div>

      {/* Session name and management controls */}
      <div className="glass p-6 space-y-4" role="region" aria-label={t.sessionName || "Session Information"}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <FormField
              id="session-name"
              label={t.sessionName || "Session Name"}
              inputProps={{
                type: "text",
                value: session.name,
                onChange: (e) => handleSessionNameChange(e.target.value),
                placeholder: t.sessionNamePlaceholder || "Enter session name",
              }}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <SaveStatusIndicator status={saveStatus} error={saveError} />

            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsHistoryOpen(true)}
              title={t.openHistory || "Open History (Ctrl+O)"}
              aria-label={t.openHistory || "Open History"}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t.history || "History"}
            </Button>

            <SessionActions
              lang={lang}
              onExportSuccess={() => showToast(t.exportSuccess || "Sessions exported", "success")}
              onExportError={(error) => showToast(error, "error")}
              onImportSuccess={(count) =>
                showToast(
                  `${t.importSuccess || "Imported"} ${count} ${t.sessions || "sessions"}`,
                  "success"
                )
              }
              onImportError={(error) => showToast(error, "error")}
              onSessionsImported={refreshSessionList}
            />
          </div>
        </div>
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

      {/* Session History Sidebar */}
      <SessionHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
        lang={lang}
        translations={{
          sessionHistory: t.sessionHistory || "Session History",
          noSessions: t.noSessions || "No saved sessions",
          loadSession: t.loadSession || "Load",
          deleteSession: t.deleteSession || "Delete",
          confirmDelete: t.confirmDelete || "Confirm Delete",
          cancel: t.cancel || "Cancel",
          createdAt: t.createdAt || "Created",
          updatedAt: t.updatedAt || "Updated",
        }}
      />
    </div>
  );
}
