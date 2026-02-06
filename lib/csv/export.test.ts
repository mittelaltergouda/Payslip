import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSummaryCSV, generateDetailedCSV, downloadCSV } from './export';
import type { PayslipResult } from '../types';

describe('CSV Export - escapeCSVField (via generateSummaryCSV)', () => {
  const mockResult: PayslipResult = {
    saleRevenue: 1000,
    netProfit: 800,
    taxRateApplied: 4.5,
    members: [
      {
        memberId: '1',
        handle: 'TestUser',
        role: 'Pilot',
        active: true,
        revenue: 1000,
        investment: 0,
        expenses: 200,
        sharedExpenses: 100,
        individualExpenses: 100,
        profitShare: 400,
        finalNet: 400,
      },
    ],
    suggestedTransfers: [],
  };

  it('should handle simple strings without escaping', () => {
    const csv = generateSummaryCSV(mockResult, 'Simple Session', 'aUEC');
    expect(csv).toContain('Simple Session');
    expect(csv).toContain('TestUser');
  });

  it('should escape fields containing commas', () => {
    const resultWithComma: PayslipResult = {
      ...mockResult,
      members: [
        {
          ...mockResult.members[0],
          handle: 'Test, User',
        },
      ],
    };
    const csv = generateSummaryCSV(resultWithComma, 'Session', 'aUEC');
    expect(csv).toContain('"Test, User"');
  });

  it('should escape fields containing double quotes', () => {
    const resultWithQuotes: PayslipResult = {
      ...mockResult,
      members: [
        {
          ...mockResult.members[0],
          handle: 'Test "Quote" User',
        },
      ],
    };
    const csv = generateSummaryCSV(resultWithQuotes, 'Session', 'aUEC');
    expect(csv).toContain('"Test ""Quote"" User"');
  });

  it('should escape fields containing newlines', () => {
    const resultWithNewline: PayslipResult = {
      ...mockResult,
      members: [
        {
          ...mockResult.members[0],
          role: 'Pilot\nGunner',
        },
      ],
    };
    const csv = generateSummaryCSV(resultWithNewline, 'Session', 'aUEC');
    expect(csv).toContain('"Pilot\nGunner"');
  });

  it('should handle empty strings', () => {
    const resultWithEmpty: PayslipResult = {
      ...mockResult,
      members: [
        {
          ...mockResult.members[0],
          role: '',
        },
      ],
    };
    const csv = generateSummaryCSV(resultWithEmpty, 'Session', 'aUEC');
    expect(csv).toContain(',,'); // Empty field between commas
  });

  it('should handle null values', () => {
    const resultWithNull: PayslipResult = {
      ...mockResult,
      members: [
        {
          ...mockResult.members[0],
          role: undefined,
        },
      ],
    };
    const csv = generateSummaryCSV(resultWithNull, 'Session', 'aUEC');
    // Should have empty field for undefined role
    expect(csv).toMatch(/TestUser,,Yes/);
  });

  it('should handle numbers correctly', () => {
    const csv = generateSummaryCSV(mockResult, 'Session', 'aUEC');
    expect(csv).toContain('1000');
    expect(csv).toContain('800');
    expect(csv).toContain('4.5');
  });
});

