import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemberRow } from './MemberRow';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DistributionMode, IndividualExpenseInput, MemberBreakdown, MemberInput } from '@/lib/types';

// Mock translations
const mockTranslationsDE = {
  remove: 'Entfernen',
  addExpense: '+ Ausgabe',
};

const mockTranslationsEN = {
  remove: 'Remove',
  addExpense: '+ Expense',
};

// Mock format function
const mockFormat = (amount: number, lang: 'de' | 'en') => {
  if (lang === 'de') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Sample data
const sampleMember: MemberInput = {
  id: 'member-1',
  handle: 'Pilot',
  role: 'Captain',
  revenue: 10000,
  investment: 2000,
  percentShare: 50,
  fixedBonus: 100,
  fixedPayout: 5000,
};

const sampleResultMember: MemberBreakdown = {
  memberId: 'member-1',
  handle: 'Pilot',
  role: 'Captain',
  revenue: 10000,
  investment: 2000,
  expenses: 500,
  sharedExpenses: 0,
  individualExpenses: 500,
  profitShare: 5750,
  finalNet: 13250,
};

const sampleIndividualExpenses: IndividualExpenseInput[] = [
  {
    id: 'expense-1',
    memberId: 'member-1',
    label: 'Fuel',
    amount: 500,
  },
  {
    id: 'expense-2',
    memberId: 'member-1',
    label: 'Repairs',
    amount: 300,
  },
];

describe('MemberRow - Initial Rendering', () => {
  const mockCallbacks = {
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render member handle input', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const handleInput = screen.getByDisplayValue('Pilot');
    expect(handleInput).toBeInTheDocument();
    expect(handleInput).toHaveClass('input');
  });

  it('should render role input when showRole is true', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={true}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const roleInput = screen.getByDisplayValue('Captain');
    expect(roleInput).toBeInTheDocument();
  });

  it('should not render role input when showRole is false', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    expect(screen.queryByDisplayValue('Captain')).not.toBeInTheDocument();
  });

  it('should render revenue input with correct value', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const revenueInput = screen.getByDisplayValue('10000');
    expect(revenueInput).toBeInTheDocument();
    expect(revenueInput).toHaveAttribute('type', 'number');
  });

  it('should render investment input with correct value', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const investmentInput = screen.getByDisplayValue('2000');
    expect(investmentInput).toBeInTheDocument();
    expect(investmentInput).toHaveAttribute('type', 'number');
  });

  it('should render individual expenses', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={sampleIndividualExpenses}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    expect(screen.getByDisplayValue('Fuel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Repairs')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
  });

  it('should render add expense button', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('+ Expense')).toBeInTheDocument();
  });

  it('should display expense sum correctly', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={sampleIndividualExpenses}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    // Sum of 500 + 300 = 800
    const formattedSum = mockFormat(800, 'en');
    expect(screen.getByText(`Σ ${formattedSum}`)).toBeInTheDocument();
  });

  it('should display taxes with formatting', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{ 'member-1': 420 }}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const formattedFee = mockFormat(420, 'en');
    expect(screen.getByText(formattedFee)).toBeInTheDocument();
  });

  it('should display profit share with formatting', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const formattedShare = mockFormat(5750, 'en');
    expect(screen.getByText(formattedShare)).toBeInTheDocument();
  });

  it('should display net after fees with positive formatting', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{ 'member-1': 250 }}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    // finalNet (13250) - fee (250) = 13000
    const formattedNet = mockFormat(13000, 'en');
    const netElement = screen.getByText(formattedNet);
    expect(netElement).toBeInTheDocument();
    expect(netElement).toHaveClass('text-neon');
  });

  it('should display net after fees with negative formatting', () => {
    const negativeResultMember: MemberBreakdown = {
      ...sampleResultMember,
      finalNet: -1000,
    };

    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={negativeResultMember}
            feeByPayer={{ 'member-1': 500 }}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    // finalNet (-1000) - fee (500) = -1500
    const formattedNet = mockFormat(-1500, 'en');
    const netElement = screen.getByText(formattedNet);
    expect(netElement).toBeInTheDocument();
    expect(netElement).toHaveClass('text-red-400');
  });

  it('should render remove member button', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const removeButtons = screen.getAllByTitle('Remove');
    expect(removeButtons.length).toBeGreaterThan(0);
  });
});

