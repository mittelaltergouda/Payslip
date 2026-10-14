import { describe, expect, it } from 'vitest';
import { calculatePayslip } from './calc';
import { buildArithmeticSections, sessionTotals } from './accounting';
import type { SessionInput } from './types';

// The case from the 2026-10-14 review: P2 sent P1 more than P1 was due.
// Every service fee (recorded and suggested) is shared by the crew.
const overpaid: SessionInput = {
  name: 'SC Session', type: 'TRADING', distributionMode: 'EQUAL', taxEnabled: true, taxRate: 0.005,
  members: [
    { id: 'p1', handle: 'Player 1', revenue: 1_000_000, investment: 100_000 },
    { id: 'p2', handle: 'Player 2', revenue: 2_000_000, investment: 200_000 },
  ],
  individualExpenses: [
    { id: 'e1', memberId: 'p1', label: 'Kosten', amount: 10_000 },
    { id: 'e2', memberId: 'p2', label: 'Kosten', amount: 20_000 },
  ],
  paidTransfers: [{ id: 't', fromMemberId: 'p2', toMemberId: 'p1', netAmount: 1_000_000, feeAmount: 5_000, feeIncluded: true, kind: 'SETTLEMENT' }],
};

describe('session totals', () => {
  it('counts the fees of transfers already made, not only the suggested ones', () => {
    const totals = sessionTotals(overpaid, calculatePayslip(overpaid));
    expect(totals).toEqual({
      revenue: 3_000_000,
      investment: 300_000,
      expenses: 30_000,
      grossProfit: 2_670_000,
      serviceFees: 5_000 + 2_781,
      netProfit: 2_662_219,
    });
  });

  it('shares the fees of all transfers equally in EQUAL mode', () => {
    const result = calculatePayslip(overpaid);
    expect(result.paidTransferFees).toBe(5_000);
    expect(result.suggestedTransferFees).toBe(2_781);
    expect(result.members.map((m) => m.serviceFeeShare)).toEqual([3_890.5, 3_890.5]);
    expect(result.members.map((m) => m.profitShare)).toEqual([1_331_109.5, 1_331_109.5]);
  });

  it('net profit equals the cash the crew ends up with minus investments and costs', () => {
    const result = calculatePayslip(overpaid);
    const totals = sessionTotals(overpaid, result);
    // P1 keeps 2,000,000 − 558,890; P2 keeps 995,000 + 556,109.
    const finalCash = (2_000_000 - 558_890) + (995_000 + 556_109);
    expect(totals.netProfit).toBe(finalCash - totals.investment - totals.expenses);
  });

  it('does not count a session-cash fee twice', () => {
    const session: SessionInput = {
      ...overpaid,
      paidTransfers: [{ id: 't', fromMemberId: 'p2', toMemberId: 'p1', netAmount: 100_000, feeAmount: 500, feeIncluded: true, kind: 'SESSION_CASH' }],
    };
    const result = calculatePayslip(session);
    const totals = sessionTotals(session, result);
    const suggestedFees = result.suggestedTransfers.reduce((sum, t) => sum + t.feeAmount, 0);
    expect(totals.grossProfit).toBe(2_670_000);
    expect(totals.serviceFees).toBe(500 + suggestedFees);
    expect(totals.netProfit).toBe(2_670_000 - 500 - suggestedFees);
  });
});

describe('explanation of transfers already made', () => {
  const text = (session: SessionInput) =>
    buildArithmeticSections(session, calculatePayslip(session), 'de').flatMap((s) => s.lines).join('\n');

  it('shows what arrived and charges no fee to the recipient', () => {
    const lines = text(overpaid);
    expect(lines).toContain('Player 1 hält 1.000.000, bereits gezahlt 0, bereits erhalten 1.000.000 → gibt 558.890,5 ab (inkl. Service Fee)');
    expect(lines).toContain('Player 2 hält 2.000.000, bereits gezahlt 1.005.000, bereits erhalten 0 → bekommt noch 556.109,5');
    expect(lines).toContain('Service Fees: 5.000 bereits erfolgte Überweisungen + 2.781 vorgeschlagene Überweisungen = 7.781');
    expect(lines).not.toMatch(/trägt der Empfänger|die Player 1 trägt/);
  });

  it('points out an overpayment that forces a return transfer', () => {
    expect(text(overpaid)).toContain('Player 1 hat mehr erhalten als das eigene Ziel und überweist den Überschuss zurück.');
  });

  it('stays quiet when a recorded transfer did not overshoot', () => {
    const fitting: SessionInput = {
      ...overpaid,
      paidTransfers: [{ id: 't', fromMemberId: 'p2', toMemberId: 'p1', netAmount: 100_000, feeAmount: 500, feeIncluded: true, kind: 'SETTLEMENT' }],
    };
    expect(text(fitting)).not.toContain('mehr erhalten als das eigene Ziel');
  });

  it('uses Betrag and Gesamtkosten in German and keeps Service Fee', () => {
    const lines = text(overpaid);
    expect(lines).toContain('Player 1 → Player 2: Betrag 556.109 + Service Fee 2.781 = Gesamtkosten 558.890');
    expect(lines).not.toMatch(/Amount|Total Cost/);
  });
});
