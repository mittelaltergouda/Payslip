// ============================================================================
// PDF GENERATOR UTILITY
// ============================================================================
// This module provides PDF generation functionality for payslip sessions.
// It creates professionally formatted PDF documents with session details,
// member breakdowns, and settlement transfers using jsPDF and jsPDF-AutoTable.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SessionInput, PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { format } from "@/lib/format";
import { getMemberPayoutSummaries } from "@/lib/export/payoutSummary";

/**
 * Extended jsPDF type that includes AutoTable properties.
 * jsPDF-AutoTable adds a lastAutoTable property to the jsPDF instance
 * to track the position after rendering a table.
 */
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

/**
 * PDF generation options for customizing output format and styling.
 */
export interface PDFGeneratorOptions {
  /**
   * Language for number formatting and locale-specific separators.
   * Default: "en"
   */
  lang?: Lang;

  /**
   * Currency symbol or code to display with amounts.
   * Default: "aUEC"
   */
  currency?: string;
}

/**
 * Generates a PDF document from session and result data.
 *
 * Creates a professionally formatted A4 PDF containing:
 * - Session header with name, date, and total revenue
 * - Member breakdown table showing handle, revenue, investment, expenses, taxes, profit share, and net payout
 * - Settlement transfers list with from/to member details and amounts (net, gross, fees)
 *
 * The PDF uses a clean, readable layout optimized for A4 paper size with:
 * - 20mm margins on all sides
 * - Professional typography with size hierarchy
 * - Table formatting with alternating row colors for readability
 * - Currency formatting consistent with the application's display format
 *
 * @param session - The session input data containing member and expense information
 * @param result - The calculated payslip result with member breakdowns and transfers
 * @param options - Optional configuration for language and currency formatting
 * @returns A Blob containing the generated PDF document
 *
 * @example
 * ```tsx
 * const session: SessionInput = {
 *   name: "Mining Operation Alpha",
 *   type: "MINING",
 *   members: [...],
 *   // ...other session data
 * };
 * const result = calculatePayslip(session);
 * const pdfBlob = generatePDF(session, result, { lang: 'en', currency: 'aUEC' });
 *
 * // Download the PDF
 * const url = URL.createObjectURL(pdfBlob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = 'payslip.pdf';
 * link.click();
 * URL.revokeObjectURL(url);
 * ```
 */
