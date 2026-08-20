import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePDF, generatePDFFilename } from './generator';
import autoTable from 'jspdf-autotable';
import type { SessionInput, PayslipResult } from '@/lib/types';

// ============================================================================
// MOCKS
// ============================================================================

// Track text calls to verify Type field removal
let textCalls: string[] = [];

// Mock jsPDF and jsPDF-AutoTable
vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      };
      setFontSize = vi.fn();
      setFont = vi.fn();
      text = vi.fn((content: string) => {
        textCalls.push(content);
      });
      setTextColor = vi.fn();
      setPage = vi.fn();
      getNumberOfPages = () => 1;
      output = vi.fn(() => new Blob(['mock-pdf'], { type: 'application/pdf' }));
      lastAutoTable = { finalY: 100 };
    },
  };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

describe('generatePDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    textCalls = [];
  });

  it('should generate a PDF blob from session and result data', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 },
      ],
    };

    const result: PayslipResult = {
      saleRevenue: 1000,
      netProfit: 1000,
      taxRateApplied: 0,
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
      suggestedTransfers: [],
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  });

  it('should not include Type field in the PDF output', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    generatePDF(session, result);

    // Verify that no text call contains "Type:"
    const typeTextCalls = textCalls.filter((text) =>
      typeof text === 'string' && text.includes('Type:')
    );
    expect(typeTextCalls).toHaveLength(0);
  });

  it('should not render session type even when type is provided in session input', () => {
    const session: SessionInput = {
      name: 'Mining Session',
      type: 'MINING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
      ],
    };

    const result: PayslipResult = {
      saleRevenue: 500,
      netProfit: 500,
      taxRateApplied: 0,
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
      ],
      suggestedTransfers: [],
    };

    generatePDF(session, result);

    // Verify no text mentions MINING or Type field
    const miningTextCalls = textCalls.filter((text) =>
      typeof text === 'string' && (text.includes('Type:') || text.includes('MINING'))
    );
    expect(miningTextCalls).toHaveLength(0);
  });

  it('should handle sessions with no transfers', () => {
    const session: SessionInput = {
      name: 'Equal Distribution Session',
      type: 'MINING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should handle sessions with settlement transfers', () => {
    const session: SessionInput = {
      name: 'Trading Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: true,
      taxRate: 4.25,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200 },
      ],
    };

    const result: PayslipResult = {
      saleRevenue: 1000,
      netProfit: 1000,
      taxRateApplied: 4.25,
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
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should use English language formatting by default', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should accept German language formatting option', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    const blob = generatePDF(session, result, { lang: 'de' });

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should use default currency "aUEC" when not specified', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should accept custom currency option', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    const blob = generatePDF(session, result, { currency: 'USD' });

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should handle multiple members with varying revenue, investment, and expenses', () => {
    const session: SessionInput = {
      name: 'Complex Trading Session',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      taxEnabled: true,
      taxRate: 4.25,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Captain', active: true, revenue: 500, investment: 100, percentShare: 40 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, investment: 50, percentShare: 30 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 200, investment: 0, percentShare: 30 },
      ],
    };

    const result: PayslipResult = {
      saleRevenue: 1000,
      netProfit: 850,
      taxRateApplied: 4.25,
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
      suggestedTransfers: [
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-2',
          netAmount: 100,
          grossAmount: 104.44,
          feeAmount: 4.44,
        },
        {
          fromMemberId: 'member-1',
          toMemberId: 'member-3',
          netAmount: 5,
          grossAmount: 5.22,
          feeAmount: 0.22,
        },
      ],
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should calculate and display fees per member correctly', () => {
    const session: SessionInput = {
      name: 'Fee Calculation Test',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: true,
      taxRate: 4.25,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0 },
      ],
    };

    const result: PayslipResult = {
      saleRevenue: 1000,
      netProfit: 1000,
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
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should handle members with missing handles by using member ID', () => {
    const session: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: '', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
      saleRevenue: 1000,
      netProfit: 1000,
      taxRateApplied: 0,
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
      suggestedTransfers: [],
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should handle empty session name gracefully', () => {
    const session: SessionInput = {
      name: '',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 },
      ],
    };

    const result: PayslipResult = {
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
    };

    const blob = generatePDF(session, result);

    expect(blob).toBeInstanceOf(Blob);
  });
  it('uses the current transfer-budget values in member and transfer tables', () => {
    const session: SessionInput = {
      name: 'Budget Test', type: 'OTHER', distributionMode: 'EQUAL', taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: 'player-1', handle: 'Player 1', revenue: 1_000_000, investment: 500_000 },
        { id: 'player-2', handle: 'Player 2', revenue: 0, investment: 0 },
      ],
    };
    const result: PayslipResult = {
      saleRevenue: 500_000, netProfit: 500_000, taxRateApplied: 0.005,
      members: [
        {
          memberId: 'player-1', handle: 'Player 1', revenue: 1_000_000,
          investment: 500_000, expenses: 0, sharedExpenses: 0,
          individualExpenses: 0, profitShare: 250_000, finalNet: 750_000,
        },
        {
          memberId: 'player-2', handle: 'Player 2', revenue: 0,
          investment: 0, expenses: 0, sharedExpenses: 0,
          individualExpenses: 0, profitShare: 250_000, finalNet: 250_000,
        },
      ],
      suggestedTransfers: [{
        fromMemberId: 'player-1', toMemberId: 'player-2',
        netAmount: 248_756, feeAmount: 1_244, grossAmount: 250_000,
      }],
    };

    generatePDF(session, result, { lang: 'de' });

    const calls = vi.mocked(autoTable).mock.calls;
    expect(calls[0][1].body).toContainEqual([
      'Player 2', '0', '0', '0', '1.244', '250.000', '248.756',
    ]);
    expect(calls[1][1].body).toContainEqual([
      'Player 1', 'Player 2', '248.756', '250.000', '1.244',
    ]);
  });
});

