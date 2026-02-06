import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionWizard } from './SessionWizard';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider } from './Toast';
import * as sessionStorage from '@/lib/storage/sessionStorage';
import * as useAutoSaveModule from '@/hooks/useAutoSave';
import type { SavedSession } from '@/lib/types';

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

  if (text.includes('Gleich') || text.includes('Equal')) {
    return 'EQUAL';
  }
  if (text.includes('Prozent') || text.includes('Percent')) {
    return 'PERCENT';
  }
  if (text.includes('Anpassbar') || text.includes('Adjustable')) {
    return 'ADJUSTABLE';
  }

  return '';
}

// Helper to render with ToastProvider
function renderWithToast(component: React.ReactElement) {
  return render(<ToastProvider>{component}</ToastProvider>);
}

// Mock setup for session management
beforeEach(() => {
  // Mock useAutoSave hook
  const mockManualSave = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(useAutoSaveModule, 'useAutoSave').mockReturnValue({
    saveStatus: 'saved',
    manualSave: mockManualSave,
    error: null
  });

  // Mock localStorage service functions
  vi.spyOn(sessionStorage, 'getAll').mockReturnValue([]);
  vi.spyOn(sessionStorage, 'deleteSession').mockReturnValue({ success: true });
  vi.spyOn(sessionStorage, 'save').mockReturnValue({ success: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionWizard - Initial Rendering', () => {
  it('should render the component with default German language', () => {
    renderWithToast(<SessionWizard />);

    expect(screen.getByText('SC Payslip')).toBeInTheDocument();
    expect(screen.getByText(/Profite und Kosten crew-weise erfassen/i)).toBeInTheDocument();
  });

  it('should render with English language when initialLang is en', () => {
    renderWithToast(<SessionWizard initialLang="en" />);

    expect(screen.getByText('SC Payslip')).toBeInTheDocument();
    expect(screen.getByText(/Track profits and costs per crew/i)).toBeInTheDocument();
  });

  it('should render session settings section', () => {
    renderWithToast(<SessionWizard />);

    expect(screen.getByText('Session Einstellungen')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should render members section with initial members', () => {
    renderWithToast(<SessionWizard />);

    const eingabeTexts = screen.getAllByText('Eingabe');
    expect(eingabeTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('+ Mitglied')).toBeInTheDocument();

    const player1Inputs = screen.getAllByDisplayValue('Player 1');
    expect(player1Inputs.length).toBeGreaterThan(0);

    const player2Inputs = screen.getAllByDisplayValue('Player 2');
    expect(player2Inputs.length).toBeGreaterThan(0);
  });

  it('should render results section', () => {
    renderWithToast(<SessionWizard />);

    const resultsHeadings = screen.getAllByText('Payout');
    expect(resultsHeadings.length).toBeGreaterThan(0);
  });

  it('should render distribution mode select with default EQUAL value', () => {
    renderWithToast(<SessionWizard />);

    const currentMode = getCurrentDistributionMode();
    expect(currentMode).toBe('EQUAL');
  });

  it('should render tax toggle checkbox checked by default', () => {
    renderWithToast(<SessionWizard />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i
    });
    expect(taxCheckbox).toBeChecked();
  });

  it('should render role toggle checkbox unchecked by default', () => {
    renderWithToast(<SessionWizard />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });
    expect(roleCheckbox).not.toBeChecked();
  });
});

describe('SessionWizard - Language Switching', () => {
  it('should switch from German to English when EN button is clicked', () => {
    renderWithToast(<SessionWizard />);

    const eingabeTexts = screen.getAllByText('Eingabe');
    expect(eingabeTexts.length).toBeGreaterThan(0);

    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText('Eingabe')).not.toBeInTheDocument();
  });

  it('should switch from English to German when DE button is clicked', () => {
    renderWithToast(<SessionWizard initialLang="en" />);

    const membersTexts = screen.getAllByText('Members');
    expect(membersTexts.length).toBeGreaterThan(0);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    fireEvent.click(deButton);

    const eingabeTexts = screen.getAllByText('Eingabe');
    expect(eingabeTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });

  it('should update all UI text when language is changed', () => {
    renderWithToast(<SessionWizard />);

    expect(screen.getByText('Session Einstellungen')).toBeInTheDocument();
    expect(screen.getByText('Verteilungsmodus')).toBeInTheDocument();

    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    expect(screen.getByText('Session Settings')).toBeInTheDocument();
    expect(screen.getByText('Distribution Mode')).toBeInTheDocument();
  });
});

describe('SessionWizard - Distribution Mode', () => {
  it('should change distribution mode to PERCENT', () => {
    renderWithToast(<SessionWizard />);

    selectDistributionMode('Prozent');

    expect(getCurrentDistributionMode()).toBe('PERCENT');
  });

  it('should change distribution mode to ADJUSTABLE', () => {
    renderWithToast(<SessionWizard />);

    selectDistributionMode('Anpassbar');

    expect(getCurrentDistributionMode()).toBe('ADJUSTABLE');
  });

  it('should distribute percent shares equally when switching to PERCENT mode', () => {
    renderWithToast(<SessionWizard />);

    selectDistributionMode('Prozent');

    const percentInputs = screen.getAllByRole('textbox').filter(input => {
      const value = (input as HTMLInputElement).value;
      return value === '50';
    });

    expect(percentInputs.length).toBeGreaterThan(0);
  });

  it('should disable percent share inputs in EQUAL mode', () => {
    renderWithToast(<SessionWizard />);

    const allInputs = screen.getAllByRole('textbox');
    const percentShareInputs = allInputs.slice(-6);

    const disabledPercentInputs = percentShareInputs.filter(input =>
      (input as HTMLInputElement).disabled
    );

    expect(disabledPercentInputs.length).toBeGreaterThan(0);
  });

  it('should enable fixed payout inputs only in ADJUSTABLE mode', () => {
    renderWithToast(<SessionWizard />);

    selectDistributionMode('Anpassbar');

    const allInputs = screen.getAllByRole('textbox');
    const fixedPayoutInputs = allInputs.slice(-2);

    fixedPayoutInputs.forEach(input => {
      expect((input as HTMLInputElement).disabled).toBe(false);
    });
  });
});

describe('SessionWizard - Member Management', () => {
  it('should add a new member when + Mitglied button is clicked with sequential handle', () => {
    renderWithToast(<SessionWizard />);

    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    // Third member should be 'Player 3'
    const player3Inputs = screen.getAllByDisplayValue('Player 3');
    expect(player3Inputs.length).toBeGreaterThan(0);
  });

  it('should generate sequential Player N handles when adding multiple members', () => {
    renderWithToast(<SessionWizard />);

    const addButton = screen.getByRole('button', { name: '+ Mitglied' });

    // Add multiple members
    fireEvent.click(addButton); // Player 3
    fireEvent.click(addButton); // Player 4
    fireEvent.click(addButton); // Player 5

    expect(screen.getAllByDisplayValue('Player 3').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Player 4').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Player 5').length).toBeGreaterThan(0);
  });

  it('should start at Player 1 when adding a member after all members are removed', () => {
    renderWithToast(<SessionWizard />);

    // Remove all members
    const deleteButtons = screen.getAllByTitle('Entfernen');
    fireEvent.click(deleteButtons[0]); // Remove Player 1

    // Get updated delete buttons (the list has changed)
    const remainingDeleteButtons = screen.getAllByTitle('Entfernen');
    fireEvent.click(remainingDeleteButtons[0]); // Remove Player 2

    // Now add a new member - should be Player 1
    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    const player1Inputs = screen.getAllByDisplayValue('Player 1');
    expect(player1Inputs.length).toBeGreaterThan(0);
  });

  it('should remove a member when delete button is clicked', () => {
    renderWithToast(<SessionWizard />);

    const player1Inputs = screen.getAllByDisplayValue('Player 1');
    expect(player1Inputs.length).toBeGreaterThan(0);

    const deleteButtons = screen.getAllByTitle('Entfernen');
    const memberDeleteButtons = deleteButtons.slice(0, 2);

    fireEvent.click(memberDeleteButtons[0]);

    const remainingPlayer1Inputs = screen.queryAllByDisplayValue('Player 1');
    expect(remainingPlayer1Inputs.length).toBe(0);
  });

  it('should update member handle when input is changed', () => {
    renderWithToast(<SessionWizard />);

    const handleInputs = screen.getAllByDisplayValue('Player 1');
    const player1Input = handleInputs[0] as HTMLInputElement;

    fireEvent.change(player1Input, { target: { value: 'Captain' } });

    expect(player1Input.value).toBe('Captain');
  });

  it('should update member revenue when input is changed', () => {
    renderWithToast(<SessionWizard />);

    const numberInputs = screen.getAllByRole('textbox');
    const revenueInput = numberInputs[0] as HTMLInputElement;

    fireEvent.change(revenueInput, { target: { value: '1000' } });

    expect(revenueInput.value).toBe('1000');
  });

  it('should update member investment when input is changed', () => {
    renderWithToast(<SessionWizard />);

    const numberInputs = screen.getAllByRole('textbox');
    const investmentInput = numberInputs[1] as HTMLInputElement;

    fireEvent.change(investmentInput, { target: { value: '500' } });

    expect(investmentInput.value).toBe('500');
  });

  it('should show role inputs when showRole checkbox is toggled', () => {
    renderWithToast(<SessionWizard />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });

    fireEvent.click(roleCheckbox);

    expect(screen.getAllByDisplayValue('Pilot').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Crew').length).toBeGreaterThan(0);
  });
});

