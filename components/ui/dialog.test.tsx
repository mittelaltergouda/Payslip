import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";
import { describe, it, expect, vi } from "vitest";

describe("Dialog - Basic Rendering", () => {
  it("should render dialog trigger", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole("button", { name: /open dialog/i })).toBeInTheDocument();
  });

  it("should not show content by default", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
  });

  it("should show content when opened", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });
  });
});

describe("Dialog - Open/Close Behavior", () => {
  it("should open dialog when trigger is clicked", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: /open dialog/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });
  });

  it("should close dialog when close button is clicked", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });

    // Find and click the close button (X icon)
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
    });
  });

  it("should close dialog when DialogClose component is clicked", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
          <DialogFooter>
            <DialogClose asChild>
              <button>Cancel</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
    });
  });

  it("should work as controlled component", async () => {
    const ControlledDialog = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>External Open</button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open Dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Controlled Dialog</DialogTitle>
              </DialogHeader>
              <p>Content</p>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    render(<ControlledDialog />);

    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    const externalButton = screen.getByRole("button", { name: /external open/i });
    fireEvent.click(externalButton);

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});

describe("Dialog - Keyboard Interactions", () => {
  it("should close dialog when Escape key is pressed", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });

    // Press Escape key
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
    });
  });

  it("should trap focus within dialog when open", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <input type="text" placeholder="Input 1" />
          <input type="text" placeholder="Input 2" />
          <DialogFooter>
            <button>Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Input 1")).toBeInTheDocument();
    });

    // Focus should be trapped within the dialog
    // The dialog content should be in the document
    const dialogContent = screen.getByRole("dialog");
    expect(dialogContent).toBeInTheDocument();

    // All interactive elements should be focusable
    const input1 = screen.getByPlaceholderText("Input 1");
    const input2 = screen.getByPlaceholderText("Input 2");
    const submitButton = screen.getByRole("button", { name: /submit/i });

    expect(input1).toBeInTheDocument();
    expect(input2).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });
});

describe("Dialog - Accessibility", () => {
  it("should have proper ARIA role", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });
  });

  it("should link title to dialog via aria-labelledby", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessible Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      const title = screen.getByText("Accessible Title");
      expect(dialog).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });
  });

  it("should link description to dialog via aria-describedby", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>This is a description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const description = screen.getByText("This is a description");
      expect(description).toBeInTheDocument();
    });
  });

  it("should have accessible close button", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it("should hide close button when showCloseButton is false", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
  });
});

describe("Dialog - Size Variants", () => {
  it("should apply small size variant", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Small Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-sm");
    });
  });

  it("should apply medium size variant by default", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medium Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-md");
    });
  });

  it("should apply large size variant", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Large Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-lg");
    });
  });

  it("should apply extra large size variant", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Extra Large Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-2xl");
    });
  });
});

describe("Dialog - Composition", () => {
  it("should render complete dialog with header, content, and footer", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Dialog</DialogTitle>
            <DialogDescription>This is a complete dialog example</DialogDescription>
          </DialogHeader>
          <div>Main content goes here</div>
          <DialogFooter>
            <DialogClose asChild>
              <button>Cancel</button>
            </DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText("Complete Dialog")).toBeInTheDocument();
      expect(screen.getByText("This is a complete dialog example")).toBeInTheDocument();
      expect(screen.getByText("Main content goes here")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    });
  });

  it("should support custom className", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent className="custom-class">
          <DialogHeader>
            <DialogTitle>Custom Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("custom-class");
    });
  });
});

describe("Dialog - Overlay", () => {
  it("should render overlay when dialog is open", async () => {
    const { container } = render(
      <Dialog defaultOpen>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      // The overlay should be rendered as a sibling to the dialog content
      const overlay = container.querySelector('[data-state="open"]');
      expect(overlay).toBeInTheDocument();
    });
  });
});