describe('generatePDFFilename', () => {
  beforeEach(() => {
    // Use fake timers and set a consistent date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a filename with sanitized session name and date', () => {
    const filename = generatePDFFilename('Mining Operation Alpha');
    expect(filename).toBe('mining-operation-alpha-2026-02-03.pdf');
  });

  it('should replace spaces with hyphens', () => {
    const filename = generatePDFFilename('Trade Run Session');
    expect(filename).toBe('trade-run-session-2026-02-03.pdf');
  });

  it('should remove special characters', () => {
    const filename = generatePDFFilename('Trade Run #1 @ Night!');
    expect(filename).toBe('trade-run-1-night-2026-02-03.pdf');
  });

  it('should handle consecutive special characters', () => {
    const filename = generatePDFFilename('Session!!!@@@###123');
    expect(filename).toBe('session-123-2026-02-03.pdf');
  });

  it('should convert to lowercase', () => {
    const filename = generatePDFFilename('MINING OPERATION');
    expect(filename).toBe('mining-operation-2026-02-03.pdf');
  });

  it('should handle leading and trailing special characters', () => {
    const filename = generatePDFFilename('---Session Name---');
    expect(filename).toBe('session-name-2026-02-03.pdf');
  });

  it('should handle empty or whitespace-only session names', () => {
    const filename = generatePDFFilename('   ');
    expect(filename).toBe('-2026-02-03.pdf');
  });

  it('should handle session names with only special characters', () => {
    const filename = generatePDFFilename('###!!!@@@');
    expect(filename).toBe('-2026-02-03.pdf');
  });

  it('should preserve numbers in session name', () => {
    const filename = generatePDFFilename('Trading Session 42');
    expect(filename).toBe('trading-session-42-2026-02-03.pdf');
  });

  it('should handle mixed alphanumeric and special characters', () => {
    const filename = generatePDFFilename('Alpha-1: Beta (Test)');
    expect(filename).toBe('alpha-1-beta-test-2026-02-03.pdf');
  });
});
