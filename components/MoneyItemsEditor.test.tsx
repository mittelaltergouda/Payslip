import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MoneyItemsEditor } from './MoneyItemsEditor';
import type { MemberInput } from '@/lib/types';

const member: MemberInput = { id: 'a', handle: 'Pilot', revenue: 1500 };
const itemized: MemberInput = {
  ...member,
  revenues: [
    { id: 'r1', label: 'Cargo', amount: 3000 },
    { id: 'r2', label: 'Bounty', amount: 2000 },
  ],
};

describe('MoneyItemsEditor layout mirrors the expense editor', () => {
  it('shows the Σ total even before any position exists', () => {
    render(<MoneyItemsEditor member={member} kind="revenue" lang="en" onChange={vi.fn()} />);
    expect(screen.getByText('Σ 1,500')).toBeInTheDocument();
  });

  it('formats the Σ total like the expense column (German separators)', () => {
    render(<MoneyItemsEditor member={itemized} kind="revenue" lang="de" onChange={vi.fn()} />);
    expect(screen.getByText('Σ 5.000')).toBeInTheDocument();
  });

  it('keeps the add button as a full-width column entry below the positions, like expenses', () => {
    render(<MoneyItemsEditor member={itemized} kind="revenue" lang="de" onChange={vi.fn()} />);
    const group = screen.getByRole('group', { name: 'Umsatz Pilot' });
    expect(group).toHaveClass('flex', 'flex-col');
    const add = within(group).getByRole('button', { name: 'Add revenue' });
    expect(add).toHaveTextContent('+ Umsatz');
    expect(add).toHaveClass('btn', 'text-xs');
    const children = Array.from(group.children);
    expect(children.indexOf(add)).toBe(children.length - 2);
  });

  it('uses the expense styling for position rows in the table', () => {
    render(<MoneyItemsEditor member={itemized} kind="revenue" lang="en" onChange={vi.fn()} />);
    expect(screen.getByLabelText('revenue label 1')).toHaveClass('input', 'flex-1');
    expect(screen.getByLabelText('revenue amount 1')).toHaveClass('input', 'w-24');
    expect(screen.getByRole('button', { name: 'Remove revenue 1' })).toHaveClass('text-red-400', 'text-xl');
  });

  it('renders the mobile card variant with the same controls and behaviour', () => {
    const onChange = vi.fn();
    render(<MoneyItemsEditor member={itemized} kind="investment" lang="en" variant="card" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add investment' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ investments: [expect.objectContaining({ label: 'investment', amount: 0 })], investment: 0 }));
  });

  it('does not keep an empty "previous amount" row when the first position is added to a zero amount', () => {
    const onChange = vi.fn();
    render(<MoneyItemsEditor member={{ id: 'b', handle: 'Escort' }} kind="revenue" lang="de" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add revenue' }));
    const patch = onChange.mock.calls[0][0];
    expect(patch.revenues).toHaveLength(1);
    expect(patch.revenues[0]).toMatchObject({ label: 'Umsatz', amount: 0 });
    expect(patch.revenue).toBe(0);
  });

  it('keeps a non-zero legacy amount as the first position when adding (lossless)', () => {
    const onChange = vi.fn();
    render(<MoneyItemsEditor member={{ id: 'c', handle: 'Miner', investment: 750 }} kind="investment" lang="de" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add investment' }));
    const patch = onChange.mock.calls[0][0];
    expect(patch.investments.map((x: { label: string; amount: number }) => [x.label, x.amount])).toEqual([['Bisheriger Betrag', 750], ['Investment', 0]]);
    expect(patch.investment).toBe(750);
  });

  it('removes a position in the card variant and updates the total', () => {
    const onChange = vi.fn();
    render(<MoneyItemsEditor member={itemized} kind="revenue" lang="en" variant="card" onChange={onChange} />);
    expect(screen.getByText('Σ 5,000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove revenue 1' }));
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ revenues: [{ id: 'r2', label: 'Bounty', amount: 2000 }], revenue: 2000 });
  });
});
