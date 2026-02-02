import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransfersList } from './TransfersList';
import { Transfer, MemberInput } from '@/lib/types';
import { translations } from '@/lib/i18n/translations';
import { describe, it, expect } from 'vitest';

const mockMembers: MemberInput[] = [
  {
    id: "m1",
    handle: "Pilot",
    role: "Captain",
  },
  {
    id: "m2",
    handle: "Escort",
    role: "Guard",
  },
  {
    id: "m3",
    handle: "Miner",
    role: "Engineer",
  },
];

const mockTransfers: Transfer[] = [
  {
    fromMemberId: "m1",
    toMemberId: "m2",
    netAmount: 1000,
    grossAmount: 1005,
    feeAmount: 5,
  },
  {
    fromMemberId: "m2",
    toMemberId: "m3",
    netAmount: 500,
    grossAmount: 503,
    feeAmount: 3,
  },
];

const mockTransferWithoutFee: Transfer[] = [
  {
    fromMemberId: "m1",
    toMemberId: "m2",
    netAmount: 1000,
    grossAmount: 1000,
    feeAmount: 0,
  },
];

describe('TransfersList - Basic Rendering', () => {
  it('should render heading in German', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Vorgeschlagene Überweisungen')).toBeInTheDocument();
  });

  it('should render heading in English', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Suggested Transfers')).toBeInTheDocument();
  });

  it('should render all transfers', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    // Should have 2 transfer cards
    expect(screen.getByText('Pilot → Escort')).toBeInTheDocument();
    expect(screen.getByText('Escort → Miner')).toBeInTheDocument();
  });

  it('should display no transfers message when list is empty in German', () => {
    render(
      <TransfersList
        transfers={[]}
        members={mockMembers}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
  });

  it('should display no transfers message when list is empty in English', () => {
    render(
      <TransfersList
        transfers={[]}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('No transfers required.')).toBeInTheDocument();
  });
});

describe('TransfersList - Transfer Details', () => {
  it('should display member handles correctly', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Pilot → Escort')).toBeInTheDocument();
    expect(screen.getByText('Escort → Miner')).toBeInTheDocument();
  });

  it('should display gross amount with currency', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText(/1,005 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/503 aUEC/)).toBeInTheDocument();
  });

  it('should display net amount in parentheses', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText(/\(net 1,000\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(net 500\)/)).toBeInTheDocument();
  });

  it('should display fee when feeAmount is greater than 0', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Fee: 5 aUEC')).toBeInTheDocument();
    expect(screen.getByText('Fee: 3 aUEC')).toBeInTheDocument();
  });

  it('should not display fee when feeAmount is 0', () => {
    render(
      <TransfersList
        transfers={mockTransferWithoutFee}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByText(/Fee:/)).not.toBeInTheDocument();
  });

  it('should display dash when member handle is not found', () => {
    const transferWithUnknownMember: Transfer[] = [
      {
        fromMemberId: "unknown1",
        toMemberId: "unknown2",
        netAmount: 1000,
        grossAmount: 1005,
        feeAmount: 5,
      },
    ];

    render(
      <TransfersList
        transfers={transferWithUnknownMember}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('- → -')).toBeInTheDocument();
  });
});

describe('TransfersList - Number Formatting', () => {
  it('should format numbers with German locale', () => {
    const largeTransfer: Transfer[] = [
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 10000,
        grossAmount: 10050,
        feeAmount: 50,
      },
    ];

    render(
      <TransfersList
        transfers={largeTransfer}
        members={mockMembers}
        translations={translations.de}
        lang="de"
      />
    );

    // German locale uses periods as thousand separators
    expect(screen.getByText(/10\.050 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/\(net 10\.000\)/)).toBeInTheDocument();
  });

  it('should format numbers with English locale', () => {
    const largeTransfer: Transfer[] = [
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 10000,
        grossAmount: 10050,
        feeAmount: 50,
      },
    ];

    render(
      <TransfersList
        transfers={largeTransfer}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    // English locale uses commas as thousand separators
    expect(screen.getByText(/10,050 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/\(net 10,000\)/)).toBeInTheDocument();
  });

  it('should round numbers correctly', () => {
    const transferWithDecimals: Transfer[] = [
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 1000.7,
        grossAmount: 1005.4,
        feeAmount: 5.2,
      },
    ];

    render(
      <TransfersList
        transfers={transferWithDecimals}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    // Numbers should be rounded to nearest integer
    expect(screen.getByText(/1,005 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/\(net 1,001\)/)).toBeInTheDocument();
    expect(screen.getByText(/Fee: 5 aUEC/)).toBeInTheDocument();
  });
});

describe('TransfersList - Currency Display', () => {
  it('should display default currency aUEC', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    const currencyElements = screen.getAllByText(/aUEC/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it('should display custom currency when provided', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
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

describe('TransfersList - Custom Class Name', () => {
  it('should apply custom className', () => {
    const { container } = render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
        className="custom-class"
      />
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('custom-class');
  });
});

describe('TransfersList - Edge Cases', () => {
  it('should handle empty members array', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={[]}
        translations={translations.en}
        lang="en"
      />
    );

    // Should display dashes when members are not found - there are 2 transfers so 2 instances
    expect(screen.getAllByText('- → -').length).toBe(2);
  });

  it('should handle transfers with zero amounts', () => {
    const zeroTransfer: Transfer[] = [
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 0,
        grossAmount: 0,
        feeAmount: 0,
      },
    ];

    render(
      <TransfersList
        transfers={zeroTransfer}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText(/0 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/\(net 0\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Fee:/)).not.toBeInTheDocument();
  });

  it('should handle multiple transfers between same members', () => {
    const multipleTransfers: Transfer[] = [
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 1000,
        grossAmount: 1005,
        feeAmount: 5,
      },
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 500,
        grossAmount: 503,
        feeAmount: 3,
      },
    ];

    render(
      <TransfersList
        transfers={multipleTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    const transferElements = screen.getAllByText('Pilot → Escort');
    expect(transferElements.length).toBe(2);
  });

  it('should handle very large amounts', () => {
    const largeTransfer: Transfer[] = [
      {
        fromMemberId: "m1",
        toMemberId: "m2",
        netAmount: 9999999,
        grossAmount: 10000000,
        feeAmount: 1,
      },
    ];

    render(
      <TransfersList
        transfers={largeTransfer}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText(/10,000,000 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/\(net 9,999,999\)/)).toBeInTheDocument();
  });
});