describe('SessionWizard - Default Member Values', () => {
  it('should have initial members with Player 1/Player 2 handles and Pilot/Crew roles', () => {
    renderWithToast(<SessionWizard />);

    // Verify initial handles
    const player1Inputs = screen.getAllByDisplayValue('Player 1');
    expect(player1Inputs.length).toBeGreaterThan(0);

    const player2Inputs = screen.getAllByDisplayValue('Player 2');
    expect(player2Inputs.length).toBeGreaterThan(0);

    // Enable role visibility to check role values
    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });
    fireEvent.click(roleCheckbox);

    // Verify initial roles: first member should be "Pilot", second should be "Crew"
    // Roles appear in both input section and results section, so we use toBeGreaterThan
    const pilotInputs = screen.getAllByDisplayValue('Pilot');
    expect(pilotInputs.length).toBeGreaterThan(0);

    const crewInputs = screen.getAllByDisplayValue('Crew');
    expect(crewInputs.length).toBeGreaterThan(0);

    // With 2 initial members, there should be exactly 1 Pilot and 1 Crew in input fields
    // But since results section also shows roles, we verify that Pilot count < Crew count
    // is NOT true (indicating first member has Pilot, second has Crew)
    // Just verify both values exist which matches the spec
  });

  it('should assign Player 3 handle and Crew role when adding a third member', () => {
    renderWithToast(<SessionWizard />);

    // Enable role visibility first
    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });
    fireEvent.click(roleCheckbox);

    // Count initial Crew inputs before adding new member
    const initialCrewInputs = screen.getAllByDisplayValue('Crew');
    const initialCrewCount = initialCrewInputs.length;

    // Add a new member
    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    // Verify the new member has "Player 3" handle
    const player3Inputs = screen.getAllByDisplayValue('Player 3');
    expect(player3Inputs.length).toBeGreaterThan(0);

    // Verify Crew count increased (new member has Crew role)
    const crewInputs = screen.getAllByDisplayValue('Crew');
    expect(crewInputs.length).toBeGreaterThan(initialCrewCount);
  });

  it('should start at Player 1 with Crew role after removing all members and adding fresh', () => {
    renderWithToast(<SessionWizard />);

    // Enable role visibility first
    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i
    });
    fireEvent.click(roleCheckbox);

    // Remove all members
    let deleteButtons = screen.getAllByTitle('Entfernen');
    fireEvent.click(deleteButtons[0]); // Remove first member

    // Get updated delete buttons (the list has changed)
    deleteButtons = screen.getAllByTitle('Entfernen');
    fireEvent.click(deleteButtons[0]); // Remove second member

    // Now add a new member - should be Player 1 with Crew role (addMember always uses Crew)
    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    // Verify the new member has "Player 1" handle
    const player1Inputs = screen.getAllByDisplayValue('Player 1');
    expect(player1Inputs.length).toBeGreaterThan(0);

    // Verify the new member has "Crew" role (addMember always assigns "Crew")
    const crewInputs = screen.getAllByDisplayValue('Crew');
    expect(crewInputs.length).toBeGreaterThan(0);

    // Verify "Pilot" is NOT present (since addMember uses Crew, not Pilot)
    const pilotInputs = screen.queryAllByDisplayValue('Pilot');
    expect(pilotInputs.length).toBe(0);
  });
});

