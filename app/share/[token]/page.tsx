import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { translations } from "@/lib/i18n/translations";
import type { Lang } from "@/lib/i18n/translations";
import type { SessionInput, PayslipResult } from "@/lib/types";
import { SummaryStats } from "@/components/SummaryStats";
import { TransfersList } from "@/components/TransfersList";

/**
 * SharePage displays a read-only view of a session payslip accessed via share token.
 *
 * This page:
 * - Fetches session data and calculated payslip from the share API
 * - Displays session name and type
 * - Shows complete payout breakdown with member results table
 * - Displays summary statistics and suggested transfers
 * - Handles invalid/expired tokens with 404 error
 * - Provides read-only access (no edit controls)
 *
 * @param params - Route parameters containing the share token
 */

/**
 * Format a number according to the specified language locale.
 */
function format(amount: number, lang: Lang): string {
  return Math.round(amount).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

/**
 * Response type from GET /api/share/[token]
 */
type ShareApiResponse = {
  session: {
    id: string;
    name: string;
    type: string;
    currency: string | null;
    totalRevenue: number | null;
    distributionMode: string;
    taxEnabled: boolean;
    taxRate: string;
    createdAt: Date;
    members: Array<{
      id: string;
      handle: string;
      role: string | null;
      active: boolean;
      revenue: number;
      investment: number;
      percentShare: string | null;
      fixedBonus: number | null;
      fixedPayout: number | null;
    }>;
    sharedExpenses: Array<{
      id: string;
      label: string;
      amount: number;
      members: Array<{ memberId: string }>;
    }>;
    individualExpense: Array<{
      id: string;
      memberId: string;
      label: string;
      amount: number;
    }>;
  };
  payslip: PayslipResult;
};

/**
 * Fetch session data from the share API
 */
async function fetchShareData(token: string): Promise<ShareApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/share/${token}`;

    const response = await fetch(url, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Share data fetch error:", error);
    return null;
  }
}

/**
 * Generate metadata for the share page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await fetchShareData(token);

  if (!data) {
    return {
      title: "Share Link Not Found - SC Payslip",
    };
  }

  return {
    title: `${data.session.name} - SC Payslip Share`,
    description: `Read-only payslip for ${data.session.name} (${data.session.type})`,
  };
}

/**
 * SharePage component - displays read-only session payslip
 */
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchShareData(token);

  // Handle invalid/expired token
  if (!data) {
    notFound();
  }

  const { session, payslip } = data;

  // Default to English for shared links (could be enhanced with URL param for lang preference)
  const lang: Lang = "en";
  const t = translations[lang];
  const currency = session.currency || "aUEC";

  // Transform session data to SessionInput format for ResultsDisplay
  const sessionInput: SessionInput = {
    id: session.id,
    name: session.name,
    type: session.type as SessionInput["type"],
    currency: session.currency || "aUEC",
    totalRevenue: session.totalRevenue || undefined,
    distributionMode: session.distributionMode as SessionInput["distributionMode"],
    taxEnabled: session.taxEnabled,
    taxRate: Number(session.taxRate),
    members: session.members.map((member) => ({
      id: member.id,
      handle: member.handle,
      role: member.role || undefined,
      active: member.active,
      revenue: member.revenue,
      investment: member.investment,
      percentShare: member.percentShare ? Number(member.percentShare) : null,
      fixedBonus: member.fixedBonus,
      fixedPayout: member.fixedPayout,
    })),
    sharedExpenses: session.sharedExpenses.map((expense) => ({
      id: expense.id,
      label: expense.label,
      amount: expense.amount,
      participantIds: expense.members.map((m) => m.memberId),
    })),
    individualExpenses: session.individualExpense.map((expense) => ({
      id: expense.id,
      memberId: expense.memberId,
      label: expense.label,
      amount: expense.amount,
    })),
  };

  // Calculate total fees by payer
  const feeByPayer = payslip.suggestedTransfers.reduce<Record<string, number>>((acc, tr) => {
    acc[tr.fromMemberId] = (acc[tr.fromMemberId] || 0) + tr.feeAmount;
    return acc;
  }, {});

  // Calculate totals for SummaryStats
  const totalRevenue = sessionInput.members.reduce((sum, m) => sum + (m.revenue ?? 0), 0);
  const totalInvestment = sessionInput.members.reduce((sum, m) => sum + (m.investment ?? 0), 0);
  const totalExpenses = payslip.members.reduce((sum, m) => sum + m.expenses, 0);
  const totalFees = payslip.suggestedTransfers.reduce((sum, tr) => sum + tr.feeAmount, 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-6 min-w-0">
      {/* Header */}
      <div className="glass p-6 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display text-neon">{session.name}</h1>
            <p className="text-white/60 text-sm">
              {session.type} • {new Date(session.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
          <div className="text-sm text-white/60">
            <p>Read-only share link</p>
          </div>
        </div>
      </div>

      {/* Results Display - Read-only */}
      <div className="glass p-6 space-y-4 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xl font-display">{t.results}</h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 min-w-0">
          {/* Left column: Summary stats and member results table */}
          <div className="space-y-4 min-w-0">
            <SummaryStats
              result={payslip}
              totalRevenue={totalRevenue}
              totalInvestment={totalInvestment}
              totalExpenses={totalExpenses}
              totalFees={totalFees}
              translations={t}
              lang={lang}
              currency={currency}
            />

            {/* Members results table */}
            <div className="space-y-2">
              <h4 className="font-semibold text-white/80">{t.members}</h4>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-base">
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
                    {payslip.members.map((m) => {
                      const taxes = feeByPayer[m.memberId] ?? 0;
                      const net = m.finalNet - taxes;
                      const memberExp =
                        sessionInput.individualExpenses
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

          {/* Right column: Transfers list */}
          <TransfersList
            transfers={payslip.suggestedTransfers}
            members={sessionInput.members}
            translations={t}
            lang={lang}
            currency={currency}
          />
        </div>
      </div>
    </main>
  );
}
