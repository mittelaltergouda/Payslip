import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SummaryStats } from './SummaryStats';
import type { PayslipResult } from '@/lib/types';
import { translations } from '@/lib/i18n/translations';
import { describe, it, expect } from 'vitest';

const mockResultWithStats: PayslipResult = {
  saleRevenue: 15000,
  netProfit: 11300,
  taxRateApplied: 0.005,
  members: [
    {
      memberId: "m1",
      handle: "Pilot",
      revenue: 10000,
      investment: 2000,
      expenses: 450,
      sharedExpenses: 250,
      individualExpenses: 200,
      profitShare: 5650,
      finalNet: 13200,
    },
    {
      memberId: "m2",
      handle: "Escort",
      revenue: 5000,
      investment: 1000,
      expenses: 250,
      sharedExpenses: 250,
      individualExpenses: 0,
      profitShare: 5650,
      finalNet: 9400,
    },
  ],
  suggestedTransfers: [
    {
      fromMemberId: "m1",
      toMemberId: "m2",
      netAmount: 1000,
      grossAmount: 1005,
      feeAmount: 5,
    },
  ],
};

const _mockResultWithoutStats: PayslipResult = {
  saleRevenue: 15000,
  netProfit: 11300,
  taxRateApplied: 0.005,
  members: [
    {
      memberId: "m1",
      handle: "Pilot",
      revenue: 10000,
      investment: 2000,
      expenses: 450,
      sharedExpenses: 250,
      individualExpenses: 200,
      profitShare: 5650,
      finalNet: 13200,
    },
  ],
  suggestedTransfers: [],
};

describe('SummaryStats - Basic Rendering', () => {
  it('should render summary heading in German', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
  });

  it('should render summary heading in English', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Totals')).toBeInTheDocument();
  });

  it('should render all summary labels in German', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Umsatz')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('Kosten')).toBeInTheDocument();
    expect(screen.getByText('Gewinn (Brutto)')).toBeInTheDocument();
    expect(screen.getByText('Steuern (Fees)')).toBeInTheDocument();
    expect(screen.getByText('Gewinn (Netto)')).toBeInTheDocument();
  });

  it('should render all summary labels in English', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Profit (Gross)')).toBeInTheDocument();
    expect(screen.getByText('Taxes (fees)')).toBeInTheDocument();
    expect(screen.getByText('Profit (Net)')).toBeInTheDocument();
  });
});

describe('SummaryStats - Number Formatting', () => {
  it('should format numbers with German locale', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.de}
        lang="de"
      />
    );

    // German locale uses periods as thousand separators
    expect(screen.getByText('15.000 aUEC')).toBeInTheDocument();
    expect(screen.getByText('3.000 aUEC')).toBeInTheDocument();
  });

  it('should format numbers with English locale', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
      />
    );

    // English locale uses commas as thousand separators
    expect(screen.getByText('15,000 aUEC')).toBeInTheDocument();
    expect(screen.getByText('3,000 aUEC')).toBeInTheDocument();
  });

  it('should round numbers correctly', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000.7}
        totalInvestment={3000.4}
        totalExpenses={700.5}
        totalFees={5.2}
        translations={translations.en}
        lang="en"
      />
    );

    // Numbers should be rounded to nearest integer
    expect(screen.getByText('15,001 aUEC')).toBeInTheDocument();
    expect(screen.getByText('3,000 aUEC')).toBeInTheDocument();
    expect(screen.getByText('701 aUEC')).toBeInTheDocument();
    expect(screen.getByText('5 aUEC')).toBeInTheDocument();
  });
});

describe('SummaryStats - Net Profit After Tax Calculation', () => {
  it('should calculate and display positive net profit after tax', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
      />
    );

    // netAfterTax = 15000 - 3000 - 700 - 5 = 11295
    // This value may appear in multiple places (summary and statistics), so use getAllByText
    const netElements = screen.getAllByText(/11,295 aUEC/);
    expect(netElements.length).toBeGreaterThan(0);
  });

  it('should display positive net profit after tax in green (neon)', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
      />
    );

    // Find the net profit after tax element - it should have both text-neon and font-semibold classes
    const netAfterTaxElements = screen.getAllByText(/11,295 aUEC/);
    const styledElement = netAfterTaxElements.find(el =>
      el.className.includes('text-neon') && el.className.includes('font-semibold')
    );
    expect(styledElement).toBeDefined();
    expect(styledElement).toHaveClass('text-neon');
    expect(styledElement).toHaveClass('font-semibold');
  });

  it('should display negative net profit after tax in red', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={1000}
        totalInvestment={5000}
        totalExpenses={2000}
        totalFees={100}
        translations={translations.en}
        lang="en"
      />
    );

    // netAfterTax = 1000 - 5000 - 2000 - 100 = -6100
    const netAfterTaxElement = screen.getByText('-6,100 aUEC');
    expect(netAfterTaxElement).toHaveClass('text-red-400');
    expect(netAfterTaxElement).toHaveClass('font-semibold');
  });

  it('should display zero net profit after tax correctly', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={5000}
        totalInvestment={3000}
        totalExpenses={1500}
        totalFees={500}
        translations={translations.en}
        lang="en"
      />
    );

    // netAfterTax = 5000 - 3000 - 1500 - 500 = 0
    const netAfterTaxElement = screen.getByText('0 aUEC');
    expect(netAfterTaxElement).toHaveClass('text-neon'); // Zero is >= 0, so should be green
    expect(netAfterTaxElement).toHaveClass('font-semibold');
  });
});

describe('SummaryStats - Currency Display', () => {
  it('should display default currency aUEC', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
      />
    );

    const currencyElements = screen.getAllByText(/aUEC/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it('should display custom currency when provided', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
        currency="UEC"
      />
    );

    const currencyElements = screen.getAllByText(/UEC/);
    expect(currencyElements.length).toBeGreaterThan(0);
    expect(screen.queryByText(/aUEC/)).not.toBeInTheDocument();
  });
});

describe('SummaryStats - Custom Class Name', () => {
  it('should apply custom className', () => {
    const { container } = render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={15000}
        totalInvestment={3000}
        totalExpenses={700}
        totalFees={5}
        translations={translations.en}
        lang="en"
        className="custom-class"
      />
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('custom-class');
  });
});

describe('SummaryStats - Edge Cases', () => {
  it('should handle zero values', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={0}
        totalInvestment={0}
        totalExpenses={0}
        totalFees={0}
        translations={translations.en}
        lang="en"
      />
    );

    const zeroElements = screen.getAllByText(/0 aUEC/);
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it('should handle large numbers', () => {
    render(
      <SummaryStats
        result={mockResultWithStats}
        totalRevenue={9999999}
        totalInvestment={1000000}
        totalExpenses={500000}
        totalFees={10000}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('9,999,999 aUEC')).toBeInTheDocument();
    expect(screen.getByText('1,000,000 aUEC')).toBeInTheDocument();
  });
});