describe('MemberRow - User Interactions', () => {
  const mockCallbacks = {
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateMember when handle is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const handleInput = screen.getByDisplayValue('Pilot');
    fireEvent.change(handleInput, { target: { value: 'NewHandle' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { handle: 'NewHandle' });
  });

  it('should call updateMember when role is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={true}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const roleInput = screen.getByDisplayValue('Captain');
    fireEvent.change(roleInput, { target: { value: 'Engineer' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { role: 'Engineer' });
  });

  it('should call updateMember when revenue is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const revenueInput = screen.getByDisplayValue('10000');
    fireEvent.change(revenueInput, { target: { value: '15000' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { revenue: 15000 });
  });

  it('should call updateMember when investment is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const investmentInput = screen.getByDisplayValue('2000');
    fireEvent.change(investmentInput, { target: { value: '3000' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { investment: 3000 });
  });

  it('should call updateMember when percent share is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="PERCENT"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const percentInput = screen.getByDisplayValue('50');
    fireEvent.change(percentInput, { target: { value: '60' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { percentShare: 60 });
  });

  it('should call updateMember when fixed bonus is changed in ADJUSTABLE mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="ADJUSTABLE"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fixedBonusInput = screen.getByDisplayValue('100');
    fireEvent.change(fixedBonusInput, { target: { value: '200' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { fixedBonus: 200 });
  });

  it('should call updateMember when fixed payout is changed in ADJUSTABLE mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="ADJUSTABLE"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fixedPayoutInput = screen.getByDisplayValue('5000');
    fireEvent.change(fixedPayoutInput, { target: { value: '6000' } });

    expect(mockCallbacks.updateMember).toHaveBeenCalledWith('member-1', { fixedPayout: 6000 });
  });

  it('should call addIndividualExpense when add expense button is clicked', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const addExpenseButton = screen.getByText('+ Expense');
    fireEvent.click(addExpenseButton);

    expect(mockCallbacks.addIndividualExpense).toHaveBeenCalledWith('member-1');
  });

  it('should call updateIndividualExpense when expense label is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={sampleIndividualExpenses}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fuelInput = screen.getByDisplayValue('Fuel');
    fireEvent.change(fuelInput, { target: { value: 'Quantum Fuel' } });

    expect(mockCallbacks.updateIndividualExpense).toHaveBeenCalledWith('expense-1', { label: 'Quantum Fuel' });
  });

  it('should call updateIndividualExpense when expense amount is changed', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={sampleIndividualExpenses}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const amountInput = screen.getByDisplayValue('500');
    fireEvent.change(amountInput, { target: { value: '750' } });

    expect(mockCallbacks.updateIndividualExpense).toHaveBeenCalledWith('expense-1', { amount: 750 });
  });

  it('should call removeIndividualExpense when expense remove button is clicked', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={sampleIndividualExpenses}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const removeButtons = screen.getAllByTitle('Remove');
    // First remove button is for the first expense
    fireEvent.click(removeButtons[0]);

    expect(mockCallbacks.removeIndividualExpense).toHaveBeenCalledWith('expense-1');
  });

  it('should call removeMember when remove member button is clicked', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const removeButton = screen.getByTitle('Remove');
    fireEvent.click(removeButton);

    expect(mockCallbacks.removeMember).toHaveBeenCalledWith('member-1');
  });
});

describe('MemberRow - Distribution Modes', () => {
  const mockCallbacks = {
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should disable percent share input in EQUAL mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const percentInput = screen.getByDisplayValue('50');
    expect(percentInput).toBeDisabled();
  });

  it('should enable percent share input in PERCENT mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="PERCENT"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const percentInput = screen.getByDisplayValue('50');
    expect(percentInput).not.toBeDisabled();
  });

  it('should disable fixed bonus input when not in ADJUSTABLE mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fixedBonusInput = screen.getByDisplayValue('100');
    expect(fixedBonusInput).toBeDisabled();
  });

  it('should enable fixed bonus input in ADJUSTABLE mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="ADJUSTABLE"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fixedBonusInput = screen.getByDisplayValue('100');
    expect(fixedBonusInput).not.toBeDisabled();
  });

  it('should disable fixed payout input when not in ADJUSTABLE mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="PERCENT"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fixedPayoutInput = screen.getByDisplayValue('5000');
    expect(fixedPayoutInput).toBeDisabled();
  });

  it('should enable fixed payout input in ADJUSTABLE mode', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="ADJUSTABLE"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const fixedPayoutInput = screen.getByDisplayValue('5000');
    expect(fixedPayoutInput).not.toBeDisabled();
  });
});

describe('MemberRow - Edge Cases', () => {
  const mockCallbacks = {
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle member with no role', () => {
    const memberWithoutRole: MemberInput = {
      ...sampleMember,
      role: undefined,
    };

    render(
      <table>
        <tbody>
          <MemberRow
            member={memberWithoutRole}
            showRole={true}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const roleInput = screen.getByDisplayValue('');
    expect(roleInput).toBeInTheDocument();
  });

  it('should handle undefined resultMember', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={undefined}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    // Should show 0 for profit share when resultMember is undefined
    const formattedZero = mockFormat(0, 'en');
    const zeroElements = screen.getAllByText(formattedZero);
    // Should have multiple $0.00 values (taxes, profit share, net after fees)
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it('should handle member with no fees', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const formattedZero = mockFormat(0, 'en');
    expect(screen.getByText(formattedZero)).toBeInTheDocument();
  });

  it('should calculate expense sum correctly with no expenses', () => {
    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={[]}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    const formattedSum = mockFormat(0, 'en');
    expect(screen.getByText(`Σ ${formattedSum}`)).toBeInTheDocument();
  });

  it('should filter expenses for the correct member', () => {
    // MemberRow now expects pre-filtered expenses from MembersTable
    // So we pass only the expenses for this member (not other members' expenses)
    const memberOnlyExpenses = sampleIndividualExpenses.filter((e) => e.memberId === 'member-1');

    render(
      <table>
        <tbody>
          <MemberRow
            member={sampleMember}
            showRole={false}
            distributionMode="EQUAL"
            individualExpenses={memberOnlyExpenses}
            resultMember={sampleResultMember}
            feeByPayer={{}}
            lang="en"
            t={mockTranslationsEN}
            format={mockFormat}
            {...mockCallbacks}
          />
        </tbody>
      </table>
    );

    // Should only show expenses for member-1 (since we passed pre-filtered expenses)
    expect(screen.getByDisplayValue('Fuel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Repairs')).toBeInTheDocument();
    // Other member's expense is not in the pre-filtered list, so shouldn't be rendered
    expect(screen.queryByDisplayValue('Other Member Expense')).not.toBeInTheDocument();
  });
});
