import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CrewPresetManager } from '../../components/CrewPresetManager';
import type { MemberInput, DistributionMode, CrewPreset, PresetMember } from '@/lib/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Assign mock to global
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================================================
// TEST DATA
// ============================================================================

const STORAGE_KEY = 'sc-payslip-crew-presets';

const mockPreset1: CrewPreset = {
  id: 'preset-1',
  name: 'Mining Team Alpha',
  members: [
    { handle: 'Pilot', role: 'Captain' },
    { handle: 'Miner1', role: 'Miner' },
    { handle: 'Miner2', role: 'Miner' },
  ],
  distributionMode: 'EQUAL',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T11:45:00.000Z',
};

const mockPreset2: CrewPreset = {
  id: 'preset-2',
  name: 'Trading Crew',
  members: [
    { handle: 'Captain', role: 'Captain' },
    { handle: 'Escort', role: 'Security' },
  ],
  distributionMode: 'PERCENT',
  createdAt: '2024-01-16T14:20:00.000Z',
  updatedAt: '2024-01-16T15:30:00.000Z',
};

const mockCurrentMembers: MemberInput[] = [
  { id: 'member-1', handle: 'Alice', role: 'Captain', active: true, revenue: 1000 },
  { id: 'member-2', handle: 'Bob', role: 'Crew', active: true, revenue: 500 },
];

const mockTranslationsEN = {
  crewPresets: 'Crew Presets',
  managePresets: 'Manage your saved crew configurations',
  saveCurrentCrew: 'Save Current Crew',
  presetNamePlaceholder: 'Enter preset name',
  saveCrewPreset: 'Save',
  noPresets: 'No saved presets',
  loadCrewPreset: 'Load',
  deleteSession: 'Delete',
  confirmDeletePreset: 'Delete this preset?',
  cancel: 'Cancel',
  presetMembers: 'members',
};

const mockTranslationsDE = {
  crewPresets: 'Crew-Vorlagen',
  managePresets: 'Verwalte deine gespeicherten Crew-Konfigurationen',
  saveCurrentCrew: 'Aktuelle Crew speichern',
  presetNamePlaceholder: 'Vorlagenname eingeben',
  saveCrewPreset: 'Speichern',
  noPresets: 'Keine gespeicherten Vorlagen',
  loadCrewPreset: 'Laden',
  deleteSession: 'Löschen',
  confirmDeletePreset: 'Diese Vorlage löschen?',
  cancel: 'Abbrechen',
  presetMembers: 'Mitglieder',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function setStoredPresets(presets: CrewPreset[]): void {
  localStorageMock.setItem(STORAGE_KEY, JSON.stringify(presets));
}

// ============================================================================
// TESTS
// ============================================================================

describe('CrewPresetManager - Initial Rendering', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    const { container } = render(
      <CrewPresetManager
        isOpen={false}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when isOpen is true', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check for dialog header
    expect(screen.getByText('Crew Presets')).toBeInTheDocument();
    expect(screen.getByText('Manage your saved crew configurations')).toBeInTheDocument();
  });

  it('should render with German translations', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="de"
        translations={mockTranslationsDE}
      />
    );

    expect(screen.getByText('Crew-Vorlagen')).toBeInTheDocument();
    expect(screen.getByText('Verwalte deine gespeicherten Crew-Konfigurationen')).toBeInTheDocument();
    expect(screen.getByText('Keine gespeicherten Vorlagen')).toBeInTheDocument();
  });
});

describe('CrewPresetManager - Empty State', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should display "no presets" message when presets array is empty', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText('No saved presets')).toBeInTheDocument();
  });

  it('should not display load button when there are no presets', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Load button should not be present (only Save button visible)
    expect(screen.queryByRole('button', { name: /^Load$/i })).not.toBeInTheDocument();
  });
});

describe('CrewPresetManager - List of Presets', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should show list of presets when presets exist', () => {
    setStoredPresets([mockPreset1, mockPreset2]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check preset names are displayed
    expect(screen.getByText('Mining Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Trading Crew')).toBeInTheDocument();
  });

  it('should show member count for each preset', () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Should show member count (3 members in mockPreset1)
    expect(screen.getByText(/3 members/i)).toBeInTheDocument();
  });

  it('should show member handles for preset', () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Should show handles
    expect(screen.getByText(/Pilot, Miner1, Miner2/)).toBeInTheDocument();
  });
});

