"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Props for the DuplicateSessionDialog component.
 */
export interface DuplicateSessionDialogProps {
  /**
   * Whether the dialog is currently open.
   */
  isOpen: boolean;

  /**
   * Callback function called when the dialog's open state changes.
   * Called with false when the dialog should be closed.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * The name of the session being duplicated.
   * Displayed in the dialog description for clarity.
   */
  sessionName: string;

  /**
   * Callback function called when the user confirms duplication.
   * Receives a boolean indicating whether expenses should be copied.
   */
  onConfirm: (copyExpenses: boolean) => void;

  /**
   * Translation strings for the dialog.
   */
  translations: {
    duplicateSessionTitle: string;
    duplicateSessionDescription: string;
    copyExpenses: string;
    duplicateSession: string;
    cancel: string;
  };
}

/**
 * DuplicateSessionDialog Component
 *
 * A confirmation dialog for duplicating a session. Allows users to choose
 * whether to include expenses in the duplicated session.
 *
 * Features:
 * - Controlled state via isOpen/onOpenChange props
 * - Checkbox to optionally copy expenses (default: unchecked)
 * - Displays session name for confirmation
 * - Cancel and Duplicate action buttons
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <DuplicateSessionDialog
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   sessionName="Mining Run #42"
 *   onConfirm={(copyExpenses) => {
 *     handleDuplicate(copyExpenses);
 *     setIsOpen(false);
 *   }}
 *   translations={{
 *     duplicateSessionTitle: "Duplicate Session",
 *     duplicateSessionDescription: "Create a copy of this session",
 *     copyExpenses: "Copy expenses",
 *     duplicateSession: "Duplicate",
 *     cancel: "Cancel",
 *   }}
 * />
 * ```
 */
export function DuplicateSessionDialog({
  isOpen,
  onOpenChange,
  sessionName,
  onConfirm,
  translations,
}: DuplicateSessionDialogProps) {
  // Local state for the "copy expenses" checkbox
  const [copyExpenses, setCopyExpenses] = React.useState<boolean>(false);

  // Reset checkbox state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setCopyExpenses(false);
    }
  }, [isOpen]);

  /**
   * Handle confirm button click.
   * Calls onConfirm with the copyExpenses value.
   */
  const handleConfirm = React.useCallback(() => {
    onConfirm(copyExpenses);
  }, [onConfirm, copyExpenses]);

  /**
   * Handle checkbox state change.
   * Accepts boolean or "indeterminate" from Radix UI Checkbox.
   */
  const handleCheckboxChange = React.useCallback(
    (checked: boolean | "indeterminate") => {
      // Only accept boolean values, ignore indeterminate
      if (typeof checked === "boolean") {
        setCopyExpenses(checked);
      }
    },
    []
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="sm" aria-describedby="duplicate-dialog-description">
        <DialogHeader>
          <DialogTitle>{translations.duplicateSessionTitle}</DialogTitle>
          <DialogDescription id="duplicate-dialog-description">
            {translations.duplicateSessionDescription}:{" "}
            <span className="font-semibold text-text-primary">{sessionName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Copy expenses checkbox */}
        <div className="flex items-center gap-3 py-4">
          <Checkbox
            id="copy-expenses"
            checked={copyExpenses}
            onCheckedChange={handleCheckboxChange}
            aria-label={translations.copyExpenses}
          />
          <label
            htmlFor="copy-expenses"
            className="text-sm text-text-primary cursor-pointer select-none"
          >
            {translations.copyExpenses}
          </label>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{translations.cancel}</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>
            {translations.duplicateSession}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DuplicateSessionDialog.displayName = "DuplicateSessionDialog";
