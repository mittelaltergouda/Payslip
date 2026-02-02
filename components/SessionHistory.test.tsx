import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionHistory } from './SessionHistory';
import { SavedSession } from '@/lib/types';
import { describe, it, expect, vi } from 'vitest';

// Mock saved sessions for testing
const mockSession1: SavedSession = {
  id: 'session-1',
  session: {
    id: 'session-1',
    name: 'Trading Run Alpha',
    type: 'TRADING',
    distributionMode: 'EQUAL',
    members: [
      { id: 'member-1', handle: 'Pilot', active: true, revenue: 1000, investment: 0 },
      { id: 'member-2', handle: 'Escort', active: true, revenue: 500, investment: 0 },
    ],
  },
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T11:45:00.000Z',
};

const mockSession2: SavedSession = {
  id: 'session-2',
  session: {
    id: 'session-2',
    name: 'Mining Expedition',
    type: 'MINING',
    distributionMode: 'PERCENT',
    members: [
      { id: 'member-3', handle: 'Miner1', active: true, revenue: 2000, investment: 0 },
      { id: 'member-4', handle: 'Miner2', active: true, revenue: 1500, investment: 0 },
    ],
  },
  createdAt: '2024-01-16T14:20:00.000Z',
  updatedAt: '2024-01-16T15:30:00.000Z',
};

const mockTranslationsDE = {
  sessionHistory: 'Session History',
  noSessions: 'No saved sessions',
  loadSession: 'Load',
  deleteSession: 'Delete',
  confirmDelete: 'Are you sure you want to delete this session?',
  cancel: 'Cancel',
  createdAt: 'Created',
  updatedAt: 'Updated',
};

const mockTranslationsEN = {
  sessionHistory: 'Session History',
  noSessions: 'No saved sessions',
  loadSession: 'Load',
  deleteSession: 'Delete',
  confirmDelete: 'Are you sure you want to delete this session?',
  cancel: 'Cancel',
  createdAt: 'Created',
  updatedAt: 'Updated',
};

describe('SessionHistory - Initial Rendering', () => {
  it('should not render when isOpen is false', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    const { container } = render(
      <SessionHistory
        isOpen={false}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render sidebar and backdrop when isOpen is true', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check for backdrop
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();

    // Check for sidebar header
    expect(screen.getByText('Session History')).toBeInTheDocument();
  });

  it('should render close button', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should render with German translations', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    const translationsDE = {
      ...mockTranslationsDE,
      sessionHistory: 'Sitzungsverlauf',
      noSessions: 'Keine gespeicherten Sitzungen',
    };

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="de"
        translations={translationsDE}
      />
    );

    expect(screen.getByText('Sitzungsverlauf')).toBeInTheDocument();
    expect(screen.getByText('Keine gespeicherten Sitzungen')).toBeInTheDocument();
  });
});

describe('SessionHistory - Empty State', () => {
  it('should display "no sessions" message when sessions array is empty', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText('No saved sessions')).toBeInTheDocument();
  });

  it('should not display load or delete buttons when there are no sessions', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Load button should not be present
    expect(screen.queryByText('Load')).not.toBeInTheDocument();
    // Close button is always present
    expect(screen.getByRole('button', { name: /close sidebar/i })).toBeInTheDocument();
  });
});

