import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaidTransfersEditor } from './PaidTransfersEditor';
import type { PaidTransferInput, SessionInput } from '@/lib/types';

const base: SessionInput = {
  name: 'Test', type: 'TRADING', distributionMode: 'EQUAL', taxEnabled: true, taxRate: 0.005,
  members: [{ id: 'a', handle: 'Player 1' }, { id: 'b', handle: 'Player 2' }],
};
const transfer = (patch: Partial<PaidTransferInput> = {}): PaidTransferInput => ({ id: 't1', label: 'Vorschuss', fromMemberId: 'a', toMemberId: 'b', netAmount: 100_000, feeAmount: 500, feeIncluded: true, kind: 'SETTLEMENT', ...patch });

describe('PaidTransfersEditor service fee', () => {
  it('shows no long explanation text anymore', () => {
    render(<PaidTransfersEditor session={{ ...base, paidTransfers: [transfer()] }} lang="de" onChange={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Bereits erfolgte Überweisungen' })).toBeInTheDocument();
    expect(screen.queryByText(/Umsatz bleibt der gehaltene Erlös/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gebühr im Empfängeranspruch/)).not.toBeInTheDocument();
  });

  it('uses the in-game wording and shows service fee and total cost', () => {
    render(<PaidTransfersEditor session={{ ...base, paidTransfers: [transfer()] }} lang="de" onChange={vi.fn()} />);
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Transfer service fee 1')).toBeChecked();
    expect(screen.getByText('0,5 % Service Fee berücksichtigen')).toBeInTheDocument();
    expect(screen.getByLabelText('Transfer total cost 1')).toHaveTextContent('Service Fee: 500 aUEC · Total Cost: 100.500 aUEC');
    expect(screen.queryByText(/Bezahlte Gebühr|Netto erhalten/)).not.toBeInTheDocument();
  });

  it('adds the fee on top of the entered amount when the checkbox is on', () => {
    const onChange = vi.fn();
    render(<PaidTransfersEditor session={{ ...base, paidTransfers: [transfer()] }} lang="en" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Transfer amount 1'), { target: { value: '248656' } });
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({ netAmount: 248_656, feeAmount: 1244, feeIncluded: true });
  });

  it('records no fee when the checkbox is turned off, and recomputes it when turned on', () => {
    const onChange = vi.fn();
    const { rerender } = render(<PaidTransfersEditor session={{ ...base, paidTransfers: [transfer()] }} lang="en" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Transfer service fee 1'));
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({ netAmount: 100_000, feeAmount: 0, feeIncluded: false });

    rerender(<PaidTransfersEditor session={{ ...base, paidTransfers: [transfer({ feeAmount: 0, feeIncluded: false })] }} lang="en" onChange={onChange} />);
    expect(screen.getByLabelText('Transfer total cost 1')).toHaveTextContent('Service Fee: 0 aUEC · Total Cost: 100,000 aUEC');
    fireEvent.change(screen.getByLabelText('Transfer amount 1'), { target: { value: '200000' } });
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({ netAmount: 200_000, feeAmount: 0, feeIncluded: false });
    fireEvent.click(screen.getByLabelText('Transfer service fee 1'));
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({ netAmount: 100_000, feeAmount: 500, feeIncluded: true });
  });

  it('keeps a manually entered fee from older sessions until the transfer is edited', () => {
    const onChange = vi.fn();
    render(<PaidTransfersEditor session={{ ...base, paidTransfers: [transfer({ feeAmount: 100, feeIncluded: undefined })] }} lang="de" onChange={onChange} />);
    expect(screen.getByLabelText('Transfer service fee 1')).toBeChecked();
    expect(screen.getByLabelText('Transfer total cost 1')).toHaveTextContent('Service Fee: 100 aUEC · Total Cost: 100.100 aUEC');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('starts new transfers with the session-wide service fee setting', () => {
    const onChange = vi.fn();
    const { rerender } = render(<PaidTransfersEditor session={base} lang="de" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Transfer erfassen' }));
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({ netAmount: 0, feeAmount: 0, feeIncluded: true });

    rerender(<PaidTransfersEditor session={{ ...base, taxEnabled: false }} lang="de" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Transfer erfassen' }));
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({ feeIncluded: false });
  });
});
