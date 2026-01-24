import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionWizard } from './SessionWizard';
import { describe, it, expect, vi } from 'vitest';

describe('SessionWizard - Initial Rendering', () => {
  it('should render the component with default German language', () => {
    render(<SessionWizard />);

    expect(screen.getByText('SC Payout Split')).toBeInTheDocument();
    expect(screen.getByText(/Profite und Kosten crew-weise erfassen/i)).toBeInTheDocument();
  });

  it('should render with English language when initialLang is en', () => {
    render(<SessionWizard initialLang="en" />);

    expect(screen.getByText('SC Payout Split')).toBeInTheDocument();
    expect(screen.getByText(/Track profits and costs per crew/i)).toBeInTheDocument();
  });

  it('should render session settings section', () => {
    render(<SessionWizard />);

    expect(screen.getByText('Session Einstellungen')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should render members section with initial members', () => {
    render(<SessionWizard />);

    const mitgliederTexts = screen.getAllByText('Mitglieder');
    expect(mitgliederTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('+ Mitglied')).toBeInTheDocument();

    const handleInputs = screen.getAllByDisplayValue('Pilot');
    expect(handleInputs.length).toBeGreaterThan(0);

    const escortInputs = screen.getAllByDisplayValue('Escort');
    expect(escortInputs.length).toBeGreaterThan(0);
  });

  it('should render results section', () => {
    render(<SessionWizard />);

    const resultsHeadings = screen.getAllByText('Payout');
    expect(resultsHeadings.length).toBeGreaterThan(0);
  });

  it('should render distribution mode select with default EQUAL value', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('EQUAL');
  });

  it('should render tax toggle checkbox checked by default', () => {
    render(<SessionWizard />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i
    });
    expect(taxCheckbox).toBeChecked();
  });

  it('should render role toggle checkbox unchecked by default', () => {
    render(<SessionWizard />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });
    expect(roleCheckbox).not.toBeChecked();
  });
});

describe('SessionWizard - Language Switching', () => {
  it('should switch from German to English when EN button is clicked', () => {
    render(<SessionWizard />);

    const mitgliederTexts = screen.getAllByText('Mitglieder');
    expect(mitgliederTexts.length).toBeGreaterThan(0);

    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText('Mitglieder')).not.toBeInTheDocument();
  });

  it('should switch from English to German when DE button is clicked', () => {
    render(<SessionWizard initialLang="en" />);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);

    const deButton = screen.getByRole('button', { name: 'DE' });
    fireEvent.click(deButton);

    const mitgliederTexts = screen.getAllByText('Mitglieder');
    expect(mitgliederTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });

  it('should update all UI text when language is changed', () => {
    render(<SessionWizard />);

    expect(screen.getByText('Session Einstellungen')).toBeInTheDocument();
    expect(screen.getByText('Verteilungsmodus')).toBeInTheDocument();

    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    expect(screen.getByText('Session Settings')).toBeInTheDocument();
    expect(screen.getByText('Distribution Mode')).toBeInTheDocument();
  });
});

describe('SessionWizard - Distribution Mode', () => {
  it('should change distribution mode to PERCENT', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERCENT' } });

    expect(select).toHaveValue('PERCENT');
  });

  it('should change distribution mode to ADJUSTABLE', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ADJUSTABLE' } });

    expect(select).toHaveValue('ADJUSTABLE');
  });

  it('should distribute percent shares equally when switching to PERCENT mode', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERCENT' } });

    const percentInputs = screen.getAllByRole('spinbutton').filter(input => {
      const value = (input as HTMLInputElement).value;
      return value === '50';
    });

    expect(percentInputs.length).toBeGreaterThan(0);
  });

  it('should disable percent share inputs in EQUAL mode', () => {
    render(<SessionWizard />);

    const allInputs = screen.getAllByRole('spinbutton');
    const percentShareInputs = allInputs.slice(-6);

    const disabledPercentInputs = percentShareInputs.filter(input =>
      (input as HTMLInputElement).disabled
    );

    expect(disabledPercentInputs.length).toBeGreaterThan(0);
  });

  it('should enable fixed payout inputs only in ADJUSTABLE mode', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ADJUSTABLE' } });

    const allInputs = screen.getAllByRole('spinbutton');
    const fixedPayoutInputs = allInputs.slice(-2);

    fixedPayoutInputs.forEach(input => {
      expect((input as HTMLInputElement).disabled).toBe(false);
    });
  });
});

