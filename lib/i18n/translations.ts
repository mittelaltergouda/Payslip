/**
 * Supported language codes for the application.
 * - "de": German
 * - "en": English
 */
export type Lang = "de" | "en";

/**
 * Translation strings for all supported languages.
 *
 * This object contains UI text translations for German (de) and English (en).
 * Each language has a complete set of translation keys covering:
 * - App branding and hero text
 * - Session settings and controls
 * - Distribution mode labels and descriptions
 * - Member table headers and labels
 * - Results display labels
 * - Summary and statistics labels
 * - Transfer-related messages
 * - Share functionality labels
 *
 * Usage:
 * ```tsx
 * const t = translations[lang];
 * <h1>{t.appName}</h1>
 * <button>{t.addMember}</button>
 * ```
 *
 * @example
 * ```tsx
 * import { translations, Lang } from "@/lib/i18n/translations";
 *
 * function MyComponent({ lang }: { lang: Lang }) {
 *   const t = translations[lang];
 *   return <h1>{t.appName}</h1>;
 * }
 * ```
 */
export const translations: Record<Lang, Record<string, string>> = {
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
    lowestEarner: "Niedrigster Verdienst",
    sessionName: "Session Name",
    sessionNamePlaceholder: "Session Name eingeben",
    openHistory: "Verlauf öffnen (Strg+O)",
    history: "Verlauf",
    sessionHistory: "Session Verlauf",
    noSessions: "Keine gespeicherten Sessions",
    loadSession: "Laden",
    deleteSession: "Löschen",
    confirmDelete: "Löschen bestätigen",
    cancel: "Abbrechen",
    createdAt: "Erstellt",
    updatedAt: "Aktualisiert",
    sessionSaved: "Session gespeichert",
    sessionLoaded: "Session geladen",
    sessionDeleted: "Session gelöscht",
    exportSuccess: "Sessions exportiert",
    importSuccess: "Importiert",
    sessions: "Sessions",
    share: "Teilen",
    shareSession: "Session teilen",
    copyLink: "Link kopieren",
    linkCopied: "Link kopiert!",
    shareLink: "Sharelink",
    readOnlyMode: "Nur-Lesen-Modus",
    readOnlyNotice: "Diese Session ist schreibgeschützt. Du kannst die Berechnungen ansehen, aber keine Änderungen vornehmen.",
    sharedSession: "Geteilte Session"
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
    lowestEarner: "Lowest Earner",
    sessionName: "Session Name",
    sessionNamePlaceholder: "Enter session name",
    openHistory: "Open History (Ctrl+O)",
    history: "History",
    sessionHistory: "Session History",
    noSessions: "No saved sessions",
    loadSession: "Load",
    deleteSession: "Delete",
    confirmDelete: "Confirm Delete",
    cancel: "Cancel",
    createdAt: "Created",
    updatedAt: "Updated",
    sessionSaved: "Session saved",
    sessionLoaded: "Session loaded",
    sessionDeleted: "Session deleted",
    exportSuccess: "Sessions exported",
    importSuccess: "Imported",
    sessions: "sessions",
    share: "Share",
    shareSession: "Share Session",
    copyLink: "Copy Link",
    linkCopied: "Link copied!",
    shareLink: "Share Link",
    readOnlyMode: "Read-Only Mode",
    readOnlyNotice: "This session is read-only. You can view the calculations but cannot make changes.",
    sharedSession: "Shared Session"
  }
};