describe('generateSummaryCSV - Basic Structure', () => {
  const mockResult: PayslipResult = {
    saleRevenue: 10000,
    netProfit: 8000,
    taxRateApplied: 4.5,
    members: [
      {
        memberId: '1',
        handle: 'Alpha',
        role: 'Pilot',
        active: true,
        revenue: 5000,
        investment: 1000,
        expenses: 500,
        sharedExpenses: 300,
        individualExpenses: 200,
        profitShare: 4000,
        finalNet: 4500,
      },
      {
        memberId: '2',
        handle: 'Bravo',
        role: 'Gunner',
        active: false,
        revenue: 3000,
        investment: 500,
        expenses: 300,
        sharedExpenses: 200,
        individualExpenses: 100,
        profitShare: 2000,
        finalNet: 2200,
      },
    ],
    suggestedTransfers: [],
  };

  it('should include session header information', () => {
    const csv = generateSummaryCSV(mockResult, 'Trading Run #1', 'aUEC');

    expect(csv).toContain('Session: Trading Run #1');
    expect(csv).toContain('Currency: aUEC');
    expect(csv).toContain('Total Revenue: 10000');
    expect(csv).toContain('Net Profit: 8000');
    expect(csv).toContain('Tax Rate: 4.5%');
  });

  it('should use default currency when not specified', () => {
    const csv = generateSummaryCSV(mockResult, 'Trading Run #1');
    expect(csv).toContain('Currency: aUEC');
  });

  it('should include column headers', () => {
    const csv = generateSummaryCSV(mockResult, 'Session', 'aUEC');

    expect(csv).toContain('Handle');
    expect(csv).toContain('Role');
    expect(csv).toContain('Active');
    expect(csv).toContain('Revenue');
    expect(csv).toContain('Investment');
    expect(csv).toContain('Total Expenses');
    expect(csv).toContain('Shared Expenses');
    expect(csv).toContain('Individual Expenses');
    expect(csv).toContain('Profit Share');
    expect(csv).toContain('Final Net');
  });

  it('should include all member data rows', () => {
    const csv = generateSummaryCSV(mockResult, 'Session', 'aUEC');

    // Check first member
    expect(csv).toContain('Alpha');
    expect(csv).toContain('Pilot');
    expect(csv).toMatch(/Alpha,Pilot,Yes,5000,1000,500,300,200,4000,4500/);

    // Check second member
    expect(csv).toContain('Bravo');
    expect(csv).toContain('Gunner');
    expect(csv).toMatch(/Bravo,Gunner,No,3000,500,300,200,100,2000,2200/);
  });

  it('should format active status as Yes/No', () => {
    const csv = generateSummaryCSV(mockResult, 'Session', 'aUEC');

    expect(csv).toContain('Alpha,Pilot,Yes');
    expect(csv).toContain('Bravo,Gunner,No');
  });

  it('should handle empty role', () => {
    const resultNoRole: PayslipResult = {
      ...mockResult,
      members: [
        {
          ...mockResult.members[0],
          role: undefined,
        },
      ],
    };

    const csv = generateSummaryCSV(resultNoRole, 'Session', 'aUEC');
    expect(csv).toMatch(/Alpha,,Yes/); // Empty role field
  });
});

describe('generateSummaryCSV - Summary Statistics', () => {
  const mockResultWithStats: PayslipResult = {
    saleRevenue: 10000,
    netProfit: 8000,
    taxRateApplied: 4.5,
    members: [
      {
        memberId: '1',
        handle: 'Alpha',
        role: 'Pilot',
        active: true,
        revenue: 5000,
        investment: 0,
        expenses: 500,
        sharedExpenses: 300,
        individualExpenses: 200,
        profitShare: 4000,
        finalNet: 4500,
      },
    ],
    suggestedTransfers: [],
    summaryStatistics: {
      minPayout: 1000,
      maxPayout: 5000,
      averagePayout: 3000,
      totalTransfers: 2500,
      largestTransfer: 1500,
      highestEarner: 'Alpha',
      lowestEarner: 'Bravo',
    },
  };

  it('should include summary statistics when available', () => {
    const csv = generateSummaryCSV(mockResultWithStats, 'Session', 'aUEC');

    expect(csv).toContain('Summary Statistics');
    expect(csv).toContain('Min Payout,1000');
    expect(csv).toContain('Max Payout,5000');
    expect(csv).toContain('Average Payout,3000');
    expect(csv).toContain('Total Transfers,2500');
    expect(csv).toContain('Largest Transfer,1500');
    expect(csv).toContain('Highest Earner,Alpha');
    expect(csv).toContain('Lowest Earner,Bravo');
  });

  it('should not include summary statistics when not available', () => {
    const resultNoStats: PayslipResult = {
      ...mockResultWithStats,
      summaryStatistics: undefined,
    };

    const csv = generateSummaryCSV(resultNoStats, 'Session', 'aUEC');
    expect(csv).not.toContain('Summary Statistics');
    expect(csv).not.toContain('Min Payout');
  });
});