export function generatePDF(
  session: SessionInput,
  result: PayslipResult,
  options: PDFGeneratorOptions = {}
): Blob {
  const { lang = "en", currency = "aUEC" } = options;

  // Initialize PDF document in A4 portrait format
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Define layout constants
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // ========================================================================
  // HEADER SECTION
  // ========================================================================

  // Session Name - Main Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(session.name || "Payslip", margin, yPosition);
  yPosition += 10;

  // Session Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const sessionDate = new Date().toLocaleDateString(
    lang === "de" ? "de-DE" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  doc.text(`Date: ${sessionDate}`, margin, yPosition);
  yPosition += 5;

  // Total Revenue
  const totalRevenue = session.members.reduce(
    (sum, m) => sum + (m.revenue ?? 0),
    0
  );
  doc.text(
    `Total Revenue: ${format(totalRevenue, lang)} ${currency}`,
    margin,
    yPosition
  );
  yPosition += 10;

  // ========================================================================
  // MEMBER BREAKDOWN TABLE
  // ========================================================================

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Member Breakdown", margin, yPosition);
  yPosition += 7;

  const payoutByMember = new Map(
    getMemberPayoutSummaries(result).map((payout) => [payout.memberId, payout])
  );

  // Build table data
  const memberRows = result.members.map((member) => {
    const payout = payoutByMember.get(member.memberId);
    const taxes = payout?.transferFeesDeducted ?? 0;
    const netAfterFees = payout?.netPayout ?? member.finalNet;

    return [
      member.handle,
      format(member.revenue, lang),
      format(member.investment, lang),
      format(member.expenses, lang),
      format(taxes, lang),
      format(member.profitShare, lang),
      format(netAfterFees, lang),
    ];
  });

  // Generate member breakdown table
  autoTable(doc, {
    startY: yPosition,
    head: [
      [
        "Handle",
        "Revenue",
        "Investment",
        "Expenses",
        "Taxes",
        "Profit Share",
        "Net Payout",
      ],
    ],
    body: memberRows,
    theme: "striped",
    headStyles: {
      fillColor: [26, 43, 60],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Handle
      1: { cellWidth: 22, halign: "right" }, // Revenue
      2: { cellWidth: 22, halign: "right" }, // Investment
      3: { cellWidth: 22, halign: "right" }, // Expenses
      4: { cellWidth: 18, halign: "right" }, // Taxes
      5: { cellWidth: 25, halign: "right" }, // Profit Share
      6: { cellWidth: 25, halign: "right", fontStyle: "bold" }, // Net Payout
    },
    margin: { left: margin, right: margin },
  });

  // Update yPosition after table
  yPosition = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? yPosition;
  yPosition += 10;

  // ========================================================================
  // SETTLEMENT TRANSFERS SECTION
  // ========================================================================

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Settlement Transfers", margin, yPosition);
  yPosition += 7;

  if (result.suggestedTransfers.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("No transfers required.", margin, yPosition);
  } else {
    // Build transfer rows
    const transferRows = result.suggestedTransfers.map((transfer) => {
      // Find member handles
      const fromMember = session.members.find(
        (m) => m.id === transfer.fromMemberId
      );
      const toMember = session.members.find(
        (m) => m.id === transfer.toMemberId
      );

      const fromHandle = fromMember?.handle || transfer.fromMemberId;
      const toHandle = toMember?.handle || transfer.toMemberId;

      return [
        fromHandle,
        toHandle,
        format(transfer.netAmount, lang),
        format(transfer.grossAmount, lang),
        format(transfer.feeAmount, lang),
      ];
    });

    // Generate transfers table
    autoTable(doc, {
      startY: yPosition,
      head: [[
        lang === "de" ? "Von" : "From",
        lang === "de" ? "An" : "To",
        lang === "de" ? "Überweisungsbetrag" : "Amount to Send",
        lang === "de" ? "Gesamtbelastung" : "Total Charged",
        lang === "de" ? "Gebühr" : "Fee",
      ]],
      body: transferRows,
      theme: "striped",
      headStyles: {
        fillColor: [26, 43, 60],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 40 }, // From
        1: { cellWidth: 40 }, // To
        2: { cellWidth: 30, halign: "right" }, // Net Amount
        3: { cellWidth: 30, halign: "right" }, // Gross Amount
        4: { cellWidth: 30, halign: "right" }, // Fee
      },
      margin: { left: margin, right: margin },
    });
  }

  // ========================================================================
  // FOOTER
  // ========================================================================

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by SC Payslip - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Return PDF as Blob
  return doc.output("blob");
}

/**
 * Generates a filename for the PDF export based on session name and current date.
 *
 * Creates a URL-safe filename in the format: "sessionname-YYYY-MM-DD.pdf"
 * - Converts session name to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Appends ISO date format (YYYY-MM-DD)
 * - Adds .pdf extension
 *
 * @param sessionName - The name of the session to include in the filename
 * @returns A sanitized filename string suitable for download
 *
 * @example
 * ```tsx
 * generatePDFFilename("Mining Operation Alpha")
 * // Returns: "mining-operation-alpha-2026-02-03.pdf"
 *
 * generatePDFFilename("Trade Run #1")
 * // Returns: "trade-run-1-2026-02-03.pdf"
 * ```
 */
export function generatePDFFilename(sessionName: string): string {
  const sanitizedName = sessionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  return `${sanitizedName}-${date}.pdf`;
}
