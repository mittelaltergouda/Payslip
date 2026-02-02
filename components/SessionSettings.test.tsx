import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionSettings, SessionSettingsProps } from './SessionSettings';
import { SessionInput, DistributionMode } from '@/lib/types';
import { ModePreviewResult } from '@/lib/modePreview';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the ModePreview component
vi.mock('./ModePreview', () => ({
  ModePreview: ({ mode, visible }: { mode: DistributionMode; visible: boolean }) => {
    if (!visible) return null;
    return <div data-testid={`mode-preview-${mode}`}>Preview for {mode}</div>;
  },
}));

const mockSession: SessionInput = {
  name: 'Test Session',
  type: 'TRADING',
  currency: 'aUEC',
  totalRevenue: 100000,
  distributionMode: 'EQUAL',
  taxEnabled: true,
  taxRate: 0.005,
  members: [
    {
      handle: 'Pilot',
      role: 'Captain',
      percentShare: 50,
      revenue: 50000,
      investment: 10000,
    },
    {
      handle: 'Escort',
      role: 'Fighter',
      percentShare: 50,
      revenue: 50000,
      investment: 10000,
    },
  ],
};

const mockModePreviews: Record<DistributionMode, ModePreviewResult | null> = {
  EQUAL: {
    mode: 'EQUAL',
    result: {
      saleRevenue: 100000,
      netProfit: 80000,
      taxRateApplied: 0.005,
      suggestedTransfers: [],
      members: [
        {
          memberId: '1',
          handle: 'Pilot',
          revenue: 50000,
          investment: 10000,
          expenses: 10000,
          sharedExpenses: 10000,
          individualExpenses: 0,
          profitShare: 40000,
          finalNet: 40000
        },
        {
          memberId: '2',
          handle: 'Escort',
          revenue: 50000,
          investment: 10000,
          expenses: 10000,
          sharedExpenses: 10000,
          individualExpenses: 0,
          profitShare: 40000,
          finalNet: 40000
        },
      ],
    },
    error: null,
  },
  PERCENT: {
    mode: 'PERCENT',
    result: {
      saleRevenue: 100000,
      netProfit: 80000,
      taxRateApplied: 0.005,
      suggestedTransfers: [],
      members: [
        {
          memberId: '1',
          handle: 'Pilot',
          revenue: 50000,
          investment: 10000,
          expenses: 10000,
          sharedExpenses: 10000,
          individualExpenses: 0,
          profitShare: 40000,
          finalNet: 40000
        },
        {
          memberId: '2',
          handle: 'Escort',
          revenue: 50000,
          investment: 10000,
          expenses: 10000,
          sharedExpenses: 10000,
          individualExpenses: 0,
          profitShare: 40000,
          finalNet: 40000
        },
      ],
    },
    error: null,
  },
  ADJUSTABLE: {
    mode: 'ADJUSTABLE',
    result: {
      saleRevenue: 100000,
      netProfit: 80000,
      taxRateApplied: 0.005,
      suggestedTransfers: [],
      members: [
        {
          memberId: '1',
          handle: 'Pilot',
          revenue: 50000,
          investment: 10000,
          expenses: 10000,
          sharedExpenses: 10000,
          individualExpenses: 0,
          profitShare: 40000,
          finalNet: 40000
        },
        {
          memberId: '2',
          handle: 'Escort',
          revenue: 50000,
          investment: 10000,
          expenses: 10000,
          sharedExpenses: 10000,
          individualExpenses: 0,
          profitShare: 40000,
          finalNet: 40000
        },
      ],
    },
    error: null,
  },
};

const germanTranslations = {
  sessionSettings: 'Session Einstellungen',
  reset: 'Reset',
  distribution: 'Verteilungsmodus',
  equal: 'Gleich',
  percent: 'Prozent',
  adjustable: 'Anpassbar',
  explanation: 'Erklärung',
  taxToggle: 'Transfer Tax berücksichtigen',
  showRole: 'Rollen anzeigen',
};

const englishTranslations = {
  sessionSettings: 'Session Settings',
  reset: 'Reset',
  distribution: 'Distribution Mode',
  equal: 'Equal',
  percent: 'Percent',
  adjustable: 'Adjustable',
  explanation: 'Explanation',
  taxToggle: 'Consider Transfer Tax',
  showRole: 'Show Roles',
};

function createDefaultProps(
  overrides?: Partial<SessionSettingsProps>
): SessionSettingsProps {
  return {
    session: mockSession,
    onSessionUpdate: vi.fn(),
    onDistributionChange: vi.fn(),
    onReset: vi.fn(),
    showRole: false,
    onShowRoleChange: vi.fn(),
    translations: germanTranslations,
    modePreviews: mockModePreviews,
    taxRate: 0.005,
    ...overrides,
  };
}