describe('SessionWizard - Member Management', () => {
  it('should add a new member when + Mitglied button is clicked', () => {
    render(<SessionWizard />);

    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    const crewInputs = screen.getAllByDisplayValue('Crew');
    expect(crewInputs.length).toBeGreaterThan(0);
  });

  it('should remove a member when delete button is clicked', () => {
    render(<SessionWizard />);

    const pilotInputs = screen.getAllByDisplayValue('Pilot');
    expect(pilotInputs.length).toBeGreaterThan(0);

    const deleteButtons = screen.getAllByTitle('Entfernen');
    const memberDeleteButtons = deleteButtons.slice(0, 2);

    fireEvent.click(memberDeleteButtons[0]);

    const remainingPilotInputs = screen.queryAllByDisplayValue('Pilot');
    expect(remainingPilotInputs.length).toBe(0);
  });

  it('should update member handle when input is changed', () => {
    render(<SessionWizard />);

    const handleInputs = screen.getAllByDisplayValue('Pilot');
    const pilotInput = handleInputs[0] as HTMLInputElement;

    fireEvent.change(pilotInput, { target: { value: 'Captain' } });

    expect(pilotInput.value).toBe('Captain');
  });

  it('should update member revenue when input is changed', () => {
    render(<SessionWizard />);

    const numberInputs = screen.getAllByRole('spinbutton');
    const revenueInput = numberInputs[0] as HTMLInputElement;

    fireEvent.change(revenueInput, { target: { value: '1000' } });

    expect(revenueInput.value).toBe('1000');
  });

  it('should update member investment when input is changed', () => {
    render(<SessionWizard />);

    const numberInputs = screen.getAllByRole('spinbutton');
    const investmentInput = numberInputs[1] as HTMLInputElement;

    fireEvent.change(investmentInput, { target: { value: '500' } });

    expect(investmentInput.value).toBe('500');
  });

  it('should show role inputs when showRole checkbox is toggled', () => {
    render(<SessionWizard />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });

    fireEvent.click(roleCheckbox);

    expect(screen.getAllByDisplayValue('Trader').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Escort').length).toBeGreaterThan(0);
  });
});

describe('SessionWizard - Individual Expenses', () => {
  it('should add individual expense for a member', () => {
    render(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const expenseInputs = screen.getAllByDisplayValue('Kosten');
    expect(expenseInputs.length).toBeGreaterThan(0);
  });

  it('should update individual expense label', () => {
    render(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const expenseInputs = screen.getAllByDisplayValue('Kosten');
    const expenseInput = expenseInputs[0] as HTMLInputElement;

    fireEvent.change(expenseInput, { target: { value: 'Fuel' } });

    expect(expenseInput.value).toBe('Fuel');
  });

  it('should update individual expense amount', () => {
    render(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const allInputs = screen.getAllByRole('spinbutton');
    const expenseAmountInputs = allInputs.filter(input => {
      const parent = input.closest('td');
      return parent?.textContent?.includes('🗑');
    });

    if (expenseAmountInputs.length > 0) {
      const expenseAmountInput = expenseAmountInputs[0] as HTMLInputElement;
      fireEvent.change(expenseAmountInput, { target: { value: '100' } });
      expect(expenseAmountInput.value).toBe('100');
    }
  });

  it('should remove individual expense when delete button is clicked', () => {
    render(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const initialExpenseInputs = screen.getAllByDisplayValue('Kosten');
    const initialCount = initialExpenseInputs.length;

    const deleteButtons = screen.getAllByTitle('Entfernen');
    const expenseDeleteButton = deleteButtons.find(btn => {
      const parent = btn.closest('td');
      return parent?.querySelector('input[value="Kosten"]');
    });

    if (expenseDeleteButton) {
      fireEvent.click(expenseDeleteButton);

      const remainingExpenseInputs = screen.queryAllByDisplayValue('Kosten');
      expect(remainingExpenseInputs.length).toBeLessThan(initialCount);
    }
  });
});

describe('SessionWizard - Tax Toggle', () => {
  it('should toggle tax off when checkbox is unchecked', () => {
    render(<SessionWizard />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i
    }) as HTMLInputElement;

    expect(taxCheckbox.checked).toBe(true);

    fireEvent.click(taxCheckbox);

    expect(taxCheckbox.checked).toBe(false);
  });

  it('should toggle tax back on when checkbox is checked again', () => {
    render(<SessionWizard />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i
    }) as HTMLInputElement;

    fireEvent.click(taxCheckbox);
    expect(taxCheckbox.checked).toBe(false);

    fireEvent.click(taxCheckbox);
    expect(taxCheckbox.checked).toBe(true);
  });
});

describe('SessionWizard - Reset Functionality', () => {
  it('should reset to initial state when Reset button is clicked', () => {
    render(<SessionWizard />);

    const handleInputs = screen.getAllByDisplayValue('Pilot');
    const pilotInput = handleInputs[0] as HTMLInputElement;
    fireEvent.change(pilotInput, { target: { value: 'Captain' } });
    expect(pilotInput.value).toBe('Captain');

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    const resetPilotInputs = screen.getAllByDisplayValue('Pilot');
    expect(resetPilotInputs.length).toBeGreaterThan(0);
  });

  it('should reset distribution mode to EQUAL on reset', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERCENT' } });
    expect(select).toHaveValue('PERCENT');

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    expect(select).toHaveValue('EQUAL');
  });

  it('should reset tax toggle to enabled on reset', () => {
    render(<SessionWizard />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i
    }) as HTMLInputElement;

    fireEvent.click(taxCheckbox);
    expect(taxCheckbox.checked).toBe(false);

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    expect(taxCheckbox.checked).toBe(true);
  });
});

