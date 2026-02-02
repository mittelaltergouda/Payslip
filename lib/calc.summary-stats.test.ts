import { calculateSummaryStatistics } from './calc';
import type { Transfer, MemberBreakdown } from './types';

// Test cases for calculateSummaryStatistics

describe('calculateSummaryStatistics', () => {
  it('should handle empty members array', () => {
    const members: MemberBreakdown[] = [];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.minPayout).toBe(0);
    expect(result.maxPayout).toBe(0);
    expect(result.averagePayout).toBe(0);
    expect(result.totalTransfers).toBe(0);
    expect(result.largestTransfer).toBe(0);
    expect(result.highestEarner).toBe('');
    expect(result.lowestEarner).toBe('');
  });

  it('should calculate statistics for a single member', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 100,
        revenue: 500,
        expenses: 50,
        sharedExpenses: 50,
        individualExpenses: 0,
        profitShare: 400,
        finalNet: 450
      }
    ];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.minPayout).toBe(450);
    expect(result.maxPayout).toBe(450);
    expect(result.averagePayout).toBe(450);
    expect(result.totalTransfers).toBe(0);
    expect(result.largestTransfer).toBe(0);
    expect(result.highestEarner).toBe('Alice');
    expect(result.lowestEarner).toBe('Alice');
  });

  it('should calculate min/max/average payout for multiple members', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 300,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 300,
        finalNet: 300
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 500,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-3',
        handle: 'Charlie',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 200,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 200,
        finalNet: 200
      }
    ];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.minPayout).toBe(200);
    expect(result.maxPayout).toBe(500);
    expect(result.averagePayout).toBeCloseTo(333.33, 2);
    expect(result.highestEarner).toBe('Bob');
    expect(result.lowestEarner).toBe('Charlie');
  });

  it('should identify highest and lowest earners correctly', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 100,
        revenue: 400,
        expenses: 50,
        sharedExpenses: 50,
        individualExpenses: 0,
        profitShare: 350,
        finalNet: 400
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 600,
        expenses: 100,
        sharedExpenses: 50,
        individualExpenses: 50,
        profitShare: 500,
        finalNet: 400
      },
      {
        memberId: 'member-3',
        handle: 'Charlie',
        role: 'Member',
        active: true,
        investment: 50,
        revenue: 150,
        expenses: 25,
        sharedExpenses: 25,
        individualExpenses: 0,
        profitShare: 125,
        finalNet: 150
      }
    ];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.highestEarner).toBe('Alice'); // First member with maxPayout (ties go to first found)
    expect(result.lowestEarner).toBe('Charlie');
  });

  it('should handle ties in highest/lowest earners (first found wins)', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 500,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 500,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-3',
        handle: 'Charlie',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 300,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 300,
        finalNet: 300
      },
      {
        memberId: 'member-4',
        handle: 'Dave',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 300,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 300,
        finalNet: 300
      }
    ];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    // In case of ties, first occurrence should be selected
    expect(result.highestEarner).toBe('Alice');
    expect(result.lowestEarner).toBe('Charlie');
  });

  it('should calculate transfer statistics with no transfers', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 500,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      }
    ];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.totalTransfers).toBe(0);
    expect(result.largestTransfer).toBe(0);
  });

  it('should calculate transfer statistics with single transfer', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 1000,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 0,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      }
    ];
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        netAmount: 500,
        grossAmount: 502.5,
        feeAmount: 2.5
      }
    ];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.totalTransfers).toBe(1);
    expect(result.largestTransfer).toBe(500);
  });

  it('should identify largest transfer from multiple transfers', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 1500,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 0,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-3',
        handle: 'Charlie',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 0,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      }
    ];
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        netAmount: 300,
        grossAmount: 301.5,
        feeAmount: 1.5
      },
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-3',
        netAmount: 700,
        grossAmount: 703.5,
        feeAmount: 3.5
      }
    ];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.totalTransfers).toBe(2);
    expect(result.largestTransfer).toBe(700);
  });

  it('should calculate comprehensive statistics for realistic scenario', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Captain',
        active: true,
        investment: 500,
        revenue: 2000,
        expenses: 150,
        sharedExpenses: 100,
        individualExpenses: 50,
        profitShare: 1200,
        finalNet: 1550
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Engineer',
        active: true,
        investment: 300,
        revenue: 1500,
        expenses: 100,
        sharedExpenses: 100,
        individualExpenses: 0,
        profitShare: 900,
        finalNet: 1100
      },
      {
        memberId: 'member-3',
        handle: 'Charlie',
        role: 'Gunner',
        active: true,
        investment: 0,
        revenue: 800,
        expenses: 100,
        sharedExpenses: 100,
        individualExpenses: 0,
        profitShare: 700,
        finalNet: 600
      },
      {
        memberId: 'member-4',
        handle: 'Dave',
        role: 'Medic',
        active: false,
        investment: 0,
        revenue: 0,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 0,
        finalNet: 0
      }
    ];
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-3',
        netAmount: 400,
        grossAmount: 402,
        feeAmount: 2
      },
      {
        fromMemberId: 'member-2',
        toMemberId: 'member-3',
        netAmount: 200,
        grossAmount: 201,
        feeAmount: 1
      }
    ];

    const result = calculateSummaryStatistics(members, transfers);

    // Payout statistics (including inactive member with 0 finalNet)
    expect(result.minPayout).toBe(0);
    expect(result.maxPayout).toBe(1550);
    expect(result.averagePayout).toBeCloseTo(812.5, 2); // (1550 + 1100 + 600 + 0) / 4

    // Earners
    expect(result.highestEarner).toBe('Alice');
    expect(result.lowestEarner).toBe('Dave');

    // Transfer statistics
    expect(result.totalTransfers).toBe(2);
    expect(result.largestTransfer).toBe(400);
  });

  it('should handle negative finalNet values correctly', () => {
    const members: MemberBreakdown[] = [
      {
        memberId: 'member-1',
        handle: 'Alice',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 500,
        expenses: 0,
        sharedExpenses: 0,
        individualExpenses: 0,
        profitShare: 500,
        finalNet: 500
      },
      {
        memberId: 'member-2',
        handle: 'Bob',
        role: 'Member',
        active: true,
        investment: 0,
        revenue: 0,
        expenses: 600,
        sharedExpenses: 600,
        individualExpenses: 0,
        profitShare: 0,
        finalNet: -600
      }
    ];
    const transfers: Transfer[] = [];

    const result = calculateSummaryStatistics(members, transfers);

    expect(result.minPayout).toBe(-600);
    expect(result.maxPayout).toBe(500);
    expect(result.averagePayout).toBeCloseTo(-50, 2); // (500 + (-600)) / 2
    expect(result.highestEarner).toBe('Alice');
    expect(result.lowestEarner).toBe('Bob');
  });
});