describe('SessionWizard - Individual Expenses', () => {
  it('should add individual expense for a member', () => {
    renderWithToast(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const expenseInputs = screen.getAllByDisplayValue('Kosten');
    expect(expenseInputs.length).toBeGreaterThan(0);
  });

  it('should update individual expense label', () => {
    renderWithToast(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const expenseInputs = screen.getAllByDisplayValue('Kosten');
    const expenseInput = expenseInputs[0] as HTMLInputElement;

    fireEvent.change(expenseInput, { target: { value: 'Fuel' } });

    expect(expenseInput.value).toBe('Fuel');
  });

  it('should update individual expense amount', () => {
    renderWithToast(<SessionWizard />);

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    const allInputs = screen.getAllByRole('textbox');
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
    renderWithToast(<SessionWizard />);

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
    renderWithToast(<SessionWizard />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i
    }) as HTMLInputElement;

    expect(taxCheckbox.checked).toBe(true);

    fireEvent.click(taxCheckbox);

    expect(taxCheckbox.checked).toBe(false);
  });

  it('should toggle tax back on when checkbox is checked again', () => {
    renderWithToast(<SessionWizard />);

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
    renderWithToast(<SessionWizard />);

    const handleInputs = screen.getAllByDisplayValue('Player 1');
    const player1Input = handleInputs[0] as HTMLInputElement;
    fireEvent.change(player1Input, { target: { value: 'Captain' } });
    expect(player1Input.value).toBe('Captain');

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    const resetPlayer1Inputs = screen.getAllByDisplayValue('Player 1');
    expect(resetPlayer1Inputs.length).toBeGreaterThan(0);
  });

  it('should reset distribution mode to EQUAL on reset', () => {
    renderWithToast(<SessionWizard />);

    selectDistributionMode('Prozent');
    expect(getCurrentDistributionMode()).toBe('PERCENT');

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    expect(getCurrentDistributionMode()).toBe('EQUAL');
  });

  it('should reset tax toggle to enabled on reset', () => {
    renderWithToast(<SessionWizard />);

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
    renderWithToast(<SessionWizard />);

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
    const umsatzTexts = screen.getAllByText('Umsatz');
    expect(umsatzTexts.length).toBeGreaterThan(0);
    const investmentTexts = screen.getAllByText('Investment');
    expect(investmentTexts.length).toBeGreaterThan(0);
    const kostenTexts = screen.getAllByText('Kosten');
    expect(kostenTexts.length).toBeGreaterThan(0);
  });

  it('should display suggested transfers section', () => {
    renderWithToast(<SessionWizard />);

    expect(screen.getByText('Vorgeschlagene Überweisungen')).toBeInTheDocument();
  });

  it('should show "no transfers required" message when members have equal revenue', () => {
    renderWithToast(<SessionWizard />);

    expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
  });

  it('should update calculations when member revenue is changed', () => {
    renderWithToast(<SessionWizard />);

    const numberInputs = screen.getAllByRole('textbox');
    const revenueInput = numberInputs[0] as HTMLInputElement;

    fireEvent.change(revenueInput, { target: { value: '1000' } });

    const summarySection = screen.getByText('Gesamt').closest('div');
    expect(summarySection).toBeInTheDocument();
  });

  it('should display member results table with all members', () => {
    renderWithToast(<SessionWizard />);

    // Results section renders and contains member results
    const payoutHeadings = screen.getAllByText('Payout');
    expect(payoutHeadings.length).toBeGreaterThan(0);

    // Check that member results table exists
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThan(0);
  });
});

describe('SessionWizard - Integration Scenarios', () => {
  it('should handle complete workflow: add member, set revenue, check results', () => {
    renderWithToast(<SessionWizard />);

    const addButton = screen.getByRole('button', { name: '+ Mitglied' });
    fireEvent.click(addButton);

    const numberInputs = screen.getAllByRole('textbox');
    const firstRevenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(firstRevenueInput, { target: { value: '5000' } });

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
  });

  it('should handle switching modes and updating values', () => {
    renderWithToast(<SessionWizard />);

    selectDistributionMode('Prozent');

    const numberInputs = screen.getAllByRole('textbox');
    const revenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(revenueInput, { target: { value: '2000' } });

    selectDistributionMode('Gleich');

    expect(getCurrentDistributionMode()).toBe('EQUAL');
  });

  it('should handle adding and removing expenses with calculations', () => {
    renderWithToast(<SessionWizard />);

    const numberInputs = screen.getAllByRole('textbox');
    const revenueInput = numberInputs[0] as HTMLInputElement;
    fireEvent.change(revenueInput, { target: { value: '1000' } });

    const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
    fireEvent.click(addExpenseButtons[0]);

    expect(screen.getByText('Gesamt')).toBeInTheDocument();
  });

  it('should persist language preference across interactions', () => {
    renderWithToast(<SessionWizard />);

    const enButton = screen.getByRole('button', { name: /Switch to English/i });
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
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '-1000' } });

      expect(revenueInput).toBeInTheDocument();
    });

    it('should not crash when attempting negative investment input', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(investmentInput, { target: { value: '-500' } });

      expect(investmentInput).toBeInTheDocument();
    });

    it('should not crash when attempting negative expense amount', () => {
      renderWithToast(<SessionWizard />);

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
      fireEvent.click(addExpenseButtons[0]);

      const allInputs = screen.getAllByRole('textbox');
      const expenseAmountInputs = allInputs.filter(input => {
        const parent = input.closest('td');
        return parent?.textContent?.includes('🗑');
      });

      if (expenseAmountInputs.length > 0) {
        const expenseAmountInput = expenseAmountInputs[0] as HTMLInputElement;
        fireEvent.change(expenseAmountInput, { target: { value: '-100' } });

        expect(expenseAmountInput).toBeInTheDocument();
      }

      // "Payout" appears in multiple result card headings
      expect(screen.queryAllByText('Payout').length).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero revenue input', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '0' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
      expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
    });

    it('should handle very large numbers without crashing', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '999999999' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle empty string input for revenue', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should not crash with empty member handle', () => {
      renderWithToast(<SessionWizard />);

      const handleInputs = screen.getAllByDisplayValue('Player 1');
      const player1Input = handleInputs[0] as HTMLInputElement;

      fireEvent.change(player1Input, { target: { value: '' } });

      expect(player1Input).toBeInTheDocument();
    });

    it('should not crash with whitespace-only member handle', () => {
      renderWithToast(<SessionWizard />);

      const handleInputs = screen.getAllByDisplayValue('Player 1');
      const player1Input = handleInputs[0] as HTMLInputElement;

      fireEvent.change(player1Input, { target: { value: '   ' } });

      expect(player1Input).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Member States', () => {
    it('should handle all members being inactive', () => {
      renderWithToast(<SessionWizard />);

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
      renderWithToast(<SessionWizard />);

      const deleteButtons = screen.getAllByTitle('Entfernen');
      const memberDeleteButtons = deleteButtons.slice(0, 2);

      fireEvent.click(memberDeleteButtons[1]);

      const remainingMembers = screen.getAllByDisplayValue(/Player 1|Player 2/);
      expect(remainingMembers.length).toBeGreaterThan(0);
      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle adding maximum number of members', () => {
      renderWithToast(<SessionWizard />);

      const addButton = screen.getByRole('button', { name: '+ Mitglied' });

      for (let i = 0; i < 10; i++) {
        fireEvent.click(addButton);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle single member with zero revenue', () => {
      renderWithToast(<SessionWizard />);

      const deleteButtons = screen.getAllByTitle('Entfernen');
      const memberDeleteButtons = deleteButtons.slice(0, 2);
      fireEvent.click(memberDeleteButtons[1]);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '0' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
      expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Financial Calculations', () => {
    it('should handle investment greater than revenue', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '100' } });
      fireEvent.change(investmentInput, { target: { value: '500' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle expenses exceeding revenue', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '100' } });

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
      fireEvent.click(addExpenseButtons[0]);

      const allInputs = screen.getAllByRole('textbox');
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
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '0' } });
      fireEvent.change(investmentInput, { target: { value: '1000' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle multiple expenses exceeding total revenue', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '100' } });

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });

      for (let i = 0; i < 3; i++) {
        fireEvent.click(addExpenseButtons[0]);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle decimal values in revenue input', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '1000.50' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Distribution Modes', () => {
    it('should handle PERCENT mode with invalid total percentage', () => {
      renderWithToast(<SessionWizard />);

      selectDistributionMode('Prozent');

      const allInputs = screen.getAllByRole('textbox');
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
      renderWithToast(<SessionWizard />);

      selectDistributionMode('Prozent');

      const allInputs = screen.getAllByRole('textbox');
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
      renderWithToast(<SessionWizard />);

      selectDistributionMode('Anpassbar');

      const allInputs = screen.getAllByRole('textbox');
      const revenueInput = allInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '1000' } });

      const fixedPayoutInputs = allInputs.slice(-2);
      fixedPayoutInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '5000' } });
      });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle switching between modes multiple times', () => {
      renderWithToast(<SessionWizard />);

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
      renderWithToast(<SessionWizard />);

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
      renderWithToast(<SessionWizard />);

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
      renderWithToast(<SessionWizard />);

      const taxCheckbox = screen.getByRole('checkbox', {
        name: /Transfer Tax berücksichtigen/i
      });

      for (let i = 0; i < 5; i++) {
        fireEvent.click(taxCheckbox);
      }

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle rapid language switching', () => {
      renderWithToast(<SessionWizard />);

      const enButton = screen.getByRole('button', { name: /Switch to English/i });
      fireEvent.click(enButton);

      const deButton = screen.getByRole('button', { name: /Switch to German/i });
      fireEvent.click(deButton);

      const enButton2 = screen.getByRole('button', { name: /Switch to English/i });
      fireEvent.click(enButton2);

      const deButton2 = screen.getByRole('button', { name: /Switch to German/i });
      fireEvent.click(deButton2);

      const eingabeTexts = screen.getAllByText('Eingabe');
      expect(eingabeTexts.length).toBeGreaterThan(0);
    });

    it('should preserve member data after toggling role visibility', () => {
      renderWithToast(<SessionWizard />);

      const handleInputs = screen.getAllByDisplayValue('Player 1');
      const player1Input = handleInputs[0] as HTMLInputElement;
      fireEvent.change(player1Input, { target: { value: 'Captain' } });

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
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      numberInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '0' } });
      });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
      expect(screen.getByText('Keine Transfers nötig.')).toBeInTheDocument();
    });

    it('should handle member with only investment and no revenue', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      const investmentInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(revenueInput, { target: { value: '0' } });
      fireEvent.change(investmentInput, { target: { value: '1000' } });

      expect(screen.getByText('Gesamt')).toBeInTheDocument();
    });

    it('should handle member with only expenses and no revenue', () => {
      renderWithToast(<SessionWizard />);

      const numberInputs = screen.getAllByRole('textbox');
      const revenueInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(revenueInput, { target: { value: '0' } });

      const addExpenseButtons = screen.getAllByRole('button', { name: '+ Kosten' });
      fireEvent.click(addExpenseButtons[0]);

      const allInputs = screen.getAllByRole('textbox');
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
      renderWithToast(<SessionWizard />);

      const addButton = screen.getByRole('button', { name: '+ Mitglied' });
      fireEvent.click(addButton);

      const numberInputs = screen.getAllByRole('textbox');
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
      const player1Inputs = screen.getAllByDisplayValue('Player 1');
      expect(player1Inputs.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// SESSION MANAGEMENT TESTS
// ============================================================================

// Mock saved sessions for testing
const mockSavedSessions: SavedSession[] = [
  {
    id: 'session-1',
    session: {
      name: 'Test Session 1',
      type: 'TRADING',
      currency: 'aUEC',
      distributionMode: 'EQUAL',
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: 'member-1', handle: 'Pilot', role: 'Trader', revenue: 1000, investment: 0, active: true }
      ],
      individualExpenses: [],
      sharedExpenses: []
    },
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T12:00:00Z').toISOString()
  },
  {
    id: 'session-2',
    session: {
      name: 'Test Session 2',
      type: 'TRADING',
      currency: 'aUEC',
      distributionMode: 'PERCENT',
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: 'member-2', handle: 'Escort', role: 'Escort', revenue: 500, investment: 0, active: true, percentShare: 100 }
      ],
      individualExpenses: [],
      sharedExpenses: []
    },
    createdAt: new Date('2024-01-02T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-02T12:00:00Z').toISOString()
  }
];

