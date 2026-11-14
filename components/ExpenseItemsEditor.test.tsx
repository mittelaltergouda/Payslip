import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseItemsEditor } from './ExpenseItemsEditor';
import type { IndividualExpenseInput } from '@/lib/types';
import { format } from '@/lib/format';

const t = { expenses: 'Kosten', expensesLabel: 'Kosten', addExpense: '+ Kosten', remove: 'Entfernen', for: 'für', label: 'Bezeichnung', amount: 'Betrag', total: 'Summe' };

function setup(expenses: IndividualExpenseInput[], variant: 'row' | 'card' = 'row') {
  const callbacks = { addIndividualExpense: vi.fn(), updateIndividualExpense: vi.fn(), removeIndividualExpense: vi.fn() };
  const utils = render(<ExpenseItemsEditor memberId="m1" handle="Pilot" expenses={expenses} lang="de" t={t} format={format} rowIndex={0} variant={variant} {...callbacks} />);
  return { ...utils, ...callbacks };
}

describe('ExpenseItemsEditor uses the revenue/investment pattern', () => {
  it('shows an open amount field and a small add button without expenses', () => {
    const { container } = setup([]);
    const field = screen.getByLabelText('Kosten Pilot', { selector: 'input' });
    expect(field).toHaveAttribute('data-nav-col', 'expenses');
    expect(container.querySelector('input[value="Kosten"]')).toBeNull();
    expect(screen.getByRole('button', { name: '+ Kosten' })).toHaveClass('btn', 'text-xs', 'self-start');
    expect(screen.getByText('Σ 0')).toBeInTheDocument();
  });

  it('creates the first expense when typing into the open field', () => {
    const { addIndividualExpense } = setup([]);
    fireEvent.change(screen.getByLabelText('Kosten Pilot', { selector: 'input' }), { target: { value: '2500' } });
    expect(addIndividualExpense).toHaveBeenCalledWith('m1', { amount: 2500 });
  });

  it('keeps editing the same expense in the open field afterwards', () => {
    const { updateIndividualExpense, addIndividualExpense } = setup([{ id: 'e1', memberId: 'm1', label: 'Kosten', amount: 2500 }]);
    const field = screen.getByLabelText('Kosten Pilot', { selector: 'input' });
    fireEvent.change(field, { target: { value: '25000' } });
    expect(updateIndividualExpense).toHaveBeenCalledWith('e1', { amount: 25000 });
    expect(addIndividualExpense).not.toHaveBeenCalled();
    expect(screen.getByText('Σ 2.500')).toBeInTheDocument();
  });

  it('switches to labelled positions when adding', () => {
    const { addIndividualExpense, rerender } = setup([{ id: 'e1', memberId: 'm1', label: 'Kosten', amount: 2500 }]);
    fireEvent.click(screen.getByRole('button', { name: '+ Kosten' }));
    expect(addIndividualExpense).toHaveBeenCalledWith('m1');
    rerender(<ExpenseItemsEditor memberId="m1" handle="Pilot" expenses={[{ id: 'e1', memberId: 'm1', label: 'Kosten', amount: 2500 }, { id: 'e2', memberId: 'm1', label: 'Kosten', amount: 0 }]} lang="de" t={t} format={format} rowIndex={0} addIndividualExpense={vi.fn()} updateIndividualExpense={vi.fn()} removeIndividualExpense={vi.fn()} />);
    expect(screen.getAllByDisplayValue('Kosten')).toHaveLength(2);
  });

  it('shows labelled expenses as rows with remove buttons', () => {
    const { removeIndividualExpense } = setup([{ id: 'e1', memberId: 'm1', label: 'Treibstoff', amount: 1000 }, { id: 'e2', memberId: 'm1', label: 'Munition', amount: 500 }]);
    expect(screen.getByDisplayValue('Treibstoff')).toBeInTheDocument();
    expect(screen.getByText('Σ 1.500')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Entfernen Kosten für Pilot' })[1]);
    expect(removeIndividualExpense).toHaveBeenCalledWith('e2');
  });

  it('shows a single expense with its own label as a row, not hidden in the open field', () => {
    setup([{ id: 'e1', memberId: 'm1', label: 'Treibstoff', amount: 1000 }]);
    expect(screen.getByDisplayValue('Treibstoff')).toBeInTheDocument();
  });

  it('renders the same pattern in the mobile card', () => {
    const { addIndividualExpense } = setup([], 'card');
    fireEvent.change(screen.getByLabelText('Kosten Pilot', { selector: 'input' }), { target: { value: '300' } });
    expect(addIndividualExpense).toHaveBeenCalledWith('m1', { amount: 300 });
    expect(screen.getByRole('button', { name: '+ Kosten für Pilot' })).toBeInTheDocument();
  });
});
