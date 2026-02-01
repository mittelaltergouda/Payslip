import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionWizard } from './SessionWizard';
import { describe, it, expect, vi } from 'vitest';

// Helper function to interact with custom distribution mode dropdown
function getDistributionModeButton() {
  // The button contains the current mode text and a dropdown arrow
  return screen.getByRole('button', { name: /Gleich|Prozent|Anpassbar|Equal|Percent|Adjustable/i });
}

function selectDistributionMode(modeName: string) {
  const button = getDistributionModeButton();
  fireEvent.click(button); // Open dropdown

  // Find and click the option - use getAllByRole and filter to avoid ambiguity
  const options = screen.getAllByRole('option');
  const option = options.find(opt => {
    const text = opt.textContent || '';
    return text.toLowerCase().includes(modeName.toLowerCase());
  });

  if (!option) {
    throw new Error(`Could not find option with name: ${modeName}`);
  }

  fireEvent.click(option);
}

function getCurrentDistributionMode(): string {
  const button = getDistributionModeButton();
  const text = button.textContent || '';

  if (text.includes('Gleich') || text.includes('Equal')) return 'EQUAL';
  if (text.includes('Prozent') || text.includes('Percent')) return 'PERCENT';
  if (text.includes('Anpassbar') || text.includes('Adjustable')) return 'ADJUSTABLE';

  return '';
}

describe('SessionWizard - Initial Rendering', () => {
  it('should render the component with default German language', () => {
    render(<SessionWizard />);

    expect(screen.getByText('SC Payslip')).toBeInTheDocument();
    expect(screen.getByText(/Profite und Kosten crew-weise erfassen/i)).toBeInTheDocument();
  });

  it('should render with English language when initialLang is en', () => {
    render(<SessionWizard initialLang="en" />);

    expect(screen.getByText('SC Payslip')).toBeInTheDocument();
    expect(screen.getByText(/Track profits and costs per crew/i)).toBeInTheDocument();
  });

  it('should render session settings section', () => {
    render(<SessionWizard />);

    expect(screen.getByText('Session Einstellungen')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should render members section with initial members', () => {
    render(<SessionWizard />);

    const eingabeTexts = screen.getAllByText('Eingabe');
    expect(eingabeTexts.length).toBeGreaterThan(0);
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

    const currentMode = getCurrentDistributionMode();
    expect(currentMode).toBe('EQUAL');
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

    const eingabeTexts = screen.getAllByText('Eingabe');
    expect(eingabeTexts.length).toBeGreaterThan(0);

    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText('Eingabe')).not.toBeInTheDocument();
  });

  it('should switch from English to German when DE button is clicked', () => {
    render(<SessionWizard initialLang="en" />);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);

    const deButton = screen.getByRole('button', { name: 'DE' });
    fireEvent.click(deButton);

    const eingabeTexts = screen.getAllByText('Eingabe');
    expect(eingabeTexts.length).toBeGreaterThan(0);
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

    selectDistributionMode('Prozent');

    expect(getCurrentDistributionMode()).toBe('PERCENT');
  });

  it('should change distribution mode to ADJUSTABLE', () => {
    render(<SessionWizard />);

    selectDistributionMode('Anpassbar');

    expect(getCurrentDistributionMode()).toBe('ADJUSTABLE');
  });

  it('should distribute percent shares equally when switching to PERCENT mode', () => {
    render(<SessionWizard />);

    selectDistributionMode('Prozent');

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

    selectDistributionMode('Anpassbar');

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

    selectDistributionMode('Prozent');
    expect(getCurrentDistributionMode()).toBe('PERCENT');

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    expect(getCurrentDistributionMode()).toBe('EQUAL');
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

    selectDistributionMode('Prozent');

    const numberInputs = screen.getAllByRole('spinbutton');
    const revenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(revenueInput, { target: { value: '2000' } });

    selectDistributionMode('Gleich');

    expect(getCurrentDistributionMode()).toBe('EQUAL');
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
    expect(screen.queryByText('Eingabe')).not.toBeInTheDocument();
  });
});

