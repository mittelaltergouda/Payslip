"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";

/**
 * Props for the DeleteSessionDialog component.
 */
export interface DeleteSessionDialogProps {
  /**
   * Unique session identifier.
   */
  sessionId: string;

  /**
   * Session name to display in the confirmation message.
   */
  sessionName: string;

  /**
   * Current language for translations.
   */
  lang: Lang;

  /**
   * Whether the dialog is open (controlled).
   */
  open: boolean;

  /**
   * Callback when the dialog open state changes.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback invoked when the user confirms deletion.
   * Called with the sessionId as the parameter.
   */
  onDelete: (sessionId: string) => void;
}

/**
 * DeleteSessionDialog component displays a confirmation dialog for session deletion.
 *
 * This component provides a safe confirmation step before deleting a session,
 * preventing accidental deletions. It displays the session name in the
 * confirmation message and provides clear cancel and delete actions.
 *
 * Features:
 * - Displays session name in confirmation message
 * - Clear cancel and delete actions
 * - Accessible keyboard navigation
 * - Translatable messages
 * - Danger-styled delete button
 *
 * @example
 * ```tsx
 * const [dialogOpen, setDialogOpen] = useState(false);
 *
 * <DeleteSessionDialog
 *   sessionId="abc123"
 *   sessionName="Mining Session 2024-01-15"
 *   lang="en"
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 *   onDelete={(id) => {
 *     // Handle deletion
 *     console.log('Deleting session:', id);
 *   }}
 * />
 * ```
 */
export function DeleteSessionDialog({
  sessionId,
  sessionName,
  lang,
  open,
  onOpenChange,
  onDelete,
}: DeleteSessionDialogProps) {
  const t = translations[lang];

  /**
   * Handle delete confirmation
   */
  const handleDelete = React.useCallback(() => {
    onDelete(sessionId);
    onOpenChange(false);
  }, [sessionId, onDelete, onOpenChange]);

  /**
   * Handle cancel action
   */
  const handleCancel = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t.confirmDelete}</DialogTitle>
          <DialogDescription>
            {/* Confirmation message with session name */}
            {t.deleteConfirmMessage.replace('{sessionName}', sessionName)}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {/* Cancel button */}
          <DialogClose asChild>
            <Button variant="ghost" onClick={handleCancel}>
              {t.cancel}
            </Button>
          </DialogClose>

          {/* Delete button */}
          <Button variant="danger" onClick={handleDelete}>
            {t.deleteSession}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
