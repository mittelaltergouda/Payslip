// ============================================================================
// PDF GENERATOR UTILITY
// ============================================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SessionInput, PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { format } from "@/lib/format";
import { getMemberPayoutSummaries } from "@/lib/export/payoutSummary";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export interface PDFGeneratorOptions {
  lang?: Lang;
  currency?: string;
}

const COLORS = {
  ink: [10, 21, 32] as [number, number, number],
  slate: [56, 70, 84] as [number, number, number],
  muted: [105, 119, 132] as [number, number, number],
  line: [218, 225, 230] as [number, number, number],
  soft: [244, 247, 249] as [number, number, number],
  cyan: [18, 181, 178] as [number, number, number],
  green: [22, 128, 91] as [number, number, number],
  red: [190, 55, 55] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const translations = {
  de: {
    created: "Erstellt",
    distribution: "Verteilung",
    equal: "Gleich",
    percent: "Prozentual",
    adjustable: "Anpassbar",
    transferTax: "Transfergebühr",
    enabled: "Aktiv",
    disabled: "Deaktiviert",
    summary: "Gesamtübersicht",
    revenue: "Umsatz",
    investment: "Investment",
    expenses: "Kosten",
    grossResult: "Ergebnis vor Gebühren",
    fees: "Transfergebühren",
    netResult: "Ergebnis nach Gebühren",
    members: "Mitglieder & Auszahlungen",
    member: "Mitglied",
    memberPlural: "Mitglieder",
    handle: "Handle",
    role: "Rolle",
    shareSetting: "Anteil",
    profitShare: "Gewinnanteil",
    netPayout: "Nettoauszahlung",
    costs: "Kostenpositionen",
    kind: "Art",
    label: "Bezeichnung",
    allocatedTo: "Zuordnung",
    amount: "Betrag",
    shared: "Gemeinsam",
    individual: "Individuell",
    allActive: "Alle aktiven Mitglieder",
    transfers: "Vorgeschlagene Überweisungen",
    noTransfers: "Keine Überweisungen erforderlich.",
    from: "Von",
    to: "An",
    amountToSend: "Überweisungsbetrag",
    fee: "Gebühr",
    totalCharged: "Gesamtbelastung",
    page: "Seite",
    of: "von",
  },
  en: {
    created: "Created",
    distribution: "Distribution",
    equal: "Equal",
    percent: "Percentage",
    adjustable: "Adjustable",
    transferTax: "Transfer fee",
    enabled: "Enabled",
    disabled: "Disabled",
    summary: "Session summary",
    revenue: "Revenue",
    investment: "Investment",
    expenses: "Expenses",
    grossResult: "Result before fees",
    fees: "Transfer fees",
    netResult: "Result after fees",
    members: "Members & payouts",
    member: "member",
    memberPlural: "members",
    handle: "Handle",
    role: "Role",
    shareSetting: "Share",
    profitShare: "Profit share",
    netPayout: "Net payout",
    costs: "Expense details",
    kind: "Type",
    label: "Description",
    allocatedTo: "Allocated to",
    amount: "Amount",
    shared: "Shared",
    individual: "Individual",
    allActive: "All active members",
    transfers: "Suggested transfers",
    noTransfers: "No transfers required.",
    from: "From",
    to: "To",
    amountToSend: "Amount to send",
    fee: "Fee",
    totalCharged: "Total charged",
    page: "Page",
    of: "of",
  },
} as const;

function distributionLabel(mode: SessionInput["distributionMode"], lang: Lang): string {
  const t = translations[lang];
  if (mode === "PERCENT") {
    return t.percent;
  }
  if (mode === "ADJUSTABLE") {
    return t.adjustable;
  }
  return t.equal;
}

function shareSetting(member: SessionInput["members"][number], session: SessionInput, lang: Lang): string {
  if (session.distributionMode === "PERCENT") {
    return `${format(member.percentShare ?? 0, lang)} %`;
  }
  if (session.distributionMode === "ADJUSTABLE") {
    const bonus = format(member.fixedBonus ?? 0, lang);
    const payout = format(member.fixedPayout ?? 0, lang);
    return lang === "de" ? `Bonus ${bonus} / Fix ${payout}` : `Bonus ${bonus} / Fixed ${payout}`;
  }
  return "–";
}

/** Generates a polished, print-friendly PDF with all data visible in the app. */
export function generatePDF(
  session: SessionInput,
  result: PayslipResult,
  options: PDFGeneratorOptions = {}
): Blob {
  const { lang = "en", currency = "aUEC" } = options;
  const t = translations[lang];
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdf = doc as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const totalRevenue = session.members.reduce((sum, member) => sum + (member.revenue ?? 0), 0);
  const totalInvestment = session.members.reduce((sum, member) => sum + (member.investment ?? 0), 0);
  const totalExpenses = result.members.reduce((sum, member) => sum + member.expenses, 0);
  const totalFees = result.suggestedTransfers.reduce((sum, transfer) => sum + transfer.feeAmount, 0);
  const netResult = result.netProfit - totalFees;
  const payouts = new Map(
    getMemberPayoutSummaries(result).map((payout) => [payout.memberId, payout])
  );

  const setText = (color: [number, number, number]) => doc.setTextColor(...color);
  const amount = (value: number) => `${format(value, lang)} ${currency}`;

  const drawHeader = () => {
    doc.setFillColor(...COLORS.ink);
    doc.rect(0, 0, pageWidth, 34, "F");
    doc.setFillColor(...COLORS.cyan);
    doc.rect(0, 33, pageWidth, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(COLORS.cyan);
    doc.text("SC PAYSLIP", margin, 10);

    doc.setFontSize(19);
    setText(COLORS.white);
    doc.text(session.name || "Payslip", margin, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText([185, 198, 208]);
    const date = new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`${t.created}: ${date}`, pageWidth - margin, 10, { align: "right" });
    doc.text(currency, pageWidth - margin, 21, { align: "right" });
  };

  const drawSectionTitle = (title: string, y: number): number => {
    doc.setFillColor(...COLORS.cyan);
    doc.roundedRect(margin, y, 2.5, 7, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(COLORS.ink);
    doc.text(title, margin + 6, y + 5.3);
    return y + 10;
  };

  const ensureSpace = (y: number, required: number): number => {
    if (y + required <= pageHeight - 18) {
      return y;
    }
    doc.addPage();
    drawHeader();
    return 44;
  };

  drawHeader();

  // Session configuration
  let y = 41;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(COLORS.slate);
  const taxRate = session.taxEnabled
    ? `${((session.taxRate ?? 0) * 100).toLocaleString(lang === "de" ? "de-DE" : "en-US", {
        maximumFractionDigits: 3,
      })} %`
    : t.disabled;
  doc.text(`${t.distribution}: ${distributionLabel(session.distributionMode, lang)}`, margin, y);
  doc.text(`${t.transferTax}: ${taxRate}`, margin + 67, y);
  const memberCountLabel = session.members.length === 1 ? t.member : t.memberPlural;
  doc.text(`${session.members.length} ${memberCountLabel}`, pageWidth - margin, y, { align: "right" });

  // Summary cards
  y = drawSectionTitle(t.summary, 48);
  const summary = [
    [t.revenue, totalRevenue],
    [t.investment, totalInvestment],
    [t.expenses, totalExpenses],
    [t.grossResult, result.netProfit],
    [t.fees, totalFees],
    [t.netResult, netResult],
  ] as const;
  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardHeight = 17;
  summary.forEach(([label, value], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + col * (cardWidth + cardGap);
    const cardY = y + row * (cardHeight + cardGap);
    doc.setFillColor(...COLORS.soft);
    doc.setDrawColor(...COLORS.line);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setText(COLORS.muted);
    doc.text(label, x + 3, cardY + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(label === t.netResult ? (value >= 0 ? COLORS.green : COLORS.red) : COLORS.ink);
    doc.text(amount(value), x + 3, cardY + 12.5);
  });
  y += cardHeight * 2 + cardGap + 6;

  // Member table
  y = ensureSpace(y, 35);
  y = drawSectionTitle(t.members, y);
  const showRole = session.members.some((member) => Boolean(member.role));
  const showShareSetting = session.distributionMode !== "EQUAL";
  const memberHead: string[] = [t.handle];
  if (showRole) {
    memberHead.push(t.role);
  }
  memberHead.push(t.revenue, t.investment, t.expenses);
  if (showShareSetting) {
    memberHead.push(t.shareSetting);
  }
  memberHead.push(t.profitShare, t.netPayout);

  const memberRows = result.members.map((member) => {
    const input = session.members.find((candidate) => candidate.id === member.memberId);
    const payout = payouts.get(member.memberId);
    const row = [member.handle];
    if (showRole) {
      row.push(input?.role || "–");
    }
    row.push(
      format(member.revenue, lang),
      format(member.investment, lang),
      format(member.expenses, lang)
    );
    if (showShareSetting) {
      row.push(input ? shareSetting(input, session, lang) : "–");
    }
    row.push(format(member.profitShare, lang), format(payout?.netPayout ?? member.finalNet, lang));
    return row;
  });

  autoTable(doc, {
    startY: y,
    head: [memberHead],
    body: memberRows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 7.4, cellPadding: 2.2, textColor: COLORS.slate },
    headStyles: { fillColor: COLORS.ink, textColor: COLORS.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: COLORS.soft },
    columnStyles: { 0: { fontStyle: "bold", textColor: COLORS.ink } },
    margin: { left: margin, right: margin, bottom: 20 },
  });
  y = (pdf.lastAutoTable?.finalY ?? y) + 8;

  // Expense details
  const sharedExpenses = session.sharedExpenses ?? [];
  const individualExpenses = session.individualExpenses ?? [];
  if (sharedExpenses.length > 0 || individualExpenses.length > 0) {
    y = ensureSpace(y, 35);
    y = drawSectionTitle(t.costs, y);
    const memberName = (id: string) => session.members.find((member) => member.id === id)?.handle || id;
    const expenseRows = [
      ...sharedExpenses.map((expense) => [
        t.shared,
        expense.label,
        expense.participantIds?.length
          ? expense.participantIds.map(memberName).join(", ")
          : t.allActive,
        format(expense.amount, lang),
      ]),
      ...individualExpenses.map((expense) => [
        t.individual,
        expense.label,
        memberName(expense.memberId),
        format(expense.amount, lang),
      ]),
    ];
    autoTable(doc, {
      startY: y,
      head: [[t.kind, t.label, t.allocatedTo, t.amount]],
      body: expenseRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 7.5, cellPadding: 2.2, textColor: COLORS.slate },
      headStyles: { fillColor: COLORS.ink, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COLORS.soft },
      columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: margin, right: margin, bottom: 20 },
    });
    y = (pdf.lastAutoTable?.finalY ?? y) + 8;
  }

  // Transfers
  y = ensureSpace(y, 30);
  y = drawSectionTitle(t.transfers, y);
  if (result.suggestedTransfers.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    setText(COLORS.muted);
    doc.text(t.noTransfers, margin, y + 2);
  } else {
    const transferRows = result.suggestedTransfers.map((transfer) => {
      const from = session.members.find((member) => member.id === transfer.fromMemberId)?.handle || transfer.fromMemberId;
      const to = session.members.find((member) => member.id === transfer.toMemberId)?.handle || transfer.toMemberId;
      return [
        from,
        to,
        format(transfer.netAmount, lang),
        format(transfer.feeAmount, lang),
        format(transfer.grossAmount, lang),
      ];
    });
    autoTable(doc, {
      startY: y,
      head: [[t.from, t.to, t.amountToSend, t.fee, t.totalCharged]],
      body: transferRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 7.8, cellPadding: 2.4, textColor: COLORS.slate },
      headStyles: { fillColor: COLORS.ink, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COLORS.soft },
      columnStyles: {
        0: { fontStyle: "bold", textColor: COLORS.ink },
        2: { halign: "right", fontStyle: "bold" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold", textColor: COLORS.ink },
      },
      margin: { left: margin, right: margin, bottom: 20 },
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setText(COLORS.muted);
    doc.text("SC Payslip", margin, pageHeight - 8);
    doc.text(`${t.page} ${page} ${t.of} ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  return doc.output("blob");
}

export function generatePDFFilename(sessionName: string): string {
  const sanitizedName = sessionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}-${date}.pdf`;
}
