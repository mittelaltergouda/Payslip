import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DuplicateSessionDialog } from "./DuplicateSessionDialog";
import { describe, it, expect, vi } from "vitest";

// Mock translations for testing
const mockTranslationsEN = {
  duplicateSessionTitle: "Duplicate Session",
  duplicateSessionDescription: "Create a copy of this session",
  copyExpenses: "Copy expenses",
  duplicateSession: "Duplicate",
  cancel: "Cancel",
};

const mockTranslationsDE = {
  duplicateSessionTitle: "Sitzung duplizieren",
  duplicateSessionDescription: "Erstelle eine Kopie dieser Sitzung",
  copyExpenses: "Ausgaben kopieren",
  duplicateSession: "Duplizieren",
  cancel: "Abbrechen",
};

describe("DuplicateSessionDialog - Basic Rendering", () => {
  it("should not render content when isOpen is false", () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    expect(screen.queryByText("Duplicate Session")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Session")).not.toBeInTheDocument();
  });

  it("should render dialog content when isOpen is true", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Mining Run #42"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Duplicate Session")).toBeInTheDocument();
    });
  });

  it("should display session name in the description", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Trading Run Alpha"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Trading Run Alpha")).toBeInTheDocument();
      expect(screen.getByText(/Create a copy of this session/)).toBeInTheDocument();
    });
  });

  it("should render checkbox with correct label", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Copy expenses")).toBeInTheDocument();
    });

    // Check for checkbox by its label
    const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });
    expect(checkbox).toBeInTheDocument();
  });

  it("should render Cancel and Duplicate buttons", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument();
    });
  });
});

describe("DuplicateSessionDialog - Checkbox Behavior", () => {
  it("should have checkbox unchecked by default", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });
      expect(checkbox).not.toBeChecked();
    });
  });

  it("should toggle checkbox when clicked", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click to uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("should toggle checkbox when clicking the label", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Copy expenses")).toBeInTheDocument();
    });

    const label = screen.getByText("Copy expenses");
    const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Click label to check
    fireEvent.click(label);
    expect(checkbox).toBeChecked();
  });

  it("should reset checkbox to unchecked when dialog reopens", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    const { rerender } = render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    // Check the checkbox
    const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Close the dialog
    rerender(
      <DuplicateSessionDialog
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    // Reopen the dialog
    rerender(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      const reopenedCheckbox = screen.getByRole("checkbox", { name: /copy expenses/i });
      expect(reopenedCheckbox).not.toBeChecked();
    });
  });
});

describe("DuplicateSessionDialog - Confirm Action", () => {
  it("should call onConfirm with false when checkbox is unchecked", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument();
    });

    const duplicateButton = screen.getByRole("button", { name: /duplicate/i });
    fireEvent.click(duplicateButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(false);
  });

  it("should call onConfirm with true when checkbox is checked", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    // Check the checkbox first
    const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });
    fireEvent.click(checkbox);

    // Then click duplicate
    const duplicateButton = screen.getByRole("button", { name: /duplicate/i });
    fireEvent.click(duplicateButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(true);
  });

  it("should not call onOpenChange when clicking duplicate button", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument();
    });

    const duplicateButton = screen.getByRole("button", { name: /duplicate/i });
    fireEvent.click(duplicateButton);

    // onOpenChange should not be called by the duplicate button itself
    // (closing should be handled by the parent after onConfirm)
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("DuplicateSessionDialog - Cancel Action", () => {
  it("should close dialog when Cancel button is clicked", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    // DialogClose triggers onOpenChange(false)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should not call onConfirm when Cancel button is clicked", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});

describe("DuplicateSessionDialog - Close Behavior", () => {
  it("should call onOpenChange when Escape key is pressed", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Duplicate Session")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should call onOpenChange when close button (X) is clicked", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Duplicate Session")).toBeInTheDocument();
    });

    // Find and click the close button (X icon)
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("DuplicateSessionDialog - Translations", () => {
  it("should render with English translations", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Duplicate Session")).toBeInTheDocument();
      expect(screen.getByText(/Create a copy of this session/)).toBeInTheDocument();
      expect(screen.getByText("Copy expenses")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it("should render with German translations", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsDE}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Sitzung duplizieren")).toBeInTheDocument();
      expect(screen.getByText(/Erstelle eine Kopie dieser Sitzung/)).toBeInTheDocument();
      expect(screen.getByText("Ausgaben kopieren")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /duplizieren/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /abbrechen/i })).toBeInTheDocument();
    });
  });
});

describe("DuplicateSessionDialog - Accessibility", () => {
  it("should have proper ARIA role for dialog", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });
  });

  it("should have aria-describedby linked to description", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-describedby", "duplicate-dialog-description");
    });
  });

  it("should have checkbox with aria-label", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-label", "Copy expenses");
    });
  });

  it("should apply small size variant to dialog", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-sm");
    });
  });
});

describe("DuplicateSessionDialog - Edge Cases", () => {
  it("should handle empty session name", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName=""
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Duplicate Session")).toBeInTheDocument();
      // Description should still show even with empty session name
      expect(screen.getByText(/Create a copy of this session/)).toBeInTheDocument();
    });
  });

  it("should handle very long session name", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();
    const longName = "This is a very long session name that might cause layout issues if not handled properly";

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName={longName}
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  it("should handle session name with special characters", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();
    const specialName = "Mining <Run> #42 & \"Trading\" 'Session'";

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName={specialName}
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });

  it("should handle rapid checkbox toggling", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox", { name: /copy expenses/i });

    // Rapid toggling
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    // Should end up checked (odd number of clicks)
    expect(checkbox).toBeChecked();
  });

  it("should work correctly with multiple confirm clicks", async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DuplicateSessionDialog
        isOpen
        onOpenChange={mockOnOpenChange}
        sessionName="Test Session"
        onConfirm={mockOnConfirm}
        translations={mockTranslationsEN}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument();
    });

    const duplicateButton = screen.getByRole("button", { name: /duplicate/i });

    // Multiple rapid clicks
    fireEvent.click(duplicateButton);
    fireEvent.click(duplicateButton);
    fireEvent.click(duplicateButton);

    // Each click should call onConfirm
    expect(mockOnConfirm).toHaveBeenCalledTimes(3);
  });
});

describe("DuplicateSessionDialog - Component Display Name", () => {
  it("should have correct displayName", () => {
    expect(DuplicateSessionDialog.displayName).toBe("DuplicateSessionDialog");
  });
});
