import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Switch } from "./switch";
import { describe, it, expect, vi } from "vitest";

describe("Switch - Basic Rendering", () => {
  it("should render a switch", () => {
    render(<Switch aria-label="Test switch" />);

    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("should render unchecked by default", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    expect(switchElement).toHaveAttribute("aria-checked", "false");
  });

  it("should render checked when checked prop is true", () => {
    render(<Switch checked aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "checked");
    expect(switchElement).toHaveAttribute("aria-checked", "true");
  });

  it("should render unchecked when checked prop is false", () => {
    render(<Switch checked={false} aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    expect(switchElement).toHaveAttribute("aria-checked", "false");
  });
});

describe("Switch - Sizes", () => {
  it("should render medium size by default", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("h-6");
    expect(switchElement).toHaveClass("w-11");
  });

  it("should render small size", () => {
    render(<Switch size="sm" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("h-5");
    expect(switchElement).toHaveClass("w-9");
  });

  it("should render medium size when explicitly specified", () => {
    render(<Switch size="md" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("h-6");
    expect(switchElement).toHaveClass("w-11");
  });

  it("should render large size", () => {
    render(<Switch size="lg" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("h-7");
    expect(switchElement).toHaveClass("w-14");
  });
});

describe("Switch - Checked State Combinations", () => {
  it("should apply checked styles when checked", () => {
    render(<Switch checked aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "checked");
    expect(switchElement).toHaveClass("data-[state=checked]:bg-interaction-primary");
  });

  it("should apply unchecked styles when unchecked", () => {
    render(<Switch checked={false} aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    expect(switchElement).toHaveClass("data-[state=unchecked]:bg-white/10");
  });

  it("should combine checked state with small size", () => {
    render(<Switch checked size="sm" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "checked");
    expect(switchElement).toHaveClass("h-5");
  });

  it("should combine unchecked state with large size", () => {
    render(<Switch checked={false} size="lg" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    expect(switchElement).toHaveClass("h-7");
  });
});

describe("Switch - Disabled State", () => {
  it("should render disabled switch", () => {
    render(<Switch disabled aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
    expect(switchElement).toHaveClass("disabled:opacity-50");
    expect(switchElement).toHaveClass("disabled:cursor-not-allowed");
  });

  it("should not trigger onCheckedChange when disabled", () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} disabled aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("should have pointer-events-none when disabled", () => {
    render(<Switch disabled aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("disabled:pointer-events-none");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Switch disabled aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("disabled");
  });
});

describe("Switch - Click Handling", () => {
  it("should call onCheckedChange when clicked from unchecked to checked", () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("should call onCheckedChange when clicked from checked to unchecked", () => {
    const handleChange = vi.fn();
    render(<Switch checked onCheckedChange={handleChange} aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("should toggle multiple times", () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);
    fireEvent.click(switchElement);
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledTimes(3);
  });

  it("should work as controlled component", () => {
    const ControlledSwitch = () => {
      const [checked, setChecked] = React.useState(false);
      return <Switch checked={checked} onCheckedChange={setChecked} aria-label="Test switch" />;
    };

    render(<ControlledSwitch />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(switchElement);
    expect(switchElement).toHaveAttribute("data-state", "checked");

    fireEvent.click(switchElement);
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
  });
});

describe("Switch - Custom Styling", () => {
  it("should apply custom className", () => {
    render(<Switch className="custom-class" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("custom-class");
  });

  it("should merge custom className with size styles", () => {
    render(<Switch size="sm" className="custom-class" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("custom-class");
    expect(switchElement).toHaveClass("h-5");
  });

  it("should apply custom thumbClassName to thumb element", () => {
    render(<Switch thumbClassName="custom-thumb" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("custom-thumb");
  });
});

describe("Switch - Base Styles", () => {
  it("should have inline-flex display", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("inline-flex");
  });

  it("should have cursor-pointer", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("cursor-pointer");
  });

  it("should have rounded-full corners", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("rounded-full");
  });

  it("should have transition styles", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("transition-colors");
    expect(switchElement).toHaveClass("duration-200");
  });

  it("should have focus styles", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("focus:outline-none");
    expect(switchElement).toHaveClass("focus:ring-2");
    expect(switchElement).toHaveClass("focus:ring-border-focus");
  });

  it("should have border styles", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("border-2");
    expect(switchElement).toHaveClass("border-transparent");
  });
});

describe("Switch - Accessibility", () => {
  it("should be keyboard accessible", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    switchElement.focus();

    expect(switchElement).toHaveFocus();
  });

  it("should have switch role", () => {
    render(<Switch aria-label="Test switch" />);

    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("should support aria-label", () => {
    render(<Switch aria-label="Enable notifications" />);

    const switchElement = screen.getByRole("switch", { name: "Enable notifications" });
    expect(switchElement).toHaveAttribute("aria-label", "Enable notifications");
  });

  it("should support aria-labelledby", () => {
    render(
      <div>
        <label id="switch-label">Enable feature</label>
        <Switch aria-labelledby="switch-label" />
      </div>
    );

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("aria-labelledby", "switch-label");
  });

  it("should support aria-describedby", () => {
    render(<Switch aria-describedby="switch-description" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("aria-describedby", "switch-description");
  });

  it("should update aria-checked when state changes", () => {
    const ControlledSwitch = () => {
      const [checked, setChecked] = React.useState(false);
      return <Switch checked={checked} onCheckedChange={setChecked} aria-label="Test switch" />;
    };

    render(<ControlledSwitch />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("aria-checked", "false");

    fireEvent.click(switchElement);
    expect(switchElement).toHaveAttribute("aria-checked", "true");
  });
});

describe("Switch - Ref Forwarding", () => {
  it("should forward ref to switch element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label="Test switch" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("should allow ref methods to be called", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label="Test switch" />);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });
});

describe("Switch - Additional Props", () => {
  it("should support data attributes", () => {
    render(<Switch data-testid="custom-switch" aria-label="Test switch" />);

    const switchElement = screen.getByTestId("custom-switch");
    expect(switchElement).toBeInTheDocument();
  });

  it("should support id attribute", () => {
    render(<Switch id="unique-switch" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("id", "unique-switch");
  });

  it("should support value attribute", () => {
    render(<Switch value="on" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("value", "on");
  });

  it("should support title attribute", () => {
    render(<Switch title="Toggle feature" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("title", "Toggle feature");
  });
});

describe("Switch - Edge Cases", () => {
  it("should handle both checked and disabled states", () => {
    render(<Switch checked disabled aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
    expect(switchElement).toHaveAttribute("data-state", "checked");
  });

  it("should handle defaultChecked prop", () => {
    render(<Switch defaultChecked aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "checked");
  });

  it("should allow uncontrolled usage", () => {
    const handleChange = vi.fn();
    render(<Switch defaultChecked={false} onCheckedChange={handleChange} aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});

describe("Switch - Display Name", () => {
  it("should have display name for debugging", () => {
    expect(Switch.displayName).toBe("Switch");
  });
});

describe("Switch - Thumb Element", () => {
  it("should render thumb element", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toBeInTheDocument();
  });

  it("should have transition styles on thumb", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("transition-transform");
    expect(thumb).toHaveClass("duration-200");
  });

  it("should have rounded-full on thumb", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("rounded-full");
  });

  it("should have white background on thumb", () => {
    render(<Switch aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("bg-white");
  });

  it("should have correct size for small thumb", () => {
    render(<Switch size="sm" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("h-4");
    expect(thumb).toHaveClass("w-4");
  });

  it("should have correct size for medium thumb", () => {
    render(<Switch size="md" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("h-5");
    expect(thumb).toHaveClass("w-5");
  });

  it("should have correct size for large thumb", () => {
    render(<Switch size="lg" aria-label="Test switch" />);

    const switchElement = screen.getByRole("switch");
    const thumb = switchElement.querySelector('[data-state]');
    expect(thumb).toHaveClass("h-6");
    expect(thumb).toHaveClass("w-6");
  });
});
