import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MembersTable } from './MembersTable';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IndividualExpenseInput, MemberInput, PayslipResult } from '@/lib/types';

// Mock translations
const mockTranslationsDE = {
  members: 'Eingabe',
  addMember: '+ Mitglied',
  handle: 'Handle',
  role: 'Rolle',
  revenueLabel: 'Einnahmen',
  investmentLabel: 'Investition',
  expensesLabel: 'Ausgaben',
  taxesLabel: 'Transfer Tax',
  profitShareCol: 'Profit Share',
  netAfterFeesCol: 'Net',
  percentShare: '% Share',
  fixedBonus: 'Fixed Bonus',
  fixedPayout: 'Fixed Payout',
  remove: 'Entfernen',
  addExpense: '+ Ausgabe',
};

const mockTranslationsEN = {
  members: 'Members',
  addMember: '+ Member',
  handle: 'Handle',
  role: 'Role',
  revenueLabel: 'Revenue',
  investmentLabel: 'Investment',
  expensesLabel: 'Expenses',
  taxesLabel: 'Taxes',
  profitShareCol: 'Profit Share',
  netAfterFeesCol: 'Net After Fees',
  percentShare: '% Share',
  fixedBonus: 'Fixed Bonus',
  fixedPayout: 'Fixed Payout',
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
const sampleMembers: MemberInput[] = [
  {
    id: 'member-1',
    handle: 'Pilot',
    role: 'Captain',
    revenue: 10000,
    investment: 2000,
    percentShare: 50,
    fixedBonus: 0,
    fixedPayout: 0,
  },
  {
    id: 'member-2',
    handle: 'Escort',
    role: 'Fighter',
    revenue: 5000,
    investment: 1000,
    percentShare: 50,
    fixedBonus: 0,
    fixedPayout: 0,
  },
];

const sampleIndividualExpenses: IndividualExpenseInput[] = [
  {
    id: 'expense-1',
    memberId: 'member-1',
    label: 'Fuel',
    amount: 500,
  },
];

const sampleResult: PayslipResult = {
  saleRevenue: 15000,
  netProfit: 11500,
  taxRateApplied: 0.042,
  members: [
    {
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
    },
    {
      memberId: 'member-2',
      handle: 'Escort',
      role: 'Fighter',
      revenue: 5000,
      investment: 1000,
      expenses: 0,
      sharedExpenses: 0,
      individualExpenses: 0,
      profitShare: 5750,
      finalNet: 9750,
    },
  ],
  suggestedTransfers: [],
};

describe('MembersTable - Initial Rendering', () => {
  const mockCallbacks = {
    onAddMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with German translations', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="de"
        t={mockTranslationsDE}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Eingabe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Mitglied' })).toBeInTheDocument();
  });

  it('should render the component with English translations', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Member' })).toBeInTheDocument();
  });

  it('should render all column headers', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    // Column headers appear in both desktop table and mobile card views
    expect(screen.getAllByText('Handle').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Revenue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Investment').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Expenses').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('% Share').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Fixed Bonus').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Fixed Payout').length).toBeGreaterThanOrEqual(1);
    // Taxes, Profit Share, Net After Fees columns removed from input section
    expect(screen.queryByText('Taxes')).not.toBeInTheDocument();
    expect(screen.queryByText('Profit Share')).not.toBeInTheDocument();
    expect(screen.queryByText('Net After Fees')).not.toBeInTheDocument();
  });

  it('should render role column header when showRole is true', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getAllByText('Role').length).toBeGreaterThanOrEqual(1);
  });

  it('should not render role column header when showRole is false', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByRole('columnheader', { name: 'Role' })).not.toBeInTheDocument();
  });

  it('should render all member rows', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    // Members appear in both desktop rows and mobile cards
    const pilotInputs = screen.getAllByDisplayValue('Pilot');
    expect(pilotInputs.length).toBeGreaterThanOrEqual(1);

    const escortInputs = screen.getAllByDisplayValue('Escort');
    expect(escortInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('should render empty table when no members', () => {
    render(
      <MembersTable
        members={[]}
        individualExpenses={[]}
        result={null}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Pilot')).not.toBeInTheDocument();
  });
});

describe('MembersTable - User Interactions', () => {
  const mockCallbacks = {
    onAddMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onAddMember when add member button is clicked', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    const addButton = screen.getByText('+ Member');
    fireEvent.click(addButton);

    expect(mockCallbacks.onAddMember).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to MemberRow components', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole
        distributionMode="PERCENT"
        feeByPayer={{ 'member-1': 100 }}
        lang="de"
        t={mockTranslationsDE}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    // Members appear in both desktop rows and mobile cards
    expect(screen.getAllByDisplayValue('Pilot').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('Captain').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('Escort').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('Fighter').length).toBeGreaterThanOrEqual(1);
  });
});

describe('MembersTable - Data Display', () => {
  const mockCallbacks = {
    onAddMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with null result', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={null}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('Pilot').length).toBeGreaterThanOrEqual(1);
  });

  it('should render with empty feeByPayer object', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
  });

  it('should render individual expenses for members', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getAllByDisplayValue('Fuel').length).toBeGreaterThanOrEqual(1);
  });
});

describe('MembersTable - Distribution Modes', () => {
  const mockCallbacks = {
    onAddMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    addIndividualExpense: vi.fn(),
    updateIndividualExpense: vi.fn(),
    removeIndividualExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render in EQUAL mode', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="EQUAL"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
  });

  it('should render in PERCENT mode', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="PERCENT"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
  });

  it('should render in ADJUSTABLE mode', () => {
    render(
      <MembersTable
        members={sampleMembers}
        individualExpenses={sampleIndividualExpenses}
        result={sampleResult}
        showRole={false}
        distributionMode="ADJUSTABLE"
        feeByPayer={{}}
        lang="en"
        t={mockTranslationsEN}
        format={mockFormat}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
  });
});