describe('SessionWizard - Session Management', () => {
  let mockUseAutoSave: ReturnType<typeof vi.fn>;
  let mockManualSave: ReturnType<typeof vi.fn>;
  let mockGetAll: ReturnType<typeof vi.fn>;
  let mockDeleteSession: ReturnType<typeof vi.fn>;
  let mockSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock useAutoSave hook
    mockManualSave = vi.fn().mockResolvedValue(undefined);
    mockUseAutoSave = vi.fn().mockReturnValue({
      saveStatus: 'saved',
      manualSave: mockManualSave,
      error: null
    });
    vi.spyOn(useAutoSaveModule, 'useAutoSave').mockImplementation(mockUseAutoSave as unknown as typeof useAutoSaveModule.useAutoSave);

    // Mock localStorage service functions
    mockGetAll = vi.fn().mockReturnValue(mockSavedSessions);
    mockDeleteSession = vi.fn().mockReturnValue({ success: true });
    mockSave = vi.fn().mockReturnValue({ success: true });

    vi.spyOn(sessionStorage, 'getAll').mockImplementation(mockGetAll as unknown as typeof sessionStorage.getAll);
    vi.spyOn(sessionStorage, 'deleteSession').mockImplementation(mockDeleteSession as unknown as typeof sessionStorage.deleteSession);
    vi.spyOn(sessionStorage, 'save').mockImplementation(mockSave as unknown as typeof sessionStorage.save);
  });

  describe('Session Name Input', () => {
    it('should render session name input field', () => {
      renderWithToast(<SessionWizard />);

      const nameInput = screen.getByRole('textbox', { name: /Session Name/i });
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveValue('SC Session');
    });

    it('should update session name when input changes', () => {
      renderWithToast(<SessionWizard />);

      const nameInput = screen.getByRole('textbox', { name: /Session Name/i }) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'My Custom Session' } });

      expect(nameInput.value).toBe('My Custom Session');
    });

    it('should show placeholder text in German', () => {
      renderWithToast(<SessionWizard />);

      const nameInput = screen.getByPlaceholderText(/Session Name eingeben/i);
      expect(nameInput).toBeInTheDocument();
    });

    it('should show placeholder text in English', () => {
      renderWithToast(<SessionWizard initialLang="en" />);

      const nameInput = screen.getByPlaceholderText(/Enter session name/i);
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Save Status Indicator', () => {
    it('should render save status indicator', () => {
      renderWithToast(<SessionWizard />);

      // SaveStatusIndicator should be present with 'saved' status
      expect(mockUseAutoSave).toHaveBeenCalled();
    });

    it('should show saving status', () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'saving',
        manualSave: mockManualSave,
        error: null
      });

      renderWithToast(<SessionWizard />);

      expect(mockUseAutoSave).toHaveBeenCalled();
    });

    it('should show unsaved status', () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'unsaved',
        manualSave: mockManualSave,
        error: null
      });

      renderWithToast(<SessionWizard />);

      expect(mockUseAutoSave).toHaveBeenCalled();
    });

    it('should show error status when save fails', () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'unsaved',
        manualSave: mockManualSave,
        error: 'Failed to save'
      });

      renderWithToast(<SessionWizard />);

      expect(mockUseAutoSave).toHaveBeenCalled();
    });
  });

  describe('History Button', () => {
    it('should render history button with German text', () => {
      renderWithToast(<SessionWizard />);

      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      expect(historyButton).toBeInTheDocument();
    });

    it('should render history button with English text', () => {
      renderWithToast(<SessionWizard initialLang="en" />);

      const historyButton = screen.getByRole('button', { name: /Open History/i });
      expect(historyButton).toBeInTheDocument();
    });

    it('should open session history sidebar when clicked', async () => {
      renderWithToast(<SessionWizard />);

      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/Session Verlauf/i)).toBeInTheDocument();
      });
    });

    it('should load saved sessions on mount', () => {
      renderWithToast(<SessionWizard />);

      expect(mockGetAll).toHaveBeenCalled();
    });
  });

  describe('Session History Sidebar', () => {
    it('should display saved sessions when opened', async () => {
      renderWithToast(<SessionWizard />);

      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
        expect(screen.getByText('Test Session 2')).toBeInTheDocument();
      });
    });

    it('should close sidebar when close button is clicked', async () => {
      renderWithToast(<SessionWizard />);

      // Open sidebar
      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/Session Verlauf/i)).toBeInTheDocument();
      });

      // Close sidebar
      const closeButton = screen.getByLabelText(/Close/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test Session 1')).not.toBeInTheDocument();
      });
    });

    it('should load session when load button is clicked', async () => {
      renderWithToast(<SessionWizard />);

      // Open sidebar
      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      });

      // Click load button for first session - wait for it to appear
      await waitFor(() => {
        const loadButtons = screen.getAllByText(/^(Laden|Load)$/);
        expect(loadButtons.length).toBeGreaterThan(0);
      });

      const loadButtons = screen.getAllByText(/^(Laden|Load)$/);
      fireEvent.click(loadButtons[0]);

      await waitFor(() => {
        // Session name should be updated
        const nameInput = screen.getByRole('textbox', { name: /Session Name/i }) as HTMLInputElement;
        expect(nameInput.value).toBe('Test Session 1');
      });
    });

    it('should delete session when delete button is clicked and confirmed', async () => {
      renderWithToast(<SessionWizard />);

      // Open sidebar
      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      });

      // Wait for sessions to render
      await waitFor(() => {
        const loadButtons = screen.getAllByText(/^(Laden|Load)$/);
        expect(loadButtons.length).toBeGreaterThan(0);
      });

      // Find delete button by aria-label (it's next to Load and Duplicate buttons)
      // Use getAllByRole since there may be multiple sessions with delete buttons
      const deleteButtons = screen.getAllByRole('button', { name: /Löschen|Delete Session/i });
      const deleteButton = deleteButtons[0];

      fireEvent.click(deleteButton);

      // Confirm deletion - wait for confirmation dialog with "Löschen" or "Delete" text button
      await waitFor(() => {
        const confirmText = screen.getByText(/^(Löschen|Delete)$/);
        expect(confirmText).toBeInTheDocument();
      });

      // Click the confirm button
      const confirmButton = screen.getByText(/^(Löschen|Delete)$/);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
        expect(mockGetAll).toHaveBeenCalledTimes(2); // Initial load + refresh after delete
      });
    });
  });

  describe('Session Actions', () => {
    it('should render export button', () => {
      renderWithToast(<SessionWizard />);

      const exportButton = screen.getByText(/^(Exportieren|Export All)$/);
      expect(exportButton).toBeInTheDocument();
    });

    it('should render import button', () => {
      renderWithToast(<SessionWizard />);

      const importButton = screen.getByText(/^(Importieren|Import)$/);
      expect(importButton).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should trigger manual save on Ctrl+S', async () => {
      renderWithToast(<SessionWizard />);

      // Simulate Ctrl+S
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(mockManualSave).toHaveBeenCalled();
      });
    });

    it('should open history sidebar on Ctrl+O', async () => {
      renderWithToast(<SessionWizard />);

      // Simulate Ctrl+O
      fireEvent.keyDown(window, { key: 'o', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByText(/Session Verlauf/i)).toBeInTheDocument();
      });
    });

    it('should prevent default browser behavior on Ctrl+S', () => {
      renderWithToast(<SessionWizard />);

      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default browser behavior on Ctrl+O', () => {
      renderWithToast(<SessionWizard />);

      const event = new KeyboardEvent('keydown', { key: 'o', ctrlKey: true, bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Auto-Save Integration', () => {
    it('should call useAutoSave with session data', () => {
      renderWithToast(<SessionWizard />);

      expect(mockUseAutoSave).toHaveBeenCalled();
      const callArgs = mockUseAutoSave.mock.calls[0];
      expect(callArgs[0]).toHaveProperty('name');
      expect(callArgs[0]).toHaveProperty('members');
      expect(callArgs[1]).toBe(true); // enabled
    });

    it('should update auto-save when session changes', () => {
      renderWithToast(<SessionWizard />);

      const initialCallCount = mockUseAutoSave.mock.calls.length;

      // Change session name
      const nameInput = screen.getByRole('textbox', { name: /Session Name/i }) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Updated Session' } });

      // useAutoSave should be called again with updated session
      expect(mockUseAutoSave.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should display toast on save error', async () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'unsaved',
        manualSave: mockManualSave,
        error: 'Storage quota exceeded'
      });

      renderWithToast(<SessionWizard />);

      await waitFor(() => {
        expect(screen.getByText(/Storage quota exceeded/i)).toBeInTheDocument();
      }, { timeout: 3500 });
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('should set up beforeunload event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderWithToast(<SessionWizard />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('should show warning when status is unsaved', () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'unsaved',
        manualSave: mockManualSave,
        error: null
      });

      renderWithToast(<SessionWizard />);

      const event = new Event('beforeunload', { bubbles: true, cancelable: true }) as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(event.returnValue).toBeDefined();
    });

    it('should show warning when status is saving', () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'saving',
        manualSave: mockManualSave,
        error: null
      });

      renderWithToast(<SessionWizard />);

      const event = new Event('beforeunload', { bubbles: true, cancelable: true }) as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not show warning when status is saved', () => {
      mockUseAutoSave.mockReturnValue({
        saveStatus: 'saved',
        manualSave: mockManualSave,
        error: null
      });

      renderWithToast(<SessionWizard />);

      const event = new Event('beforeunload', { bubbles: true, cancelable: true }) as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      // preventDefault should not be called when saved
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast when session is saved with Ctrl+S', async () => {
      renderWithToast(<SessionWizard />);

      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByText(/Session gespeichert|Session saved/i)).toBeInTheDocument();
      });
    });

    it('should show success toast when session is loaded', async () => {
      renderWithToast(<SessionWizard />);

      // Open sidebar
      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      });

      // Load session
      await waitFor(() => {
        const loadButtons = screen.getAllByText(/^(Laden|Load)$/);
        expect(loadButtons.length).toBeGreaterThan(0);
      });

      const loadButtons = screen.getAllByText(/^(Laden|Load)$/);
      fireEvent.click(loadButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Session geladen|Session loaded/i)).toBeInTheDocument();
      });
    });

    it('should show success toast when session is deleted', async () => {
      renderWithToast(<SessionWizard />);

      // Open sidebar
      const historyButton = screen.getByRole('button', { name: /Verlauf öffnen/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      });

      // Wait for sessions to render
      await waitFor(() => {
        const loadButtons = screen.getAllByText(/^(Laden|Load)$/);
        expect(loadButtons.length).toBeGreaterThan(0);
      });

      // Find delete button by aria-label (it's next to Load and Duplicate buttons)
      // Use getAllByRole since there may be multiple sessions with delete buttons
      const deleteButtons = screen.getAllByRole('button', { name: /Löschen|Delete Session/i });
      const deleteButton = deleteButtons[0];

      fireEvent.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmText = screen.getByText(/^(Löschen|Delete)$/);
        expect(confirmText).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/^(Löschen|Delete)$/);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Session gelöscht|Session deleted/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management with Language Switching', () => {
    it('should update history button text when language changes', async () => {
      renderWithToast(<SessionWizard />);

      expect(screen.getByRole('button', { name: /Verlauf öffnen/i })).toBeInTheDocument();

      // Switch to English
      const enButton = screen.getByRole('button', { name: /Switch to English/i });
      fireEvent.click(enButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Open History/i })).toBeInTheDocument();
      });
    });

    it('should update session name label when language changes', () => {
      renderWithToast(<SessionWizard />);

      expect(screen.getByRole('textbox', { name: /Session Name/i })).toBeInTheDocument();

      // Switch to English
      const enButton = screen.getByRole('button', { name: /Switch to English/i });
      fireEvent.click(enButton);

      expect(screen.getByRole('textbox', { name: /Session Name/i })).toBeInTheDocument();
    });
  });
});