describe('SessionSettings - Initial Rendering', () => {
  it('should render the component with German translations', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    expect(screen.getByText('Session Einstellungen')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Verteilungsmodus')).toBeInTheDocument();
  });

  it('should render with English translations', () => {
    const props = createDefaultProps({
      translations: englishTranslations,
    });
    render(<SessionSettings {...props} />);

    expect(screen.getByText('Session Settings')).toBeInTheDocument();
    expect(screen.getByText('Distribution Mode')).toBeInTheDocument();
  });

  it('should render reset button', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('should render distribution mode selector with current mode', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    expect(modeButton).toBeInTheDocument();
    expect(modeButton).toHaveTextContent('Gleich');
  });

  it('should render tax toggle checkbox checked by default', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i,
    });
    expect(taxCheckbox).toBeChecked();
  });

  it('should render role toggle checkbox unchecked by default', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i,
    });
    expect(roleCheckbox).not.toBeChecked();
  });

  it('should render role toggle checkbox checked when showRole is true', () => {
    const props = createDefaultProps({ showRole: true });
    render(<SessionSettings {...props} />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i,
    });
    expect(roleCheckbox).toBeChecked();
  });

  it('should render explanation text with current mode', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    expect(screen.getByText(/Erklärung: Gleich/i)).toBeInTheDocument();
  });
});

describe('SessionSettings - Distribution Mode Selector', () => {
  it('should open dropdown when button is clicked', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should display all three distribution modes in dropdown', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(screen.getByRole('option', { name: /Gleich/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Prozent/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Anpassbar/i })).toBeInTheDocument();
  });

  it('should call onDistributionChange when a mode is selected', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const percentOption = screen.getByRole('option', { name: /Prozent/i });
    fireEvent.click(percentOption);

    expect(props.onDistributionChange).toHaveBeenCalledWith('PERCENT');
  });

  it('should close dropdown after selecting a mode', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const percentOption = screen.getByRole('option', { name: /Prozent/i });
    fireEvent.click(percentOption);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should highlight the currently selected mode in dropdown', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const equalOption = screen.getByRole('option', { name: /Gleich/i });
    expect(equalOption).toHaveAttribute('aria-selected', 'true');
  });

  it('should show correct mode label for EQUAL mode', () => {
    const props = createDefaultProps({
      session: { ...mockSession, distributionMode: 'EQUAL' },
    });
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    expect(modeButton).toHaveTextContent('Gleich');
  });

  it('should show correct mode label for PERCENT mode', () => {
    const props = createDefaultProps({
      session: { ...mockSession, distributionMode: 'PERCENT' },
    });
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Prozent/i });
    expect(modeButton).toHaveTextContent('Prozent');
  });

  it('should show correct mode label for ADJUSTABLE mode', () => {
    const props = createDefaultProps({
      session: { ...mockSession, distributionMode: 'ADJUSTABLE' },
    });
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Anpassbar/i });
    expect(modeButton).toHaveTextContent('Anpassbar');
  });

  it('should toggle dropdown arrow when opened and closed', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    expect(modeButton).toHaveTextContent('▼');

    fireEvent.click(modeButton);
    expect(modeButton).toHaveTextContent('▲');
  });
});

describe('SessionSettings - Mode Preview', () => {
  it('should show mode preview on hover', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const percentOption = screen.getByRole('option', { name: /Prozent/i });
    fireEvent.mouseEnter(percentOption);

    expect(screen.getByTestId('mode-preview-PERCENT')).toBeInTheDocument();
  });

  it('should hide mode preview when mouse leaves', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const percentOption = screen.getByRole('option', { name: /Prozent/i });
    fireEvent.mouseEnter(percentOption);
    fireEvent.mouseLeave(percentOption);

    expect(screen.queryByTestId('mode-preview-PERCENT')).not.toBeInTheDocument();
  });

  it('should not show preview for currently selected mode', () => {
    const props = createDefaultProps({
      session: { ...mockSession, distributionMode: 'EQUAL' },
    });
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const equalOption = screen.getByRole('option', { name: /Gleich/i });
    fireEvent.mouseEnter(equalOption);

    expect(screen.queryByTestId('mode-preview-EQUAL')).not.toBeInTheDocument();
  });

  it('should clear hovered mode when dropdown closes', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const percentOption = screen.getByRole('option', { name: /Prozent/i });
    fireEvent.mouseEnter(percentOption);
    fireEvent.click(percentOption);

    expect(screen.queryByTestId('mode-preview-PERCENT')).not.toBeInTheDocument();
  });
});