describe('CrewPresetManager - Save Preset Flow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should allow typing a preset name in input', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const input = screen.getByPlaceholderText('Enter preset name');
    fireEvent.change(input, { target: { value: 'New Crew Preset' } });

    expect(input).toHaveValue('New Crew Preset');
  });

  it('should save preset when clicking save button with valid name', async () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="PERCENT"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Type a preset name
    const input = screen.getByPlaceholderText('Enter preset name');
    fireEvent.change(input, { target: { value: 'My New Crew' } });

    // Click save button
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    // Verify the preset was saved to localStorage
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    // The preset should now appear in the list
    await waitFor(() => {
      expect(screen.getByText('My New Crew')).toBeInTheDocument();
    });
  });

  it('should clear input after saving a preset', async () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const input = screen.getByPlaceholderText('Enter preset name');
    fireEvent.change(input, { target: { value: 'Test Crew' } });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});

describe('CrewPresetManager - Load Preset', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should call onLoadPreset with correct data when loading a preset', async () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Find and click the Load button for the preset
    const loadButton = screen.getByRole('button', { name: /^Load$/i });
    fireEvent.click(loadButton);

    // Verify callback was called with correct data
    expect(mockOnLoadPreset).toHaveBeenCalledTimes(1);
    expect(mockOnLoadPreset).toHaveBeenCalledWith(
      mockPreset1.members,
      mockPreset1.distributionMode
    );
  });

  it('should close dialog after loading a preset', async () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const loadButton = screen.getByRole('button', { name: /^Load$/i });
    fireEvent.click(loadButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('CrewPresetManager - Delete Preset', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should show delete confirmation when delete button is clicked', async () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button (trash icon)
    const deleteButton = screen.getByRole('button', { name: /delete preset/i });
    fireEvent.click(deleteButton);

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText('Delete this preset?')).toBeInTheDocument();
    });
  });

  it('should show Cancel and Delete buttons during confirmation', async () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete preset/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Delete$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Cancel$/i })).toBeInTheDocument();
    });
  });

  it('should delete preset when confirmation is accepted', async () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete preset/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /^Delete$/i });
      fireEvent.click(confirmButton);
    });

    // Preset should be removed
    await waitFor(() => {
      expect(screen.queryByText('Mining Team Alpha')).not.toBeInTheDocument();
    });

    // Empty state should appear
    expect(screen.getByText('No saved presets')).toBeInTheDocument();
  });

  it('should cancel deletion when cancel button is clicked', async () => {
    setStoredPresets([mockPreset1]);

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete preset/i });
    fireEvent.click(deleteButton);

    // Click cancel
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
      fireEvent.click(cancelButton);
    });

    // Preset should still be visible
    expect(screen.getByText('Mining Team Alpha')).toBeInTheDocument();

    // Confirmation should be hidden (Load button visible again)
    expect(screen.getByRole('button', { name: /^Load$/i })).toBeInTheDocument();
  });
});

describe('CrewPresetManager - Empty Preset Name Handling', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should disable save button when preset name is empty', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when preset name is only whitespace', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const input = screen.getByPlaceholderText('Enter preset name');
    fireEvent.change(input, { target: { value: '   ' } });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    expect(saveButton).toBeDisabled();
  });

  it('should not save preset when clicking save with empty name', () => {
    // Initial count of setItem calls
    const initialCallCount = localStorageMock.setItem.mock.calls.length;

    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Try to click save without entering a name (button should be disabled)
    const saveButton = screen.getByRole('button', { name: /^Save$/i });

    // Button should be disabled, so click won't work
    expect(saveButton).toBeDisabled();

    // No additional localStorage calls
    expect(localStorageMock.setItem.mock.calls.length).toBe(initialCallCount);
  });

  it('should enable save button when valid name is entered', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={mockCurrentMembers}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const input = screen.getByPlaceholderText('Enter preset name');
    const saveButton = screen.getByRole('button', { name: /^Save$/i });

    // Initially disabled
    expect(saveButton).toBeDisabled();

    // Enter a valid name
    fireEvent.change(input, { target: { value: 'Valid Name' } });

    // Now enabled
    expect(saveButton).not.toBeDisabled();
  });
});

describe('CrewPresetManager - No Current Members', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should disable input when there are no current members', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const input = screen.getByPlaceholderText('Enter preset name');
    expect(input).toBeDisabled();
  });

  it('should show helper text when no current members', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText('Add members first to save a preset.')).toBeInTheDocument();
  });

  it('should show German helper text when no current members', () => {
    const mockOnClose = vi.fn();
    const mockOnLoadPreset = vi.fn();

    render(
      <CrewPresetManager
        isOpen={true}
        onClose={mockOnClose}
        currentMembers={[]}
        currentDistributionMode="EQUAL"
        onLoadPreset={mockOnLoadPreset}
        lang="de"
        translations={mockTranslationsDE}
      />
    );

    expect(screen.getByText('Füge zuerst Mitglieder hinzu, um eine Vorlage zu speichern.')).toBeInTheDocument();
  });
});