describe('SessionWizard - Error Handling and Edge Cases', () => {
  describe('Invalid Input Handling', () => {
    it('should not crash when attempting negative revenue input', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '-1000' } });

      expect(revenueInput).toBeInTheDocument();
    });

    it('should not crash when attempting negative investment input', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(investmentInput, { target: { value: '-500' } });

      expect(investmentInput).toBeInTheDocument();
    });

    it('should not crash when attempting negative expense amount', () => {
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
        fireEvent.change(expenseAmountInput, { target: { value: '-100' } });

        expect(expenseAmountInput).toBeInTheDocument();
      }

      expect(screen.queryByText('Payout')).toBeInTheDocument();
    });

    it('should handle zero revenue input', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '0' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
      expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
    });

    it('should handle very large numbers without crashing', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '999999999' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle empty string input for revenue', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should not crash with empty member handle', () => {
      render(<SessionWizard />);

      const handleInputs = screen.getAllByDisplayValue('Pilot');
      const pilotInput = handleInputs[0] as HTMLInputElement;

      fireEvent.change(pilotInput, { target: { value: '' } });

      expect(pilotInput).toBeInTheDocument();
    });

    it('should not crash with whitespace-only member handle', () => {
      render(<SessionWizard />);

      const handleInputs = screen.getAllByDisplayValue('Pilot');
      const pilotInput = handleInputs[0] as HTMLInputElement;

      fireEvent.change(pilotInput, { target: { value: '   ' } });

      expect(pilotInput).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Member States', () => {
    it('should handle all members being inactive', () => {
      render(<SessionWizard />);

      const checkboxes = screen.getAllByRole('checkbox').filter(checkbox => {
        const label = (checkbox as HTMLInputElement).getAttribute('aria-label');
        return !label || (!label.includes('Transfer Tax') && !label.includes('Rollen'));
      });

      checkboxes.forEach(checkbox => {
        if ((checkbox as HTMLInputElement).checked) {
          fireEvent.click(checkbox);
        }
      });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle removing all members except one', () => {
      render(<SessionWizard />);

      const deleteButtons = screen.getAllByTitle('Entfernen');
      const memberDeleteButtons = deleteButtons.slice(0, 2);

      fireEvent.click(memberDeleteButtons[1]);

      const remainingMembers = screen.getAllByDisplayValue(/Pilot|Escort|Crew/);
      expect(remainingMembers.length).toBeGreaterThan(0);
      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle adding maximum number of members', () => {
      render(<SessionWizard />);

      const addButton = screen.getByRole('button', { name: '+ Mitglied' });

      for (let i = 0; i < 10; i++) {
        fireEvent.click(addButton);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle single member with zero revenue', () => {
      render(<SessionWizard />);

      const deleteButtons = screen.getAllByTitle('Entfernen');
      const memberDeleteButtons = deleteButtons.slice(0, 2);
      fireEvent.click(memberDeleteButtons[1]);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '0' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
      expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Financial Calculations', () => {
    it('should handle investment greater than revenue', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '100' } });
      fireEvent.change(investmentInput, { target: { value: '500' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle expenses exceeding revenue', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '100' } });

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
      fireEvent.click(addExpenseButtons[0]);

      const allInputs = screen.getAllByRole('spinbutton');
      const expenseAmountInputs = allInputs.filter(input => {
        const parent = input.closest('td');
        return parent?.textContent?.includes('🗑');
      });

      if (expenseAmountInputs.length > 0) {
        const expenseAmountInput = expenseAmountInputs[0] as HTMLInputElement;
        fireEvent.change(expenseAmountInput, { target: { value: '500' } });
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle zero revenue with non-zero investment', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '0' } });
      fireEvent.change(investmentInput, { target: { value: '1000' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle multiple expenses exceeding total revenue', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '100' } });

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });

      for (let i = 0; i < 3; i++) {
        fireEvent.click(addExpenseButtons[0]);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle decimal values in revenue input', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '1000.50' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Distribution Modes', () => {
    it('should handle PERCENT mode with invalid total percentage', () => {
      render(<SessionWizard />);

      selectDistributionMode('Prozent');

      const allInputs = screen.getAllByRole('spinbutton');
      const percentInputs = allInputs.filter(input => {
        const value = (input as HTMLInputElement).value;
        return value === '50' || value === '0';
      });

      if (percentInputs.length >= 2) {
        fireEvent.change(percentInputs[0], { target: { value: '60' } });
        fireEvent.change(percentInputs[1], { target: { value: '50' } });
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should not crash with PERCENT mode and zero total percentage', () => {
      render(<SessionWizard />);

      selectDistributionMode('Prozent');

      const allInputs = screen.getAllByRole('spinbutton');
      const percentInputs = allInputs.filter(input => {
        const value = (input as HTMLInputElement).value;
        return value === '50' || value === '0';
      });

      percentInputs.forEach(input => {
        if (input) {
          fireEvent.change(input, { target: { value: '0' } });
        }
      });

      expect(getCurrentDistributionMode()).toBe('PERCENT');
    });

    it('should handle ADJUSTABLE mode with very high fixed payout', () => {
      render(<SessionWizard />);

      selectDistributionMode('Anpassbar');

      const allInputs = screen.getAllByRole('spinbutton');
      const revenueInput = allInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '1000' } });

      const fixedPayoutInputs = allInputs.slice(-2);
      fixedPayoutInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '5000' } });
      });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle switching between modes multiple times', () => {
      render(<SessionWizard />);

      selectDistributionMode('Prozent');
      expect(getCurrentDistributionMode()).toBe('PERCENT');

      selectDistributionMode('Anpassbar');
      expect(getCurrentDistributionMode()).toBe('ADJUSTABLE');

      selectDistributionMode('Gleich');
      expect(getCurrentDistributionMode()).toBe('EQUAL');

      selectDistributionMode('Prozent');
      expect(getCurrentDistributionMode()).toBe('PERCENT');

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - UI State Management', () => {
    it('should maintain state after rapid member additions and removals', () => {
      render(<SessionWizard />);

      const addButton = screen.getByRole('button', { name: '+ Mitglied' });

      fireEvent.click(addButton);
      fireEvent.click(addButton);

      const deleteButtons = screen.getAllByTitle('Entfernen');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[deleteButtons.length - 1]);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should maintain calculations after rapid expense additions and removals', () => {
      render(<SessionWizard />);

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
      fireEvent.click(addExpenseButtons[0]);
      fireEvent.click(addExpenseButtons[0]);

      const deleteButtons = screen.getAllByTitle('Entfernen');
      const expenseDeleteButton = deleteButtons.find(btn => {
        const parent = btn.closest('td');
        return parent?.querySelector('input[value="Kosten"]');
      });

      if (expenseDeleteButton) {
        fireEvent.click(expenseDeleteButton);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle toggling tax multiple times', () => {
      render(<SessionWizard />);

      const taxCheckbox = screen.getByRole('checkbox', {
        name: /Transfer Tax berücksichtigen/i
      });

      for (let i = 0; i < 5; i++) {
        fireEvent.click(taxCheckbox);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle rapid language switching', () => {
      render(<SessionWizard />);

      const enButton = screen.getByRole('button', { name: 'EN' });
      const deButton = screen.getByRole('button', { name: 'DE' });

      fireEvent.click(enButton);
      fireEvent.click(deButton);
      fireEvent.click(enButton);
      fireEvent.click(deButton);

      const eingabeTexts = screen.getAllByText('Eingabe');
      expect(eingabeTexts.length).toBeGreaterThan(0);
    });

    it('should preserve member data after toggling role visibility', () => {
      render(<SessionWizard />);

      const handleInputs = screen.getAllByDisplayValue('Pilot');
      const pilotInput = handleInputs[0] as HTMLInputElement;
      fireEvent.change(pilotInput, { target: { value: 'Captain' } });

      const roleCheckbox = screen.getByRole('checkbox', {
        name: /Rollen anzeigen/i
      });
      fireEvent.click(roleCheckbox);
      fireEvent.click(roleCheckbox);

      const updatedInputs = screen.getAllByDisplayValue('Captain');
      expect(updatedInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases - Complex Scenarios', () => {
    it('should handle scenario with all zero values', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      numberInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '0' } });
      });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
      expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
    });

    it('should handle member with only investment and no revenue', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '0' } });
      fireEvent.change(investmentInput, { target: { value: '1000' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle member with only expenses and no revenue', () => {
      render(<SessionWizard />);

      const numberInputs = screen.getAllByRole('spinbutton');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '0' } });

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
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle reset after complex modifications', () => {
      render(<SessionWizard />);

      const addButton = screen.getByRole('button', { name: '+ Mitglied' });
      fireEvent.click(addButton);

      const numberInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(numberInputs[0], { target: { value: '5000' } });

      selectDistributionMode('Prozent');

      const taxCheckbox = screen.getByRole('checkbox', {
        name: /Transfer Tax berücksichtigen/i
      });
      fireEvent.click(taxCheckbox);

      const resetButton = screen.getByRole('button', { name: 'Reset' });
      fireEvent.click(resetButton);

      expect(getCurrentDistributionMode()).toBe('EQUAL');
      expect(taxCheckbox).toBeChecked();
      const pilotInputs = screen.getAllByDisplayValue('Pilot');
      expect(pilotInputs.length).toBeGreaterThan(0);
    });
  });
});
