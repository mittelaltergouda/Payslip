import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select";
import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock scrollIntoView for Radix UI components
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Helper component for testing
const TestSelect = ({
  value,
  onValueChange,
  error = false,
  size = "md" as const,
  disabled = false,
  triggerClassName = "",
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  error?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  triggerClassName?: string;
}) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger error={error} size={size} className={triggerClassName}>
      <SelectValue placeholder="Select an option" />
    </SelectTrigger>
    <SelectContent size={size}>
      <SelectItem value="option1">Option 1</SelectItem>
      <SelectItem value="option2">Option 2</SelectItem>
      <SelectItem value="option3">Option 3</SelectItem>
    </SelectContent>
  </Select>
);

describe("Select - Basic Rendering", () => {
  it("should render a select trigger", () => {
    render(<TestSelect />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should render placeholder text", () => {
    render(<TestSelect />);

    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("should render with default value", () => {
    render(<TestSelect value="option1" />);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("should render trigger with chevron icon", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    const icon = trigger.querySelector("svg");

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Select - Interaction", () => {
  it("should open dropdown when trigger is clicked", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("should display all options when opened", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Option 1" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Option 2" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Option 3" })).toBeInTheDocument();
    });
  });

  it("should call onValueChange when option is selected", async () => {
    const handleChange = vi.fn();
    render(<TestSelect onValueChange={handleChange} />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const option = screen.getByRole("option", { name: "Option 2" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("option2");
    });
  });

  it("should update displayed value when selection changes", async () => {
    const TestControlled = () => {
      const [value, setValue] = React.useState<string>();
      return <TestSelect value={value} onValueChange={setValue} />;
    };

    render(<TestControlled />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const option = screen.getByRole("option", { name: "Option 1" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });
  });

  it("should close dropdown after selection", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const option = screen.getByRole("option", { name: "Option 1" });
    fireEvent.click(option);

    await waitFor(
      () => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });
});

describe("Select - Sizes", () => {
  it("should render medium size by default", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-10");
    expect(trigger).toHaveClass("px-4");
    expect(trigger).toHaveClass("text-sm");
  });

  it("should render small size", () => {
    render(<TestSelect size="sm" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-8");
    expect(trigger).toHaveClass("px-3");
    expect(trigger).toHaveClass("text-xs");
  });

  it("should render medium size when explicitly specified", () => {
    render(<TestSelect size="md" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-10");
    expect(trigger).toHaveClass("px-4");
    expect(trigger).toHaveClass("text-sm");
  });

  it("should render large size", () => {
    render(<TestSelect size="lg" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-12");
    expect(trigger).toHaveClass("px-6");
    expect(trigger).toHaveClass("text-base");
  });
});

describe("Select - Variants", () => {
  it("should render default variant", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("bg-white/5");
    expect(trigger).toHaveClass("border-border-default");
    expect(trigger).toHaveClass("text-text-primary");
  });

  it("should render error variant when error prop is true", () => {
    render(<TestSelect error />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("bg-feedback-error-bg");
    expect(trigger).toHaveClass("border-border-error");
  });
});

describe("Select - Error State", () => {
  it("should have aria-invalid when error is true", () => {
    render(<TestSelect error />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
  });

  it("should not have aria-invalid when error is false", () => {
    render(<TestSelect error={false} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-invalid", "false");
  });

  it("should support errorId for aria-describedby", () => {
    render(
      <Select>
        <SelectTrigger error errorId="error-message">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-describedby", "error-message");
  });
});

describe("Select - Disabled State", () => {
  it("should render disabled select", () => {
    render(<TestSelect disabled />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
  });

  it("should have disabled styling", () => {
    render(<TestSelect disabled />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("disabled:opacity-50");
    expect(trigger).toHaveClass("disabled:cursor-not-allowed");
  });

  it("should not open when disabled trigger is clicked", async () => {
    render(<TestSelect disabled />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(
      () => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      },
      { timeout: 100 }
    );
  });
});

describe("Select - Keyboard Navigation", () => {
  it("should be keyboard accessible", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    expect(trigger).toHaveFocus();
  });

  it("should open dropdown on Enter key", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("should open dropdown on Space key", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    fireEvent.keyDown(trigger, { key: " " });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("should open dropdown on ArrowDown key", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("should open dropdown on ArrowUp key", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "ArrowUp" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });
});

describe("Select - Custom Styling", () => {
  it("should apply custom className to trigger", () => {
    render(<TestSelect triggerClassName="custom-class" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("custom-class");
  });

  it("should merge custom className with variant styles", () => {
    render(<TestSelect triggerClassName="w-full" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("w-full");
    expect(trigger).toHaveClass("bg-white/5");
  });
});

describe("Select - SelectGroup and SelectLabel", () => {
  it("should render select group with label", async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Fruits")).toBeInTheDocument();
    });
  });

  it("should render label with correct styling", async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            <SelectItem value="1">Item</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      const label = screen.getByText("Category");
      expect(label).toHaveClass("text-xs");
      expect(label).toHaveClass("font-semibold");
      expect(label).toHaveClass("text-text-muted");
    });
  });
});

describe("Select - SelectSeparator", () => {
  it("should render separator between items", async () => {
    render(
      <Select>
        <SelectTrigger data-testid="separator-trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
          <SelectSeparator data-testid="separator" />
          <SelectItem value="2">Two</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId("separator-trigger");
    fireEvent.click(trigger);

    await waitFor(
      () => {
        const separator = screen.getByTestId("separator");
        expect(separator).toBeInTheDocument();
        expect(separator).toHaveClass("bg-border-default");
      },
      { timeout: 500 }
    );
  });
});

describe("Select - SelectItem", () => {
  it("should render item with check indicator when selected", async () => {
    render(<TestSelect value="option1" />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      const selectedItem = screen.getByRole("option", { name: "Option 1" });
      expect(selectedItem).toHaveAttribute("data-state", "checked");
    });
  });

  it("should support disabled items", async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
          <SelectItem value="2" disabled>
            Two (Disabled)
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      const disabledItem = screen.getByRole("option", { name: "Two (Disabled)" });
      expect(disabledItem).toHaveAttribute("data-disabled");
    });
  });

  it("should render item with different sizes", async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sm" size="sm">
            Small
          </SelectItem>
          <SelectItem value="md" size="md">
            Medium
          </SelectItem>
          <SelectItem value="lg" size="lg">
            Large
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      const smallItem = screen.getByRole("option", { name: "Small" });
      const largeItem = screen.getByRole("option", { name: "Large" });

      expect(smallItem).toHaveClass("text-xs");
      expect(largeItem).toHaveClass("text-base");
    });
  });
});

describe("Select - Base Styles", () => {
  it("should have inline-flex display", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("inline-flex");
  });

  it("should have items-center alignment", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("items-center");
    expect(trigger).toHaveClass("justify-between");
  });

  it("should have gap for spacing", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("gap-2");
  });

  it("should have rounded corners", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("rounded-lg");
  });

  it("should have transition styles", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("transition-all");
    expect(trigger).toHaveClass("duration-200");
  });

  it("should have focus styles", () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("focus:outline-none");
    expect(trigger).toHaveClass("focus:ring-2");
    expect(trigger).toHaveClass("focus:ring-border-focus");
  });
});

