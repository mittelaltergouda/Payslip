import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCSV, generateCSVFilename } from './export';
import type { SessionInput, PayslipResult } from '@/lib/types';

// ============================================================================
// TEST DATA HELPERS
// ============================================================================

/**
 * Creates a minimal valid session for testing.
 */
function createTestSession(overrides: Partial<SessionInput> = {}): SessionInput {
  return {
    name: 'Test Session',
    type: 'TRADING',
    distributionMode: 'EQUAL',
    taxEnabled: false,
    members: [
      { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
    ],
    ...overrides,
  };
}

/**
 * Creates a minimal valid result for testing.
 */
function createTestResult(overrides: Partial<PayslipResult> = {}): PayslipResult {
  return {
    saleRevenue: 1000,
    netProfit: 1000,
    taxRateApplied: 0,
    members: [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        revenue: 1000,
        investment: 0,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 1000,
        finalNet: 1000,
      },
    ],
    suggestedTransfers: [],
    ...overrides,
  };
}

// ============================================================================
// TESTS: generateCSV
// ============================================================================

describe('generateCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a CSV string from session and result data', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Member',
          active: true,
          revenue: 500,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 500,
          finalNet: 500,
        },
        {
          memberId: 'member-2',
          handle: 'Bob',
          role: 'Member',
          active: true,
          revenue: 500,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 500,
          finalNet: 500,
        },
      ],
    });

    const csv = generateCSV(session, result);

    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
    expect(csv).toContain('SC Payslip Export');
  });

  it('should not include Type field in the CSV output', () => {
    const session = createTestSession({
      type: 'TRADING',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Verify that the CSV does not contain "Type:" anywhere
    expect(csv).not.toContain('Type:');
    expect(csv).not.toContain('type:');
  });

  it('should not render session type even when type is provided in session input', () => {
    const session = createTestSession({
      name: 'Mining Session',
      type: 'MINING',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Verify no text mentions MINING as a type field
    expect(csv).not.toContain('Type:');
    expect(csv).not.toContain('MINING');
  });

  it('should not include Type field for any session type value', () => {
    const sessionTypes: Array<SessionInput['type']> = [
      'TRADING',
      'PIRACY',
      'SALVAGE',
      'MINING',
      'BOUNTY',
      'OTHER',
    ];

    for (const sessionType of sessionTypes) {
      const session = createTestSession({ type: sessionType });
      const result = createTestResult();

      const csv = generateCSV(session, result);

      expect(csv).not.toContain('Type:');
      expect(csv).not.toContain(sessionType);
    }
  });

  // --------------------------------------------------------------------------
  // LANGUAGE AND FORMATTING TESTS
  // --------------------------------------------------------------------------

  it('should use comma as delimiter for English (default)', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result);

    // English CSV should use comma delimiter
    // Check that the member header row uses commas
    expect(csv).toContain('Handle,Revenue,Investment,Expenses,Taxes,Profit Share,Net Payout');
  });

  it('should use semicolon as delimiter for German', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result, { lang: 'de' });

    // German CSV should use semicolon delimiter
    // Check that the member header row uses semicolons
    expect(csv).toContain('Handle;Umsatz;Investment;Ausgaben;Steuern;Gewinnanteil;Netto Auszahlung');
  });

  it('should use English translations by default', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result);

    expect(csv).toContain('Member Breakdown');
    expect(csv).toContain('Settlement Transfers');
    expect(csv).toContain('Revenue');
    expect(csv).toContain('Profit Share');
    expect(csv).toContain('Net Payout');
  });

  it('should use German translations when lang is "de"', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result, { lang: 'de' });

    expect(csv).toContain('Mitglieder Übersicht');
    expect(csv).toContain('Überweisungen');
    expect(csv).toContain('Umsatz');
    expect(csv).toContain('Gewinnanteil');
    expect(csv).toContain('Netto Auszahlung');
  });

  it('should use default currency "aUEC" when not specified', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result);

    expect(csv).toContain('Currency:,aUEC');
  });

  it('should accept custom currency option', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result, { currency: 'USD' });

    expect(csv).toContain('Currency:,USD');
  });

  it('should format currency correctly with German locale', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result, { lang: 'de', currency: 'EUR' });

    expect(csv).toContain('Währung:;EUR');
  });

  // --------------------------------------------------------------------------
  // MEMBER DATA TESTS
  // --------------------------------------------------------------------------

  it('should include all member data in the breakdown', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Captain', active: true, revenue: 500, investment: 100 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Captain',
          active: true,
          revenue: 500,
          investment: 100,
          expenses: 50,
          sharedExpenses: 50,
          individualExpenses: 0,
          profitShare: 400,
          finalNet: 350,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Member handle should appear
    expect(csv).toContain('Alice');
  });

  it('should handle multiple members with varying data', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Captain', active: true, revenue: 500, investment: 100, percentShare: 40 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, investment: 50, percentShare: 30 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 200, investment: 0, percentShare: 30 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Captain',
          active: true,
          revenue: 500,
          investment: 100,
          expenses: 50,
          sharedExpenses: 50,
          individualExpenses: 0,
          profitShare: 340,
          finalNet: 390,
        },
        {
          memberId: 'member-2',
          handle: 'Bob',
          role: 'Member',
          active: true,
          revenue: 300,
          investment: 50,
          expenses: 50,
          sharedExpenses: 50,
          individualExpenses: 0,
          profitShare: 255,
          finalNet: 255,
        },
        {
          memberId: 'member-3',
          handle: 'Charlie',
          role: 'Member',
          active: true,
          revenue: 200,
          investment: 0,
          expenses: 50,
          sharedExpenses: 50,
          individualExpenses: 0,
          profitShare: 255,
          finalNet: 205,
        },
      ],
    });

    const csv = generateCSV(session, result);

    expect(csv).toContain('Alice');
    expect(csv).toContain('Bob');
    expect(csv).toContain('Charlie');
  });

  it('should handle members with empty handles', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: '', role: 'Member', active: true, revenue: 1000 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: '',
          role: 'Member',
          active: true,
          revenue: 1000,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 1000,
          finalNet: 1000,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Should still generate valid CSV
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // TRANSFER TESTS
  // --------------------------------------------------------------------------

  it('should handle sessions with no transfers', () => {
    const session = createTestSession();

    const result = createTestResult({
      suggestedTransfers: [],
    });

    const csv = generateCSV(session, result);

    expect(csv).toContain('No transfers required');
  });

  it('should show "Keine Überweisungen erforderlich" for no transfers in German', () => {
    const session = createTestSession();

    const result = createTestResult({
      suggestedTransfers: [],
    });

    const csv = generateCSV(session, result, { lang: 'de' });

    expect(csv).toContain('Keine Überweisungen erforderlich');
  });

  it('should include settlement transfers when present', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Member',
          active: true,
          revenue: 800,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 500,
          finalNet: 500,
        },
        {
          memberId: 'member-2',
          handle: 'Bob',
          role: 'Member',
          active: true,
          revenue: 200,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 500,
          finalNet: 500,
        },
      ],
      suggestedTransfers: [
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-2',
          netAmount: 300,
          grossAmount: 313.28,
          feeAmount: 13.28,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Should contain transfer table headers
    expect(csv).toContain('From');
    expect(csv).toContain('To');
    expect(csv).toContain('Amount to Send');
    expect(csv).toContain('Total Charged');
    expect(csv).toContain('Fee');

    // Should contain member handles in transfer
    expect(csv).toContain('Alice');
    expect(csv).toContain('Bob');
  });

  it('should include transfer headers in German', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200 },
      ],
    });

    const result = createTestResult({
      suggestedTransfers: [
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-2',
          netAmount: 300,
          grossAmount: 313.28,
          feeAmount: 13.28,
        },
      ],
    });

    const csv = generateCSV(session, result, { lang: 'de' });

    expect(csv).toContain('Von');
    expect(csv).toContain('An');
    expect(csv).toContain('Überweisungsbetrag');
    expect(csv).toContain('Gesamtbelastung');
    expect(csv).toContain('Gebühr');
  });

  it('should handle multiple transfers', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Captain', active: true, revenue: 700 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 100 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Captain',
          active: true,
          revenue: 700,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 333,
          finalNet: 333,
        },
        {
          memberId: 'member-2',
          handle: 'Bob',
          role: 'Member',
          active: true,
          revenue: 200,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 333,
          finalNet: 333,
        },
        {
          memberId: 'member-3',
          handle: 'Charlie',
          role: 'Member',
          active: true,
          revenue: 100,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 334,
          finalNet: 334,
        },
      ],
      suggestedTransfers: [
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-2',
          netAmount: 133,
          grossAmount: 138.88,
          feeAmount: 5.88,
        },
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-3',
          netAmount: 234,
          grossAmount: 244.42,
          feeAmount: 10.42,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Should contain all members
    expect(csv).toContain('Alice');
    expect(csv).toContain('Bob');
    expect(csv).toContain('Charlie');
  });

  it('should use member ID when handle is not found for transfers', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200 },
      ],
    });

    const result = createTestResult({
      suggestedTransfers: [
        {
          fromMemberId: 'unknown-member-1',
          toMemberId: 'unknown-member-2',
          netAmount: 300,
          grossAmount: 313.28,
          feeAmount: 13.28,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Should fall back to member IDs
    expect(csv).toContain('unknown-member-1');
    expect(csv).toContain('unknown-member-2');
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  it('should handle empty session name gracefully', () => {
    const session = createTestSession({
      name: '',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Should use "Payslip" as fallback
    expect(csv).toContain('Session:,Payslip');
  });

  it('should handle empty session name in German', () => {
    const session = createTestSession({
      name: '',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result, { lang: 'de' });

    expect(csv).toContain('Session:;Payslip');
  });

  it('should properly escape CSV fields with commas', () => {
    const session = createTestSession({
      name: 'Test, Session, Name',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Session name with commas should be quoted
    expect(csv).toContain('"Test, Session, Name"');
  });

  it('should properly escape CSV fields with semicolons in German', () => {
    const session = createTestSession({
      name: 'Test; Session; Name',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result, { lang: 'de' });

    // Session name with semicolons should be quoted in German CSV
    expect(csv).toContain('"Test; Session; Name"');
  });

  it('should properly escape CSV fields with double quotes', () => {
    const session = createTestSession({
      name: 'Test "Session" Name',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Double quotes should be escaped by doubling them
    expect(csv).toContain('"Test ""Session"" Name"');
  });

  it('should properly escape CSV fields with newlines', () => {
    const session = createTestSession({
      name: 'Test\nSession',
    });

    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Newlines should cause the field to be quoted
    expect(csv).toContain('"Test\nSession"');
  });

  it('should handle members with special characters in handles', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice "The Great"', role: 'Member', active: true, revenue: 1000 },
      ],
    });

    const result = createTestResult({
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice "The Great"',
          role: 'Member',
          active: true,
          revenue: 1000,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 1000,
          finalNet: 1000,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Handle with quotes should be properly escaped
    expect(csv).toContain('"Alice ""The Great"""');
  });

  it('should calculate and include fees in member taxes column', () => {
    const session = createTestSession({
      taxEnabled: true,
      taxRate: 4.25,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0 },
      ],
    });

    const result = createTestResult({
      taxRateApplied: 4.25,
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Member',
          active: true,
          revenue: 1000,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 500,
          finalNet: 500,
        },
        {
          memberId: 'member-2',
          handle: 'Bob',
          role: 'Member',
          active: true,
          revenue: 0,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 500,
          finalNet: 500,
        },
      ],
      suggestedTransfers: [
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-2',
          netAmount: 500,
          grossAmount: 522.13,
          feeAmount: 22.13,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // CSV should contain the Taxes column header
    expect(csv).toContain('Taxes');
  });

  it('should handle zero values correctly', () => {
    const session = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 0 },
      ],
    });

    const result = createTestResult({
      saleRevenue: 0,
      netProfit: 0,
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Member',
          active: true,
          revenue: 0,
          investment: 0,
          expenses: 0,
          sharedExpenses: 0,
          individualExpenses: 0,
          profitShare: 0,
          finalNet: 0,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Should generate valid CSV even with zero values
    expect(typeof csv).toBe('string');
    expect(csv).toContain('Alice');
  });

  it('should include date in the header', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result);

    // Should contain Date field
    expect(csv).toContain('Date:');
  });

  it('should include date in German format', () => {
    const session = createTestSession();
    const result = createTestResult();

    const csv = generateCSV(session, result, { lang: 'de' });

    // Should contain Datum field
    expect(csv).toContain('Datum:');
  });

  it('should handle empty members array', () => {
    const session = createTestSession({
      members: [],
    });

    const result = createTestResult({
      members: [],
    });

    const csv = generateCSV(session, result);

    // Should still generate valid CSV with headers
    expect(csv).toContain('SC Payslip Export');
    expect(csv).toContain('Member Breakdown');
    expect(csv).toContain('Handle');
  });

  it('should handle negative values correctly', () => {
    const session = createTestSession();

    const result = createTestResult({
      netProfit: -500,
      members: [
        {
          memberId: 'member-1',
          handle: 'Alice',
          role: 'Member',
          active: true,
          revenue: 500,
          investment: 0,
          expenses: 1000,
          sharedExpenses: 600,
          individualExpenses: 400,
          profitShare: -200,
          finalNet: -700,
        },
      ],
    });

    const csv = generateCSV(session, result);

    // Should handle negative numbers
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('should handle very large numbers', () => {
    const session = createTestSession();

    const result = createTestResult({
      saleRevenue: 999999999,
      netProfit: 888888888,
      members: [
        {
          memberId: 'member-1',
          handle: 'Rich',
          active: true,
          revenue: 999999999,
          investment: 100000000,
          expenses: 50000000,
          sharedExpenses: 30000000,
          individualExpenses: 20000000,
          profitShare: 444444444,
          finalNet: 494444444,
        },
      ],
    });

    const csv = generateCSV(session, result);

    expect(typeof csv).toBe('string');
    expect(csv).toContain('Rich');
  });
});

// ============================================================================
// TESTS: generateCSVFilename
// ============================================================================

describe('generateCSVFilename', () => {
  beforeEach(() => {
    // Use fake timers and set a consistent date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a filename with sanitized session name and date', () => {
    const filename = generateCSVFilename('Mining Operation Alpha');
    expect(filename).toBe('mining-operation-alpha-2026-02-03.csv');
  });

  it('should replace spaces with hyphens', () => {
    const filename = generateCSVFilename('Trade Run Session');
    expect(filename).toBe('trade-run-session-2026-02-03.csv');
  });

  it('should remove special characters', () => {
    const filename = generateCSVFilename('Trade Run #1 @ Night!');
    expect(filename).toBe('trade-run-1-night-2026-02-03.csv');
  });

  it('should handle consecutive special characters', () => {
    const filename = generateCSVFilename('Session!!!@@@###123');
    expect(filename).toBe('session-123-2026-02-03.csv');
  });

  it('should convert to lowercase', () => {
    const filename = generateCSVFilename('MINING OPERATION');
    expect(filename).toBe('mining-operation-2026-02-03.csv');
  });

  it('should handle leading and trailing special characters', () => {
    const filename = generateCSVFilename('---Session Name---');
    expect(filename).toBe('session-name-2026-02-03.csv');
  });

  it('should handle empty or whitespace-only session names', () => {
    const filename = generateCSVFilename('   ');
    expect(filename).toBe('-2026-02-03.csv');
  });

  it('should handle session names with only special characters', () => {
    const filename = generateCSVFilename('###!!!@@@');
    expect(filename).toBe('-2026-02-03.csv');
  });

  it('should preserve numbers in session name', () => {
    const filename = generateCSVFilename('Trading Session 42');
    expect(filename).toBe('trading-session-42-2026-02-03.csv');
  });

  it('should handle mixed alphanumeric and special characters', () => {
    const filename = generateCSVFilename('Alpha-1: Beta (Test)');
    expect(filename).toBe('alpha-1-beta-test-2026-02-03.csv');
  });

  it('should generate .csv extension', () => {
    const filename = generateCSVFilename('Test Session');
    expect(filename).toMatch(/\.csv$/);
  });

  it('should include ISO date format YYYY-MM-DD', () => {
    const filename = generateCSVFilename('Test');
    expect(filename).toContain('2026-02-03');
  });

  it('should handle Unicode characters by removing them', () => {
    const filename = generateCSVFilename('Session äöü test');
    expect(filename).toBe('session-test-2026-02-03.csv');
  });

  it('should handle empty string input', () => {
    const filename = generateCSVFilename('');
    expect(filename).toBe('-2026-02-03.csv');
  });
});
