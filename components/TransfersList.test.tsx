import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransfersList } from './TransfersList';
import type { Transfer, MemberInput } from '@/lib/types';
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

    // Should have 2 transfer cards with avatars
    // Pilot appears once (sender in first transfer)
    expect(screen.getByLabelText('Avatar for Pilot')).toBeInTheDocument();
    // Escort appears twice (receiver in first, sender in second)
    expect(screen.getAllByLabelText('Avatar for Escort').length).toBe(2);
    // Miner appears once (receiver in second transfer)
    expect(screen.getByLabelText('Avatar for Miner')).toBeInTheDocument();
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
  it('should display member avatars with initials', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    // Check avatars are rendered with correct aria-labels
    expect(screen.getByLabelText('Avatar for Pilot')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Avatar for Escort').length).toBe(2);
    expect(screen.getByLabelText('Avatar for Miner')).toBeInTheDocument();

    // Check initials are displayed
    // P appears once, E appears twice, M appears once
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getAllByText('E').length).toBe(2);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('should display arrow SVG icons between avatars', () => {
    const { container } = render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    // Check for SVG arrow icons (there should be 2 transfers = 2 arrows)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBe(2);

    // Verify SVG attributes
    svgElements.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg.querySelector('path')).toBeInTheDocument();
    });
  });

  it('should display the amount to enter in the game', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText(/^1,000 aUEC$/)).toBeInTheDocument();
    expect(screen.getByText(/^500 aUEC$/)).toBeInTheDocument();
  });

  it('should display the fee and total sender charge', () => {
    render(
      <TransfersList
        transfers={mockTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Fee: 5 aUEC · Total charged: 1,005 aUEC')).toBeInTheDocument();
    expect(screen.getByText('Fee: 3 aUEC · Total charged: 503 aUEC')).toBeInTheDocument();
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

    expect(screen.getByText(/Fee: 5 aUEC/)).toBeInTheDocument();
    expect(screen.getByText(/Fee: 3 aUEC/)).toBeInTheDocument();
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

  it('should display dash avatars when member handle is not found', () => {
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

    // Should display 2 avatars with "-" as the name (sender and receiver)
    expect(screen.getAllByLabelText('Avatar for -').length).toBe(2);
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
    expect(screen.getByText(/^10\.000 aUEC$/)).toBeInTheDocument();
    expect(screen.getByText(/Gesamtbelastung: 10\.050 aUEC/)).toBeInTheDocument();
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
    expect(screen.getByText(/^10,000 aUEC$/)).toBeInTheDocument();
    expect(screen.getByText(/Total charged: 10,050 aUEC/)).toBeInTheDocument();
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
    expect(screen.getByText(/^1,001 aUEC$/)).toBeInTheDocument();
    expect(screen.getByText(/Total charged: 1,005 aUEC/)).toBeInTheDocument();
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

    // Should display dash avatars when members are not found
    // 2 transfers with 2 members each = 4 dash avatars
    expect(screen.getAllByLabelText('Avatar for -').length).toBe(4);
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

    const { container } = render(
      <TransfersList
        transfers={multipleTransfers}
        members={mockMembers}
        translations={translations.en}
        lang="en"
      />
    );

    // Should render 2 transfer cards
    const transferCards = container.querySelectorAll('.border.border-white\\/10.rounded-lg');
    expect(transferCards.length).toBe(2);

    // Should have 2 Pilot avatars and 2 Escort avatars
    expect(screen.getAllByLabelText('Avatar for Pilot').length).toBe(2);
    expect(screen.getAllByLabelText('Avatar for Escort').length).toBe(2);
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

    expect(screen.getByText(/^9,999,999 aUEC$/)).toBeInTheDocument();
    expect(screen.getByText(/Total charged: 10,000,000 aUEC/)).toBeInTheDocument();
  });
});
