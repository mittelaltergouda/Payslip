import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Popover, PopoverTrigger, PopoverContent, PopoverClose, PopoverAnchor } from "./popover";
import { describe, it, expect, vi } from "vitest";

describe("Popover - Basic Rendering", () => {
  it("should render popover trigger", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.getByRole("button", { name: /open/i })).toBeInTheDocument();
  });

  it("should not show content by default", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("should show content when opened", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});

describe("Popover - Open/Close Behavior", () => {
  it("should open popover when trigger is clicked", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("should close popover when trigger is clicked again", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });

    // Open
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    // Close
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });

  it("should work as controlled component", async () => {
    const ControlledPopover = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
    };

    render(<ControlledPopover />);

    const trigger = screen.getByRole("button", { name: /toggle/i });

    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });

  it("should call onOpenChange when opened", async () => {
    const handleOpenChange = vi.fn();
    render(
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it("should call onOpenChange when closed", async () => {
    const handleOpenChange = vi.fn();
    render(
      <Popover defaultOpen onOpenChange={handleOpenChange}>
        <PopoverTrigger>Close</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /close/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("Popover - Keyboard Interaction", () => {
  it("should close popover when Escape is pressed", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });

  it("should be triggered by Enter key when trigger is a button", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("should support keyboard navigation", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    trigger.focus();
    expect(trigger).toHaveFocus();
  });
});

describe("Popover - PopoverClose Component", () => {
  it("should close popover when PopoverClose is clicked", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <div>Content</div>
          <PopoverClose>Close</PopoverClose>
        </PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });
});

describe("Popover - Sizes", () => {
  it("should render medium size by default", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("p-4");
      expect(content).toHaveClass("text-sm");
      expect(content).toHaveClass("max-w-sm");
    });
  });

  it("should render small size", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent size="sm" data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("p-3");
      expect(content).toHaveClass("text-xs");
      expect(content).toHaveClass("max-w-xs");
    });
  });

  it("should render medium size when explicitly specified", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent size="md" data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("p-4");
      expect(content).toHaveClass("text-sm");
      expect(content).toHaveClass("max-w-sm");
    });
  });

  it("should render large size", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent size="lg" data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("p-6");
      expect(content).toHaveClass("text-base");
      expect(content).toHaveClass("max-w-md");
    });
  });
});

describe("Popover - Custom Styling", () => {
  it("should apply custom className to content", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-class" data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("custom-class");
    });
  });

  it("should merge custom className with size styles", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent size="sm" className="custom-class" data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("custom-class");
      expect(content).toHaveClass("p-3");
    });
  });
});

describe("Popover - Base Styles", () => {
  it("should have base styling classes", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("z-50");
      expect(content).toHaveClass("rounded-lg");
      expect(content).toHaveClass("border");
      expect(content).toHaveClass("border-border-default");
      expect(content).toHaveClass("bg-surface-elevated");
      expect(content).toHaveClass("shadow-lg");
      expect(content).toHaveClass("outline-none");
    });
  });

  it("should have animation classes", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      const content = screen.getByTestId("popover-content");
      expect(content).toHaveClass("data-[state=open]:animate-in");
      expect(content).toHaveClass("data-[state=closed]:animate-out");
      expect(content).toHaveClass("data-[state=open]:fade-in-0");
      expect(content).toHaveClass("data-[state=closed]:fade-out-0");
    });
  });
});

describe("Popover - Accessibility", () => {
  it("should have proper ARIA attributes on trigger", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should update aria-expanded when opened", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("should be keyboard accessible", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    trigger.focus();

    expect(trigger).toHaveFocus();
  });

  it("should manage focus properly", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <button>Inside button</button>
        </PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Inside button")).toBeInTheDocument();
    });
  });
});

describe("Popover - PopoverAnchor Component", () => {
  it("should render popover anchor", () => {
    render(
      <Popover>
        <PopoverAnchor>
          <div>Anchor</div>
        </PopoverAnchor>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.getByText("Anchor")).toBeInTheDocument();
  });
});

describe("Popover - Positioning", () => {
  it("should support align prop", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("should support side prop", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent side="bottom">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("should support sideOffset prop", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("should support alignOffset prop", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent alignOffset={-5}>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});

describe("Popover - Ref Forwarding", () => {
  it("should forward ref to content element", async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent ref={ref}>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe("Popover - Additional Props", () => {
  it("should support data attributes on content", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="custom-popover">Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByTestId("custom-popover")).toBeInTheDocument();
    });
  });

  it("should support id attribute on trigger", () => {
    render(
      <Popover>
        <PopoverTrigger id="unique-trigger">Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    expect(trigger).toHaveAttribute("id", "unique-trigger");
  });
});

describe("Popover - Display Name", () => {
  it("should have display name for PopoverContent", () => {
    expect(PopoverContent.displayName).toBe("PopoverContent");
  });
});

describe("Popover - Edge Cases", () => {
  it("should handle modal prop", async () => {
    render(
      <Popover modal={false} defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("should allow uncontrolled usage", async () => {
    const handleOpenChange = vi.fn();
    render(
      <Popover defaultOpen={false} onOpenChange={handleOpenChange}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: /open/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("should render with complex content", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <h3>Title</h3>
          <p>Description</p>
          <button>Action</button>
        </PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /action/i })).toBeInTheDocument();
    });
  });
});
