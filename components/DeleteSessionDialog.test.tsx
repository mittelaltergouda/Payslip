import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteSessionDialog } from './DeleteSessionDialog';

describe('DeleteSessionDialog', () => {
  it('renders with session name in confirmation message', () => {
    render(
      <DeleteSessionDialog
        sessionId="test-id"
        sessionName="Test Session"
        lang="en"
        open={true}
        onOpenChange={() => {}}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/Test Session/i)).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const mockOnDelete = vi.fn();
    render(
      <DeleteSessionDialog
        sessionId="test-id"
        sessionName="Test Session"
        lang="en"
        open={true}
        onOpenChange={() => {}}
        onDelete={mockOnDelete}
      />
    );

    // Find delete button - English translation is just "Delete"
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('test-id');
  });

  it('calls onOpenChange when cancel button clicked', () => {
    const mockOnOpenChange = vi.fn();
    render(
      <DeleteSessionDialog
        sessionId="test-id"
        sessionName="Test Session"
        lang="en"
        open={true}
        onOpenChange={mockOnOpenChange}
        onDelete={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render when open is false', () => {
    render(
      <DeleteSessionDialog
        sessionId="test-id"
        sessionName="Test Session"
        lang="en"
        open={false}
        onOpenChange={() => {}}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByText(/Test Session/i)).not.toBeInTheDocument();
  });
});