describe("Select - Accessibility", () => {
  it("should have combobox role", () => {
    render(<TestSelect />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should have expanded state when open", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("should support aria-label", () => {
    render(
      <Select>
        <SelectTrigger aria-label="Select distribution mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox", { name: "Select distribution mode" });
    expect(trigger).toHaveAttribute("aria-label", "Select distribution mode");
  });

  it("should have listbox role for content", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("should have option role for items", async () => {
    render(<TestSelect />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Option 1" })).toBeInTheDocument();
    });
  });
});

describe("Select - Ref Forwarding", () => {
  it("should forward ref to trigger element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("should allow ref methods to be called", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
        </SelectContent>
      </Select>
    );

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });
});

describe("Select - Display Name", () => {
  it("should have display name for SelectTrigger", () => {
    expect(SelectTrigger.displayName).toBe("SelectTrigger");
  });

  it("should have display name for SelectContent", () => {
    expect(SelectContent.displayName).toBe("SelectContent");
  });

  it("should have display name for SelectLabel", () => {
    expect(SelectLabel.displayName).toBe("SelectLabel");
  });

  it("should have display name for SelectItem", () => {
    expect(SelectItem.displayName).toBe("SelectItem");
  });

  it("should have display name for SelectSeparator", () => {
    expect(SelectSeparator.displayName).toBe("SelectSeparator");
  });
});
