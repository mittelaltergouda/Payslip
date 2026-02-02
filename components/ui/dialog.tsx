"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Dialog overlay variant styles using class-variance-authority.
 * Provides a backdrop behind the dialog content.
 */
const dialogOverlayVariants = cva(
  // Base styles for the overlay
  "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
);

/**
 * Dialog content variant styles using class-variance-authority.
 * Supports multiple sizes with consistent design tokens.
 */
const dialogContentVariants = cva(
  // Base styles applied to all dialog content
  "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] rounded-lg border border-border-default bg-surface-elevated shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus:outline-none",
  {
    variants: {
      /**
       * Size variants for different contexts
       * - sm: Compact for confirmations and simple inputs
       * - md: Default size for most use cases
       * - lg: Large for complex forms and content
       * - xl: Extra large for full-featured dialogs
       */
      size: {
        sm: "w-full max-w-sm p-4",
        md: "w-full max-w-md p-6",
        lg: "w-full max-w-lg p-6",
        xl: "w-full max-w-2xl p-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Dialog header variant styles.
 */
const dialogHeaderVariants = cva(
  "flex flex-col space-y-1.5 text-center sm:text-left"
);

/**
 * Dialog footer variant styles.
 */
const dialogFooterVariants = cva(
  "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6"
);

/**
 * Dialog title variant styles.
 */
const dialogTitleVariants = cva(
  "text-lg font-semibold leading-none tracking-tight text-text-primary"
);

/**
 * Dialog description variant styles.
 */
const dialogDescriptionVariants = cva(
  "text-sm text-text-secondary"
);

/**
 * Props for the Dialog component root.
 */
export interface DialogProps extends DialogPrimitive.DialogProps {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the DialogOverlay component.
 */
export interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the DialogContent component.
 */
export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Whether to show the close button (X icon) in the top-right corner.
   * @default true
   */
  showCloseButton?: boolean;
}

/**
 * Props for the DialogHeader component.
 */
export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the DialogFooter component.
 */
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the DialogTitle component.
 */
export interface DialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the DialogDescription component.
 */
export interface DialogDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Dialog Component (Root)
 *
 * A flexible, accessible dialog (modal) component built on Radix UI Dialog primitive.
 * Provides a modal overlay that displays content on top of the main page.
 *
 * Features:
 * - Full accessibility support (focus trap, keyboard navigation, ARIA)
 * - Smooth animations and transitions
 * - Portal rendering to avoid z-index issues
 * - Backdrop with blur effect
 * - Controlled or uncontrolled state
 * - Escape key to close
 * - Click outside to close (optional)
 * - Focus returns to trigger after closing
 *
 * @example
 * ```tsx
 * // Basic uncontrolled dialog
 * <Dialog>
 *   <DialogTrigger>Open Dialog</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description goes here</DialogDescription>
 *     </DialogHeader>
 *     <p>Dialog content</p>
 *   </DialogContent>
 * </Dialog>
 *
 * // Controlled dialog
 * const [open, setOpen] = useState(false);
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger>Toggle</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Controlled Dialog</DialogTitle>
 *     </DialogHeader>
 *     <p>Content</p>
 *     <DialogFooter>
 *       <button onClick={() => setOpen(false)}>Close</button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export const Dialog = DialogPrimitive.Root;

/**
 * DialogTrigger Component
 *
 * The button or element that opens the dialog.
 * Accepts any valid React element as children.
 *
 * @example
 * ```tsx
 * <DialogTrigger>
 *   <button>Open Dialog</button>
 * </DialogTrigger>
 *
 * // Or with asChild to merge props with child
 * <DialogTrigger asChild>
 *   <Button>Open Dialog</Button>
 * </DialogTrigger>
 * ```
 */
export const DialogTrigger = DialogPrimitive.Trigger;

/**
 * DialogPortal Component
 *
 * Portals the dialog content to a different part of the DOM.
 * Useful for ensuring proper stacking context and avoiding z-index issues.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <DialogPortal>
 *     <DialogOverlay />
 *     <DialogContent>Content</DialogContent>
 *   </DialogPortal>
 * </Dialog>
 * ```
 */
export const DialogPortal = DialogPrimitive.Portal;

/**
 * DialogClose Component
 *
 * A button that closes the dialog when clicked.
 * Useful for adding explicit close buttons within the dialog.
 *
 * @example
 * ```tsx
 * <DialogContent>
 *   <p>Content</p>
 *   <DialogClose asChild>
 *     <button>Close</button>
 *   </DialogClose>
 * </DialogContent>
 *
 * // Or with custom positioning
 * <DialogClose className="absolute top-4 right-4">
 *   <X className="h-4 w-4" />
 * </DialogClose>
 * ```
 */
export const DialogClose = DialogPrimitive.Close;

/**
 * DialogOverlay Component
 *
 * The backdrop overlay that appears behind the dialog content.
 * Typically used to dim the background and draw focus to the dialog.
 *
 * Features:
 * - Blur effect for visual depth
 * - Smooth fade-in/fade-out animations
 * - Automatically rendered by DialogContent, but can be customized
 *
 * @example
 * ```tsx
 * // Default usage (handled by DialogContent)
 * <DialogContent>Content</DialogContent>
 *
 * // Custom overlay
 * <DialogPortal>
 *   <DialogOverlay className="bg-red-500/30" />
 *   <DialogContent>Content</DialogContent>
 * </DialogPortal>
 * ```
 */
export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(dialogOverlayVariants(), className)}
    {...props}
  />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent Component
 *
 * The container for dialog content that appears when the dialog is open.
 * Automatically centered on screen with overlay backdrop.
 *
 * Features:
 * - Four size variants (sm, md, lg, xl)
 * - Portal rendering for proper stacking
 * - Focus trap to keep keyboard navigation within dialog
 * - Escape key to close
 * - Optional close button (X icon)
 * - Smooth enter/exit animations
 * - Accessible ARIA attributes
 *
 * @example
 * ```tsx
 * // Standard content
 * <DialogContent>
 *   <DialogHeader>
 *     <DialogTitle>Title</DialogTitle>
 *     <DialogDescription>Description</DialogDescription>
 *   </DialogHeader>
 *   <p>Content</p>
 * </DialogContent>
 *
 * // Small dialog
 * <DialogContent size="sm">
 *   <p>Compact dialog</p>
 * </DialogContent>
 *
 * // Large dialog without close button
 * <DialogContent size="lg" showCloseButton={false}>
 *   <div>Rich content</div>
 * </DialogContent>
 *
 * // Extra large dialog with footer
 * <DialogContent size="xl">
 *   <DialogHeader>
 *     <DialogTitle>Large Form</DialogTitle>
 *   </DialogHeader>
 *   <form>...</form>
 *   <DialogFooter>
 *     <button>Submit</button>
 *   </DialogFooter>
 * </DialogContent>
 * ```
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, size, showCloseButton = true, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ size, className }))}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-surface-base transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-elevated">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));

DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * DialogHeader Component
 *
 * A container for the dialog title and description.
 * Provides consistent spacing and alignment.
 *
 * @example
 * ```tsx
 * <DialogContent>
 *   <DialogHeader>
 *     <DialogTitle>Confirm Action</DialogTitle>
 *     <DialogDescription>
 *       Are you sure you want to continue?
 *     </DialogDescription>
 *   </DialogHeader>
 *   <DialogFooter>
 *     <button>Confirm</button>
 *   </DialogFooter>
 * </DialogContent>
 * ```
 */
export const DialogHeader = ({
  className,
  ...props
}: DialogHeaderProps) => (
  <div className={cn(dialogHeaderVariants(), className)} {...props} />
);

DialogHeader.displayName = "DialogHeader";

/**
 * DialogFooter Component
 *
 * A container for dialog action buttons.
 * Provides consistent spacing and alignment for footer actions.
 *
 * @example
 * ```tsx
 * <DialogContent>
 *   <DialogHeader>
 *     <DialogTitle>Delete Item</DialogTitle>
 *   </DialogHeader>
 *   <p>This action cannot be undone.</p>
 *   <DialogFooter>
 *     <DialogClose asChild>
 *       <button>Cancel</button>
 *     </DialogClose>
 *     <button onClick={handleDelete}>Delete</button>
 *   </DialogFooter>
 * </DialogContent>
 * ```
 */
export const DialogFooter = ({
  className,
  ...props
}: DialogFooterProps) => (
  <div className={cn(dialogFooterVariants(), className)} {...props} />
);

DialogFooter.displayName = "DialogFooter";

/**
 * DialogTitle Component
 *
 * The title of the dialog. Automatically linked to the dialog for accessibility.
 * Required for accessible dialogs.
 *
 * @example
 * ```tsx
 * <DialogHeader>
 *   <DialogTitle>Confirmation Required</DialogTitle>
 *   <DialogDescription>Please review before proceeding</DialogDescription>
 * </DialogHeader>
 * ```
 */
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(dialogTitleVariants(), className)}
    {...props}
  />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription Component
 *
 * A description or additional context for the dialog.
 * Automatically linked to the dialog for accessibility.
 *
 * @example
 * ```tsx
 * <DialogHeader>
 *   <DialogTitle>Delete Account</DialogTitle>
 *   <DialogDescription>
 *     This will permanently delete your account and all associated data.
 *     This action cannot be undone.
 *   </DialogDescription>
 * </DialogHeader>
 * ```
 */
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(dialogDescriptionVariants(), className)}
    {...props}
  />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Export variant types for external use
export {
  dialogOverlayVariants,
  dialogContentVariants,
  dialogHeaderVariants,
  dialogFooterVariants,
  dialogTitleVariants,
  dialogDescriptionVariants,
};