describe('SessionSettings - Tax Toggle', () => {
  it('should call onSessionUpdate when tax is toggled on', () => {
    const props = createDefaultProps({
      session: { ...mockSession, taxEnabled: false },
    });
    render(<SessionSettings {...props} />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i,
    });
    fireEvent.click(taxCheckbox);

    expect(props.onSessionUpdate).toHaveBeenCalledWith({
      taxEnabled: true,
      taxRate: 0.005,
    });
  });

  it('should call onSessionUpdate when tax is toggled off', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i,
    });
    fireEvent.click(taxCheckbox);

    expect(props.onSessionUpdate).toHaveBeenCalledWith({
      taxEnabled: false,
      taxRate: 0.005,
    });
  });

  it('should use the provided taxRate when toggling', () => {
    const props = createDefaultProps({
      taxRate: 0.01,
      session: { ...mockSession, taxEnabled: false },
    });
    render(<SessionSettings {...props} />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i,
    });
    fireEvent.click(taxCheckbox);

    expect(props.onSessionUpdate).toHaveBeenCalledWith({
      taxEnabled: true,
      taxRate: 0.01,
    });
  });

  it('should be unchecked when taxEnabled is false', () => {
    const props = createDefaultProps({
      session: { ...mockSession, taxEnabled: false },
    });
    render(<SessionSettings {...props} />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i,
    });
    expect(taxCheckbox).not.toBeChecked();
  });

  it('should be checked when taxEnabled is undefined (defaults to true)', () => {
    const props = createDefaultProps({
      session: { ...mockSession, taxEnabled: undefined },
    });
    render(<SessionSettings {...props} />);

    const taxCheckbox = screen.getByRole('checkbox', {
      name: /Transfer Tax berücksichtigen/i,
    });
    expect(taxCheckbox).toBeChecked();
  });
});

describe('SessionSettings - Role Toggle', () => {
  it('should call onShowRoleChange when role toggle is clicked', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i,
    });
    fireEvent.click(roleCheckbox);

    expect(props.onShowRoleChange).toHaveBeenCalledWith(true);
  });

  it('should pass false when unchecking role toggle', () => {
    const props = createDefaultProps({ showRole: true });
    render(<SessionSettings {...props} />);

    const roleCheckbox = screen.getByRole('checkbox', {
      name: /Rollen anzeigen/i,
    });
    fireEvent.click(roleCheckbox);

    expect(props.onShowRoleChange).toHaveBeenCalledWith(false);
  });
});

describe('SessionSettings - Reset Button', () => {
  it('should call onReset when reset button is clicked', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(props.onReset).toHaveBeenCalled();
  });

  it('should call onReset only once per click', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });
});

describe('SessionSettings - Custom Styling', () => {
  it('should apply custom className', () => {
    const props = createDefaultProps({ className: 'custom-class' });
    const { container } = render(<SessionSettings {...props} />);

    const settingsDiv = container.querySelector('.custom-class');
    expect(settingsDiv).toBeInTheDocument();
  });

  it('should include default glass styling', () => {
    const props = createDefaultProps();
    const { container } = render(<SessionSettings {...props} />);

    const settingsDiv = container.querySelector('.glass');
    expect(settingsDiv).toBeInTheDocument();
  });
});

describe('SessionSettings - Accessibility', () => {
  it('should have proper ARIA attributes on dropdown button', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    expect(modeButton).toHaveAttribute('aria-haspopup', 'listbox');
    expect(modeButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should update aria-expanded when dropdown is opened', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    expect(modeButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should have proper role attribute on listbox', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
  });

  it('should have aria-selected on options', () => {
    const props = createDefaultProps();
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Gleich/i });
    fireEvent.click(modeButton);

    const equalOption = screen.getByRole('option', { name: /Gleich/i });
    expect(equalOption).toHaveAttribute('aria-selected', 'true');

    const percentOption = screen.getByRole('option', { name: /Prozent/i });
    expect(percentOption).toHaveAttribute('aria-selected', 'false');
  });
});

describe('SessionSettings - English Translations', () => {
  it('should use English mode labels', () => {
    const props = createDefaultProps({
      translations: englishTranslations,
    });
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Equal/i });
    expect(modeButton).toHaveTextContent('Equal');
  });

  it('should show English mode options in dropdown', () => {
    const props = createDefaultProps({
      translations: englishTranslations,
    });
    render(<SessionSettings {...props} />);

    const modeButton = screen.getByRole('button', { name: /Equal/i });
    fireEvent.click(modeButton);

    expect(screen.getByRole('option', { name: /Equal/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Percent/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Adjustable/i })).toBeInTheDocument();
  });

  it('should use English checkbox labels', () => {
    const props = createDefaultProps({
      translations: englishTranslations,
    });
    render(<SessionSettings {...props} />);

    expect(screen.getByText('Consider Transfer Tax')).toBeInTheDocument();
    expect(screen.getByText('Show Roles')).toBeInTheDocument();
  });

  it('should use English explanation text', () => {
    const props = createDefaultProps({
      translations: englishTranslations,
    });
    render(<SessionSettings {...props} />);

    expect(screen.getByText(/Explanation: Equal/i)).toBeInTheDocument();
  });
});