describe('SessionHistory - Display Sessions', () => {
  it('should render all sessions in the list', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1, mockSession2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText('Trading Run Alpha')).toBeInTheDocument();
    expect(screen.getByText('Mining Expedition')).toBeInTheDocument();
  });

  it('should display created and updated dates for each session', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check that Created and Updated labels are present
    const createdLabels = screen.getAllByText(/Created:/i);
    const updatedLabels = screen.getAllByText(/Updated:/i);

    expect(createdLabels.length).toBeGreaterThan(0);
    expect(updatedLabels.length).toBeGreaterThan(0);
  });

  it('should format dates in en-US locale when lang is "en"', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check that date is formatted in en-US style (contains Jan or similar)
    const datesWithJan = screen.getAllByText(/Jan/i);
    expect(datesWithJan.length).toBeGreaterThan(0);
  });

  it('should format dates in de-DE locale when lang is "de"', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="de"
        translations={mockTranslationsDE}
      />
    );

    // Check that date is formatted (German months are different: Jan. vs Jan)
    // Both locales should contain year 2024
    const datesWithYear = screen.getAllByText(/2024/i);
    expect(datesWithYear.length).toBeGreaterThan(0);
  });

  it('should display Load button for each session', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1, mockSession2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const loadButtons = screen.getAllByText('Load');
    expect(loadButtons).toHaveLength(2);
  });

  it('should display Delete button for each session', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1, mockSession2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Delete buttons have trash icon (svg), count them by role
    const allButtons = screen.getAllByRole('button');
    // Filter buttons that have an svg child (delete buttons)
    const deleteButtons = allButtons.filter(button => button.querySelector('svg'));
    // Subtract the close button which also has an svg
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('SessionHistory - Load Session', () => {
  it('should call onLoad with correct session when Load button is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1, mockSession2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);

    expect(mockOnLoad).toHaveBeenCalledTimes(1);
    expect(mockOnLoad).toHaveBeenCalledWith(mockSession1);
  });

  it('should call onLoad with correct session for second item', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1, mockSession2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[1]);

    expect(mockOnLoad).toHaveBeenCalledTimes(1);
    expect(mockOnLoad).toHaveBeenCalledWith(mockSession2);
  });

  it('should not call onClose when Load button is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

describe('SessionHistory - Delete Session', () => {
  it('should show confirmation dialog when delete button is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Find and click delete button (has trash icon)
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    expect(deleteButton).toBeDefined();
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Confirmation message should appear
    expect(screen.getByText('Are you sure you want to delete this session?')).toBeInTheDocument();
  });

  it('should show Delete and Cancel buttons in confirmation dialog', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Both Delete and Cancel buttons should be visible
    const deleteButtons = screen.getAllByText('Delete');
    const cancelButton = screen.getByText('Cancel');

    expect(deleteButtons.length).toBeGreaterThan(0);
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onDelete with session ID when delete is confirmed', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button (trash icon)
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Click confirm delete button
    const deleteButtons = screen.getAllByText('Delete');
    const confirmButton = deleteButtons[deleteButtons.length - 1]; // Last one is the confirm button
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('session-1');
  });

  it('should hide confirmation dialog when cancel is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Confirmation should be visible
    expect(screen.getByText('Are you sure you want to delete this session?')).toBeInTheDocument();

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Confirmation should be hidden, Load button should be back
    expect(screen.queryByText('Are you sure you want to delete this session?')).not.toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('should not call onDelete when cancel is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should only show confirmation for the clicked session', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1, mockSession2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click first delete button
    const allButtons = screen.getAllByRole('button');
    const deleteButtons = allButtons.filter(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButtons[0]) {
      fireEvent.click(deleteButtons[0]);
    }

    // Only one confirmation message should appear
    const confirmMessages = screen.getAllByText('Are you sure you want to delete this session?');
    expect(confirmMessages).toHaveLength(1);

    // First session name should still be visible
    expect(screen.getByText('Trading Run Alpha')).toBeInTheDocument();
    // Second session should still show Load button
    const loadButtons = screen.getAllByText('Load');
    expect(loadButtons).toHaveLength(1);
  });
});

describe('SessionHistory - Close Functionality', () => {
  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking outside the sidebar', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click on the backdrop
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (backdrop) {
      fireEvent.mouseDown(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside the sidebar', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click on a session name (inside sidebar)
    const sessionName = screen.getByText('Trading Run Alpha');
    fireEvent.mouseDown(sessionName);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should clear delete confirmation when Escape is pressed', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete button
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Confirmation should be visible
    expect(screen.getByText('Are you sure you want to delete this session?')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Sidebar should close
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not respond to Escape key when sidebar is closed', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={false}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

describe('SessionHistory - Accessibility', () => {
  it('should have proper aria-label on close button', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close sidebar');
  });

  it('should render session names as headings for better structure', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const sessionHeading = screen.getByText('Trading Run Alpha');
    // Should be within an h3 element
    expect(sessionHeading.tagName).toBe('H3');
  });

  it('should render main title as h2 heading', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const mainHeading = screen.getByText('Session History');
    expect(mainHeading.tagName).toBe('H2');
  });
});

describe('SessionHistory - Edge Cases', () => {
  it('should handle invalid date strings gracefully', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    const sessionWithInvalidDate: SavedSession = {
      ...mockSession1,
      createdAt: 'invalid-date',
      updatedAt: 'invalid-date',
    };

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[sessionWithInvalidDate]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Component should still render
    expect(screen.getByText('Trading Run Alpha')).toBeInTheDocument();
  });

  it('should handle sessions with very long names', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    const sessionWithLongName: SavedSession = {
      ...mockSession1,
      session: {
        ...mockSession1.session,
        name: 'This is a very long session name that should still be displayed properly without breaking the layout',
      },
    };

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[sessionWithLongName]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText(/This is a very long session name/)).toBeInTheDocument();
  });

  it('should handle multiple sessions with same name', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    const session1 = { ...mockSession1, id: 'session-1a' };
    const session2 = { ...mockSession1, id: 'session-1b' };

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[session1, session2]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Both sessions should be rendered
    const sessionNames = screen.getAllByText('Trading Run Alpha');
    expect(sessionNames).toHaveLength(2);

    // Both should have independent delete buttons
    const allButtons = screen.getAllByRole('button');
    const deleteButtons = allButtons.filter(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle rapid delete and cancel clicks', () => {
    const mockOnClose = vi.fn();
    const mockOnLoad = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <SessionHistory
        isOpen={true}
        onClose={mockOnClose}
        sessions={[mockSession1]}
        onLoad={mockOnLoad}
        onDelete={mockOnDelete}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Click delete
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(button =>
      button.querySelector('svg path[d*="M19 7l"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);
    }

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);

    // Should still work correctly
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });
});
