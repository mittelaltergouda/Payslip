import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsDisplay } from './ResultsDisplay';
import { calculatePayslip } from '@/lib/calc';
import type { SessionInput } from '@/lib/types';
const session: SessionInput = { name: 'Test', type: 'TRADING', distributionMode: 'EQUAL', members: [{ id: 'a', handle: 'A', revenue: 1000 }, { id: 'b', handle: 'B' }] };
describe('accounting input and explanation UI', () => {
 it('offers labelled rows, preserves scalar on first add, and removes the last row to zero', async () => {
  const path = './MoneyItemsEditor';
  const { MoneyItemsEditor } = await import(path);
  const onChange = vi.fn();
  const { rerender } = render(<MoneyItemsEditor member={session.members[0]} kind="revenue" lang="en" onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add revenue' }));
  const patch = onChange.mock.calls[0][0];
  expect(patch.revenues.map((x: { amount: number }) => x.amount)).toEqual([1000, 0]);
  rerender(<MoneyItemsEditor member={{ ...session.members[0], revenues: [{ label: 'Sale', amount: 25 }] }} kind="revenue" lang="en" onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('revenue label 1'), { target: { value: 'Cargo' } });
  expect(onChange.mock.calls.at(-1)?.[0].revenues[0].label).toBe('Cargo');
  fireEvent.click(screen.getByRole('button', { name: 'Remove revenue 1' }));
  expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ revenues: [], revenue: 0 });
 });
 it('edits and removes recorded transfers with explicit kind and fee', async () => {
  const path = './PaidTransfersEditor';
  const { PaidTransfersEditor } = await import(path);
  const onChange = vi.fn();
  render(<PaidTransfersEditor session={{ ...session, paidTransfers: [{ label: 'Advance', fromMemberId: 'a', toMemberId: 'b', netAmount: 100, feeAmount: 1 }] }} lang="en" onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Transfer kind 1'), { target: { value: 'COST_CONTRIBUTION' } });
  expect(onChange.mock.calls.at(-1)?.[0][0].kind).toBe('COST_CONTRIBUTION');
  fireEvent.click(screen.getByRole('button', { name: 'Remove transfer 1' }));
  expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);
 });
 it('shows the complete arithmetic in an expandable section', () => {
  render(<ResultsDisplay session={session} result={calculatePayslip(session)} error={null} translations={{}} lang="en" />);
  const summary = screen.getByText('Calculation explained');
  expect(summary.closest('details')).not.toHaveAttribute('open');
  fireEvent.click(summary);
  expect(screen.getByText('Profit: 1000 - 0 - 0 - 0 = 1000')).toBeInTheDocument();
 });
});