describe('generateSummaryCSV - Edge Cases', () => {
  it('should handle empty members array', () => {
    const emptyResult: PayslipResult = {
      saleRevenue: 0,
      netProfit: 0,
      taxRateApplied: 0,
      members: [],
      suggestedTransfers: [],
    };

    const csv = generateSummaryCSV(emptyResult, 'Empty Session', 'aUEC');
    expect(csv).toContain('Session: Empty Session');
    expect(csv).toContain('Handle,Role,Active');
    // Should have headers but no data rows
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThan(5); // Headers exist
  });

  it('should handle zero values correctly', () => {
    const zeroResult: PayslipResult = {
      saleRevenue: 0,
      netProfit: 0,
      taxRateApplied: 0,
      members: [
        {
          memberId: '1',
          handle: 'Zero',
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
      suggestedTransfers: [],
    };

    const csv = generateSummaryCSV(zeroResult, 'Session', 'aUEC');
    expect(csv).toContain('Total Revenue: 0');
    expect(csv).toContain('Zero,,Yes,0,0,0,0,0,0,0');
  });

  it('should handle negative values correctly', () => {
    const negativeResult: PayslipResult = {
      saleRevenue: 1000,
      netProfit: -500,
      taxRateApplied: 4.5,
      members: [
        {
          memberId: '1',
          handle: 'Negative',
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
      suggestedTransfers: [],
    };

    const csv = generateSummaryCSV(negativeResult, 'Session', 'aUEC');
    expect(csv).toContain('Net Profit: -500');
    expect(csv).toContain('-200');
    expect(csv).toContain('-700');
  });

  it('should handle very large numbers', () => {
    const largeResult: PayslipResult = {
      saleRevenue: 999999999,
      netProfit: 888888888,
      taxRateApplied: 4.5,
      members: [
        {
          memberId: '1',
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
      suggestedTransfers: [],
    };

    const csv = generateSummaryCSV(largeResult, 'Session', 'aUEC');
    expect(csv).toContain('999999999');
    expect(csv).toContain('888888888');
    expect(csv).toContain('444444444');
  });
});

describe('generateDetailedCSV - Basic Structure', () => {
  const mockResult: PayslipResult = {
    saleRevenue: 10000,
    netProfit: 8000,
    taxRateApplied: 4.5,
    members: [
      {
        memberId: '1',
        handle: 'Alpha',
        role: 'Pilot',
        active: true,
        revenue: 5000,
        investment: 1000,
        expenses: 500,
        sharedExpenses: 300,
        individualExpenses: 200,
        profitShare: 4000,
        finalNet: 4500,
      },
      {
        memberId: '2',
        handle: 'Bravo',
        role: 'Gunner',
        active: true,
        revenue: 3000,
        investment: 500,
        expenses: 300,
        sharedExpenses: 200,
        individualExpenses: 100,
        profitShare: 2000,
        finalNet: 2200,
      },
    ],
    suggestedTransfers: [
      {
        fromMemberId: '2',
        toMemberId: '1',
        netAmount: 1000,
        grossAmount: 1045,
        feeAmount: 45,
      },
    ],
  };

  it('should include session header information', () => {
    const csv = generateDetailedCSV(mockResult, 'Trading Run #1', 'aUEC');

    expect(csv).toContain('Session: Trading Run #1');
    expect(csv).toContain('Currency: aUEC');
    expect(csv).toContain('Total Revenue: 10000');
    expect(csv).toContain('Net Profit: 8000');
    expect(csv).toContain('Tax Rate: 4.5%');
  });

  it('should include MEMBER BREAKDOWN section', () => {
    const csv = generateDetailedCSV(mockResult, 'Session', 'aUEC');

    expect(csv).toContain('MEMBER BREAKDOWN');
    expect(csv).toContain('Handle,Role,Active');
    expect(csv).toContain('Alpha,Pilot,Yes');
    expect(csv).toContain('Bravo,Gunner,Yes');
  });

  it('should include SUGGESTED TRANSFERS section', () => {
    const csv = generateDetailedCSV(mockResult, 'Session', 'aUEC');

    expect(csv).toContain('SUGGESTED TRANSFERS');
    expect(csv).toContain('From,To,Net Amount,Gross Amount (with tax),Fee Amount');
    expect(csv).toContain('Bravo,Alpha,1000,1045,45');
  });

  it('should resolve member handles in transfers', () => {
    const csv = generateDetailedCSV(mockResult, 'Session', 'aUEC');

    // Should use handles, not IDs
    expect(csv).toContain('Bravo,Alpha');
    expect(csv).not.toContain(',1,'); // Should not contain raw member ID
    expect(csv).not.toContain(',2,');
  });

  it('should use member ID if handle not found', () => {
    const resultUnknownMember: PayslipResult = {
      ...mockResult,
      suggestedTransfers: [
        {
          fromMemberId: '999',
          toMemberId: '1',
          netAmount: 1000,
          grossAmount: 1045,
          feeAmount: 45,
        },
      ],
    };

    const csv = generateDetailedCSV(resultUnknownMember, 'Session', 'aUEC');
    expect(csv).toContain('999,Alpha'); // Unknown member ID used as fallback
  });

  it('should handle empty transfers array', () => {
    const resultNoTransfers: PayslipResult = {
      ...mockResult,
      suggestedTransfers: [],
    };

    const csv = generateDetailedCSV(resultNoTransfers, 'Session', 'aUEC');
    expect(csv).toContain('SUGGESTED TRANSFERS');
    expect(csv).toContain('From,To,Net Amount');
    // Should have headers but no transfer data rows
  });

  it('should include summary statistics when available', () => {
    const resultWithStats: PayslipResult = {
      ...mockResult,
      summaryStatistics: {
        minPayout: 1000,
        maxPayout: 5000,
        averagePayout: 3000,
        totalTransfers: 2500,
        largestTransfer: 1500,
        highestEarner: 'Alpha',
        lowestEarner: 'Bravo',
      },
    };

    const csv = generateDetailedCSV(resultWithStats, 'Session', 'aUEC');

    expect(csv).toContain('SUMMARY STATISTICS');
    expect(csv).toContain('Metric,Value');
    expect(csv).toContain('Min Payout,1000');
    expect(csv).toContain('Highest Earner,Alpha');
  });
});

describe('generateDetailedCSV - Multiple Transfers', () => {
  const mockResult: PayslipResult = {
    saleRevenue: 15000,
    netProfit: 12000,
    taxRateApplied: 4.5,
    members: [
      {
        memberId: '1',
        handle: 'Alpha',
        active: true,
        revenue: 10000,
        investment: 0,
        expenses: 1000,
        sharedExpenses: 500,
        individualExpenses: 500,
        profitShare: 6000,
        finalNet: 6000,
      },
      {
        memberId: '2',
        handle: 'Bravo',
        active: true,
        revenue: 3000,
        investment: 0,
        expenses: 1000,
        sharedExpenses: 500,
        individualExpenses: 500,
        profitShare: 3000,
        finalNet: 3000,
      },
      {
        memberId: '3',
        handle: 'Charlie',
        active: true,
        revenue: 2000,
        investment: 0,
        expenses: 1000,
        sharedExpenses: 500,
        individualExpenses: 500,
        profitShare: 3000,
        finalNet: 3000,
      },
    ],
    suggestedTransfers: [
      {
        fromMemberId: '2',
        toMemberId: '1',
        netAmount: 1500,
        grossAmount: 1567.5,
        feeAmount: 67.5,
      },
      {
        fromMemberId: '3',
        toMemberId: '1',
        netAmount: 1000,
        grossAmount: 1045,
        feeAmount: 45,
      },
    ],
  };

  it('should include all transfers', () => {
    const csv = generateDetailedCSV(mockResult, 'Session', 'aUEC');

    expect(csv).toContain('Bravo,Alpha,1500,1567.5,67.5');
    expect(csv).toContain('Charlie,Alpha,1000,1045,45');
  });

  it('should maintain transfer order', () => {
    const csv = generateDetailedCSV(mockResult, 'Session', 'aUEC');
    const lines = csv.split('\n');

    const bravoTransferIndex = lines.findIndex((line) =>
      line.includes('Bravo,Alpha')
    );
    const charlieTransferIndex = lines.findIndex((line) =>
      line.includes('Charlie,Alpha')
    );

    expect(bravoTransferIndex).toBeLessThan(charlieTransferIndex);
  });
});

describe('downloadCSV - Browser Download', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Save original methods
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    // Mock URL methods
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-csv-url');
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL as unknown as typeof URL.createObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL as unknown as typeof URL.revokeObjectURL;

    // Mock link click
    mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick as unknown as typeof HTMLAnchorElement.prototype.click;

    // Spy on document.body methods
    appendChildSpy = vi.spyOn(document.body, 'appendChild');
    removeChildSpy = vi.spyOn(document.body, 'removeChild');
  });

  afterEach(() => {
    // Restore original methods
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.clearAllMocks();
  });

  it('should create a blob with CSV content', () => {
    const csvContent = 'Header1,Header2\nValue1,Value2';
    downloadCSV(csvContent, 'test-export');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/csv;charset=utf-8;',
      })
    );
  });

  it('should create download link with proper filename', () => {
    const csvContent = 'Header1,Header2\nValue1,Value2';
    downloadCSV(csvContent, 'sc-payslip-summary');

    // Check that a link was appended
    expect(appendChildSpy).toHaveBeenCalled();
    const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;

    expect(link.tagName).toBe('A');
    expect(link.href).toBe('blob:mock-csv-url');
    expect(link.download).toMatch(/^sc-payslip-summary-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
  });

  it('should trigger download click', () => {
    const csvContent = 'Header1,Header2\nValue1,Value2';
    downloadCSV(csvContent, 'test-export');

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('should cleanup after download', () => {
    const csvContent = 'Header1,Header2\nValue1,Value2';
    downloadCSV(csvContent, 'test-export');

    // Should remove link from DOM
    expect(removeChildSpy).toHaveBeenCalled();

    // Should revoke object URL
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-csv-url');
  });

  it('should generate timestamp in filename', () => {
    const csvContent = 'test';

    downloadCSV(csvContent, 'export');

    const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;

    // Extract timestamp from filename
    const match = link.download.match(/export-(.+)\.csv$/);
    expect(match).not.toBeNull();

    if (match) {
      const timestamp = match[1];
      // Should be in format: YYYY-MM-DDTHH-MM-SS
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);

      // Verify it contains valid date components
      const parts = timestamp.split('T');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Date part
      expect(parts[1]).toMatch(/^\d{2}-\d{2}-\d{2}$/); // Time part
    }
  });

  it('should handle empty CSV content', () => {
    downloadCSV('', 'empty');

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('should handle special characters in filename', () => {
    downloadCSV('test', 'my-export-file_123');

    const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(link.download).toMatch(/^my-export-file_123-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
  });

  it('should create blob with UTF-8 charset', () => {
    const csvContent = 'Name,Amount\nTëst Üser,1000€';
    downloadCSV(csvContent, 'utf8-test');

    const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobCall.type).toBe('text/csv;charset=utf-8;');
  });
});

describe('CSV Export - Integration', () => {
  it('should generate valid CSV from summary export', () => {
    const mockResult: PayslipResult = {
      saleRevenue: 50000,
      netProfit: 40000,
      taxRateApplied: 4.5,
      members: [
        {
          memberId: '1',
          handle: 'Captain',
          role: 'Leader',
          active: true,
          revenue: 30000,
          investment: 5000,
          expenses: 3000,
          sharedExpenses: 2000,
          individualExpenses: 1000,
          profitShare: 20000,
          finalNet: 22000,
        },
        {
          memberId: '2',
          handle: 'Crew',
          role: 'Support',
          active: true,
          revenue: 20000,
          investment: 2000,
          expenses: 2000,
          sharedExpenses: 1500,
          individualExpenses: 500,
          profitShare: 20000,
          finalNet: 20000,
        },
      ],
      suggestedTransfers: [],
    };

    const csv = generateSummaryCSV(mockResult, 'Mission Alpha', 'aUEC');

    // Split into lines
    const lines = csv.split('\n');

    // Should have header rows + member rows
    expect(lines.length).toBeGreaterThan(8);

    // First line should be session name
    expect(lines[0]).toBe('Session: Mission Alpha');

    // Should contain all expected data
    expect(csv).toContain('Captain');
    expect(csv).toContain('Crew');
    expect(csv).toContain('50000');
    expect(csv).toContain('40000');
  });

  it('should generate valid CSV from detailed export', () => {
    const mockResult: PayslipResult = {
      saleRevenue: 50000,
      netProfit: 40000,
      taxRateApplied: 4.5,
      members: [
        {
          memberId: '1',
          handle: 'Sender',
          active: true,
          revenue: 10000,
          investment: 0,
          expenses: 1000,
          sharedExpenses: 500,
          individualExpenses: 500,
          profitShare: 15000,
          finalNet: 14000,
        },
        {
          memberId: '2',
          handle: 'Receiver',
          active: true,
          revenue: 40000,
          investment: 0,
          expenses: 1000,
          sharedExpenses: 500,
          individualExpenses: 500,
          profitShare: 25000,
          finalNet: 26000,
        },
      ],
      suggestedTransfers: [
        {
          fromMemberId: '1',
          toMemberId: '2',
          netAmount: 5000,
          grossAmount: 5225,
          feeAmount: 225,
        },
      ],
    };

    const csv = generateDetailedCSV(mockResult, 'Mission Beta', 'UEC');

    // Should have all three sections
    expect(csv).toContain('MEMBER BREAKDOWN');
    expect(csv).toContain('SUGGESTED TRANSFERS');
    expect(csv).toContain('Sender,Receiver,5000,5225,225');
  });
});
