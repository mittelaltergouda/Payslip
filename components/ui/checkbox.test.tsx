import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Checkbox } from "./checkbox";
import { describe, it, expect, vi } from "vitest";

describe("Checkbox - Basic Rendering", () => {
  it("should render a checkbox", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("should render unchecked by default", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");
    expect(checkboxElement).toHaveAttribute("aria-checked", "false");
  });

  it("should render checked when checked prop is true", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "checked");
    expect(checkboxElement).toHaveAttribute("aria-checked", "true");
  });

  it("should render unchecked when checked prop is false", () => {
    render(<Checkbox checked={false} aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");
    expect(checkboxElement).toHaveAttribute("aria-checked", "false");
  });
});

describe("Checkbox - Sizes", () => {
  it("should render medium size by default", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("h-5");
    expect(checkboxElement).toHaveClass("w-5");
  });

  it("should render small size", () => {
    render(<Checkbox size="sm" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("h-4");
    expect(checkboxElement).toHaveClass("w-4");
  });

  it("should render medium size when explicitly specified", () => {
    render(<Checkbox size="md" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("h-5");
    expect(checkboxElement).toHaveClass("w-5");
  });

  it("should render large size", () => {
    render(<Checkbox size="lg" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("h-6");
    expect(checkboxElement).toHaveClass("w-6");
  });
});

describe("Checkbox - Checked State Combinations", () => {
  it("should apply checked styles when checked", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "checked");
    expect(checkboxElement).toHaveClass("data-[state=checked]:bg-interaction-primary");
  });

  it("should apply unchecked styles when unchecked", () => {
    render(<Checkbox checked={false} aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");
    expect(checkboxElement).toHaveClass("data-[state=unchecked]:bg-white/5");
  });

  it("should combine checked state with small size", () => {
    render(<Checkbox checked size="sm" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "checked");
    expect(checkboxElement).toHaveClass("h-4");
  });

  it("should combine unchecked state with large size", () => {
    render(<Checkbox checked={false} size="lg" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");
    expect(checkboxElement).toHaveClass("h-6");
  });
});

describe("Checkbox - Disabled State", () => {
  it("should render disabled checkbox", () => {
    render(<Checkbox disabled aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toBeDisabled();
    expect(checkboxElement).toHaveClass("disabled:opacity-50");
    expect(checkboxElement).toHaveClass("disabled:cursor-not-allowed");
  });

  it("should not trigger onCheckedChange when disabled", () => {
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} disabled aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    fireEvent.click(checkboxElement);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("should have pointer-events-none when disabled", () => {
    render(<Checkbox disabled aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("disabled:pointer-events-none");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Checkbox disabled aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("disabled");
  });
});

describe("Checkbox - Click Handling", () => {
  it("should call onCheckedChange when clicked from unchecked to checked", () => {
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    fireEvent.click(checkboxElement);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("should call onCheckedChange when clicked from checked to unchecked", () => {
    const handleChange = vi.fn();
    render(<Checkbox checked onCheckedChange={handleChange} aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    fireEvent.click(checkboxElement);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("should toggle multiple times", () => {
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    fireEvent.click(checkboxElement);
    fireEvent.click(checkboxElement);
    fireEvent.click(checkboxElement);

    expect(handleChange).toHaveBeenCalledTimes(3);
  });

  it("should work as controlled component", () => {
    const ControlledCheckbox = () => {
      const [checked, setChecked] = React.useState(false);
      return <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="Test checkbox" />;
    };

    render(<ControlledCheckbox />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(checkboxElement);
    expect(checkboxElement).toHaveAttribute("data-state", "checked");

    fireEvent.click(checkboxElement);
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");
  });
});

describe("Checkbox - Custom Styling", () => {
  it("should apply custom className", () => {
    render(<Checkbox className="custom-class" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("custom-class");
  });

  it("should merge custom className with size styles", () => {
    render(<Checkbox size="sm" className="custom-class" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("custom-class");
    expect(checkboxElement).toHaveClass("h-4");
  });

  it("should apply custom indicatorClassName to indicator element", () => {
    render(<Checkbox checked indicatorClassName="custom-indicator" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toHaveClass("custom-indicator");
  });
});

describe("Checkbox - Base Styles", () => {
  it("should have shrink-0", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("shrink-0");
  });

  it("should have rounded corners", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("rounded");
  });

  it("should have transition styles", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("transition-all");
    expect(checkboxElement).toHaveClass("duration-200");
  });

  it("should have focus styles", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("focus:outline-none");
    expect(checkboxElement).toHaveClass("focus:ring-2");
    expect(checkboxElement).toHaveClass("focus:ring-border-focus");
  });

  it("should have border styles", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveClass("border-2");
    expect(checkboxElement).toHaveClass("border-white/20");
  });
});

describe("Checkbox - Accessibility", () => {
  it("should be keyboard accessible", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    checkboxElement.focus();

    expect(checkboxElement).toHaveFocus();
  });

  it("should have checkbox role", () => {
    render(<Checkbox aria-label="Test checkbox" />);

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("should support aria-label", () => {
    render(<Checkbox aria-label="Accept terms" />);

    const checkboxElement = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkboxElement).toHaveAttribute("aria-label", "Accept terms");
  });

  it("should support aria-labelledby", () => {
    render(
      <div>
        <label id="checkbox-label">Enable feature</label>
        <Checkbox aria-labelledby="checkbox-label" />
      </div>
    );

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("aria-labelledby", "checkbox-label");
  });

  it("should support aria-describedby", () => {
    render(<Checkbox aria-describedby="checkbox-description" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("aria-describedby", "checkbox-description");
  });

  it("should update aria-checked when state changes", () => {
    const ControlledCheckbox = () => {
      const [checked, setChecked] = React.useState(false);
      return <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="Test checkbox" />;
    };

    render(<ControlledCheckbox />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("aria-checked", "false");

    fireEvent.click(checkboxElement);
    expect(checkboxElement).toHaveAttribute("aria-checked", "true");
  });
});

describe("Checkbox - Ref Forwarding", () => {
  it("should forward ref to checkbox element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} aria-label="Test checkbox" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("should allow ref methods to be called", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} aria-label="Test checkbox" />);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });
});

describe("Checkbox - Additional Props", () => {
  it("should support data attributes", () => {
    render(<Checkbox data-testid="custom-checkbox" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByTestId("custom-checkbox");
    expect(checkboxElement).toBeInTheDocument();
  });

  it("should support id attribute", () => {
    render(<Checkbox id="unique-checkbox" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("id", "unique-checkbox");
  });

  it("should support value attribute", () => {
    render(<Checkbox value="on" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("value", "on");
  });

  it("should support title attribute", () => {
    render(<Checkbox title="Toggle feature" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("title", "Toggle feature");
  });
});

describe("Checkbox - Edge Cases", () => {
  it("should handle both checked and disabled states", () => {
    render(<Checkbox checked disabled aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toBeDisabled();
    expect(checkboxElement).toHaveAttribute("data-state", "checked");
  });

  it("should handle defaultChecked prop", () => {
    render(<Checkbox defaultChecked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "checked");
  });

  it("should allow uncontrolled usage", () => {
    const handleChange = vi.fn();
    render(<Checkbox defaultChecked={false} onCheckedChange={handleChange} aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(checkboxElement);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("should handle indeterminate state", () => {
    render(<Checkbox checked="indeterminate" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    expect(checkboxElement).toHaveAttribute("data-state", "indeterminate");
    expect(checkboxElement).toHaveAttribute("aria-checked", "mixed");
  });
});

describe("Checkbox - Display Name", () => {
  it("should have display name for debugging", () => {
    expect(Checkbox.displayName).toBe("Checkbox");
  });
});

describe("Checkbox - Indicator Element", () => {
  it("should render indicator element when checked", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toBeInTheDocument();
  });

  it("should have flex items-center justify-center on indicator", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toHaveClass("flex");
    expect(indicator).toHaveClass("items-center");
    expect(indicator).toHaveClass("justify-center");
  });

  it("should have text-white on indicator", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toHaveClass("text-white");
  });

  it("should have correct size for small indicator", () => {
    render(<Checkbox checked size="sm" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toHaveClass("h-4");
    expect(indicator).toHaveClass("w-4");
  });

  it("should have correct size for medium indicator", () => {
    render(<Checkbox checked size="md" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toHaveClass("h-5");
    expect(indicator).toHaveClass("w-5");
  });

  it("should have correct size for large indicator", () => {
    render(<Checkbox checked size="lg" aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const indicator = checkboxElement.querySelector('[data-state]');
    expect(indicator).toHaveClass("h-6");
    expect(indicator).toHaveClass("w-6");
  });

  it("should render SVG checkmark icon in indicator", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const svg = checkboxElement.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("should have polyline element for checkmark", () => {
    render(<Checkbox checked aria-label="Test checkbox" />);

    const checkboxElement = screen.getByRole("checkbox");
    const polyline = checkboxElement.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    expect(polyline).toHaveAttribute("points", "20 6 9 17 4 12");
  });
});
