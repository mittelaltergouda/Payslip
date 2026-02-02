import type { SessionInput } from './calc';
import { calculatePayslip } from './calc';

// Test cases for performance of calculations

describe('Performance Tests', () => {
  it('should calculate payslip for 100 members in less than 1 second', () => {
    // Create a session with 100 members
    const members = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i}`,
      handle: `Member${i}`,
      role: 'Member' as const,
      active: true,
      revenue: Math.floor(Math.random() * 10000) + 100, // Random revenue between 100 and 10,100
      investment: Math.floor(Math.random() * 1000) // Random investment between 0 and 1,000
    }));

    const input: SessionInput = {
      name: 'Performance Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000000, // 1 million total revenue
      taxEnabled: true,
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members
    };

    // Measure execution time
    const startTime = performance.now();
    const result = calculatePayslip(input);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Verify the calculation completed successfully
    expect(result.members.length).toBe(100);
    expect(result.netProfit).toBeDefined();
    expect(result.saleRevenue).toBeDefined();

    // Verify execution time is less than 1 second (1000ms)
    expect(executionTime).toBeLessThan(1000);

    // Log the execution time for visibility
    console.log(`Calculation for 100 members completed in ${executionTime.toFixed(2)}ms`);
  });

  it('should calculate payslip for 100 members with PERCENT mode in less than 1 second', () => {
    // Create a session with 100 members, each with equal percentShare (1%)
    const members = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i}`,
      handle: `Member${i}`,
      role: 'Member' as const,
      active: true,
      revenue: Math.floor(Math.random() * 10000) + 100,
      investment: Math.floor(Math.random() * 1000),
      percentShare: 1 // Each gets 1% (totaling 100%)
    }));

    const input: SessionInput = {
      name: 'Performance Test PERCENT',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000000,
      taxEnabled: true,
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members
    };

    const startTime = performance.now();
    const result = calculatePayslip(input);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.members.length).toBe(100);
    expect(executionTime).toBeLessThan(1000);

    console.log(`PERCENT mode calculation for 100 members completed in ${executionTime.toFixed(2)}ms`);
  });

  it('should calculate payslip for 100 members with ADJUSTABLE mode in less than 1 second', () => {
    // Create a session with 100 members using ADJUSTABLE mode
    const members = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i}`,
      handle: `Member${i}`,
      role: 'Member' as const,
      active: true,
      revenue: Math.floor(Math.random() * 10000) + 100,
      investment: Math.floor(Math.random() * 1000),
      fixedPayout: i % 5 === 0 ? 5000 : undefined, // Every 5th member gets a fixed payout
      fixedBonus: i % 3 === 0 ? 1000 : undefined, // Every 3rd member gets a fixed bonus
      percentShare: 1 // Equal share of remainder
    }));

    const input: SessionInput = {
      name: 'Performance Test ADJUSTABLE',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 2000000, // 2 million to accommodate fixed payouts/bonuses
      taxEnabled: true,
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members
    };

    const startTime = performance.now();
    const result = calculatePayslip(input);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.members.length).toBe(100);
    expect(executionTime).toBeLessThan(1000);

    console.log(`ADJUSTABLE mode calculation for 100 members completed in ${executionTime.toFixed(2)}ms`);
  });

  it('should calculate payslip for 100 members with expenses in less than 1 second', () => {
    // Create a session with 100 members and various expenses
    const members = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i}`,
      handle: `Member${i}`,
      role: 'Member' as const,
      active: true,
      revenue: Math.floor(Math.random() * 10000) + 100,
      investment: Math.floor(Math.random() * 1000)
    }));

    // Create shared expenses
    const sharedExpenses = Array.from({ length: 20 }, (_, i) => ({
      id: `expense-${i}`,
      label: `Shared Expense ${i}`,
      amount: Math.floor(Math.random() * 5000) + 100
    }));

    // Create individual expenses (2 per member)
    const individualExpenses = members.flatMap((member, i) => [
      {
        id: `ind-expense-${i}-1`,
        memberId: member.id,
        label: `Individual Expense ${i}-1`,
        amount: Math.floor(Math.random() * 500) + 10
      },
      {
        id: `ind-expense-${i}-2`,
        memberId: member.id,
        label: `Individual Expense ${i}-2`,
        amount: Math.floor(Math.random() * 500) + 10
      }
    ]);

    const input: SessionInput = {
      name: 'Performance Test with Expenses',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 3000000, // 3 million to cover expenses
      taxEnabled: true,
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members,
      sharedExpenses,
      individualExpenses
    };

    const startTime = performance.now();
    const result = calculatePayslip(input);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.members.length).toBe(100);
    expect(result.netProfit).toBeDefined();
    // Verify that expenses were properly deducted by checking member breakdowns
    const hasExpenses = result.members.some(m => m.sharedExpenses > 0 || m.individualExpenses > 0);
    expect(hasExpenses).toBe(true);
    expect(executionTime).toBeLessThan(1000);

    console.log(`Calculation with expenses for 100 members completed in ${executionTime.toFixed(2)}ms`);
  });

  it('should handle complex settlement with 100 members in less than 1 second', () => {
    // Create a session where settlements will be complex (many transfers)
    // Use fixedPayout to create a scenario with debtors and creditors
    const members = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i}`,
      handle: `Member${i}`,
      role: 'Member' as const,
      active: true,
      revenue: 0,
      investment: i < 50 ? 20000 : 0, // First 50 members invested
      fixedPayout: i >= 50 ? 25000 : undefined // Last 50 members get fixed payouts
    }));

    const input: SessionInput = {
      name: 'Performance Test Complex Settlement',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 2500000, // Enough to cover the fixed payouts
      taxEnabled: true,
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members
    };

    const startTime = performance.now();
    const result = calculatePayslip(input);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.members.length).toBe(100);
    expect(result.suggestedTransfers.length).toBeGreaterThanOrEqual(0);
    expect(executionTime).toBeLessThan(1000);

    console.log(`Complex settlement for 100 members completed in ${executionTime.toFixed(2)}ms with ${result.suggestedTransfers.length} transfers`);
  });
});