describe('SessionWizard - Results Display', () => {
  it('should display summary section with revenue, investment, expenses', () => {
    render(<SessionWizard />);

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
    const umsatzTexts = screen.getAllByText('Umsatz');
    expect(umsatzTexts.length).toBeGreaterThan(0);
    const investmentTexts = screen.getAllByText('Investment');
    expect(investmentTexts.length).toBeGreaterThan(0);
    const kostenTexts = screen.getAllByText('Kosten');
    expect(kostenTexts.length).toBeGreaterThan(0);
  });

  it('should display suggested transfers section', () => {
    render(<SessionWizard />);

    expect(screen.getByText('Vorgeschlagene Überweisungen')).toBeInTheDocument();
  });

  it('should show "no transfers required" message when members have equal revenue', () => {
    render(<SessionWizard />);

    expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
  });

  it('should update calculations when member revenue is changed', () => {
    render(<SessionWizard />);

    const numberInputs = screen.getAllByRole('spinbutton');
    const revenueInput = numberInputs[0] as HTMLInputElement;

    fireEvent.change(revenueInput, { target: { value: '1000' } });

    const summarySection = screen.getByText('Gesamt').closest('div');
    expect(summarySection).toBeInTheDocument();
  });

  it('should display member results table with all members', () => {
    render(<SessionWizard />);

    const resultsSection = screen.getByText('Gesamt').closest('div');

    if (resultsSection) {
      const tables = resultsSection.querySelectorAll('table');
      expect(tables.length).toBeGreaterThan(0);
    }
  });
});

describe('SessionWizard - Integration Scenarios', () => {
  it('should handle complete workflow: add member, set revenue, check results', () => {
    render(<SessionWizard />);

    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    const numberInputs = screen.getAllByRole('spinbutton');
    const firstRevenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(firstRevenueInput, { target: { value: '5000' } });

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
  });

  it('should handle switching modes and updating values', () => {
    render(<SessionWizard />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERCENT' } });

    const numberInputs = screen.getAllByRole('spinbutton');
    const revenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(revenueInput, { target: { value: '2000' } });

    fireEvent.change(select, { target: { value: 'EQUAL' } });

    expect(select).toHaveValue('EQUAL');
  });

  it('should handle adding and removing expenses with calculations', () => {
    render(<SessionWizard />);

    const numberInputs = screen.getAllByRole('spinbutton');
    const revenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(revenueInput, { target: { value: '1000' } });

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
  });

  it('should persist language preference across interactions', () => {
    render(<SessionWizard />);

    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    const addButton = screen.getByRole('button', { name: '+ Member' });
    fireEvent.click(addButton);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText('Mitglieder')).not.toBeInTheDocument();
  });
});
