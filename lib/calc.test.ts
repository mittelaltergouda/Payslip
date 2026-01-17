import { calculatePayslip, SessionInput } from './calc';

// Test cases will be added here

describe('calculatePayslip', () => {
  it('should distribute profit equally among active members in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Test Session',
      type: 'SessionType',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 200 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(3);
    expect(result.netProfit).toBe(1000);
    expect(result.saleRevenue).toBe(1000);
    expect(result.taxRateApplied).toBe(0);

    result.members.forEach(member => {
      expect(member.finalNet).toBeCloseTo(1000 / 3, 2);
    });
  });
});
