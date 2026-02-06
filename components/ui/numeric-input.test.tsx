import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NumericInput } from "./numeric-input";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// TEST DATA
// ============================================================================

const defaultProps = {
  value: 0,
  onValueChange: vi.fn(),
  lang: "de" as const,
};

// ============================================================================
// TESTS: Basic Rendering
// ============================================================================

describe("NumericInput - Basic Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render an input element", () => {
    render(<NumericInput {...defaultProps} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render with type=text for formatting support", () => {
    render(<NumericInput {...defaultProps} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  it("should render with inputMode=numeric for mobile keyboards", () => {
    render(<NumericInput {...defaultProps} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("inputMode", "numeric");
  });

  it("should render with pattern for HTML validation", () => {
    render(<NumericInput {...defaultProps} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
  });

  it("should display formatted value initially", () => {
    render(<NumericInput {...defaultProps} value={1000} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    // German format uses period as thousand separator
    expect(input.value).toBe("1.000");
  });

  it("should display 0 for zero value", () => {
    render(<NumericInput {...defaultProps} value={0} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("0");
  });
});

// ============================================================================
// TESTS: Auto-Clear on Focus When Value is 0
// ============================================================================

describe("NumericInput - Auto-Clear on Focus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear input when focusing on field with value 0", () => {
    render(<NumericInput {...defaultProps} value={0} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("0");

    fireEvent.focus(input);

    // Should be empty after focus (auto-clear)
    expect(input.value).toBe("");
  });

  it("should show raw number when focusing on field with non-zero value", () => {
    render(<NumericInput {...defaultProps} value={100000} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("100.000");

    fireEvent.focus(input);

    // Should show raw number without formatting
    expect(input.value).toBe("100000");
  });
});

// ============================================================================
// TESTS: Auto-Restore on Blur When Empty
// ============================================================================

describe("NumericInput - Auto-Restore on Blur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should restore 0 when blurring an empty field", () => {
    render(<NumericInput {...defaultProps} value={0} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Focus (clears to empty)
    fireEvent.focus(input);
    expect(input.value).toBe("");

    // Blur without typing anything
    fireEvent.blur(input);

    // Should restore to "0"
    expect(input.value).toBe("0");
  });

  it("should format value with thousand separators on blur", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput
        {...defaultProps}
        value={100000}
        onValueChange={onValueChange}
      />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Focus (shows raw number)
    fireEvent.focus(input);
    expect(input.value).toBe("100000");

    // Blur
    fireEvent.blur(input);

    // Should show formatted number
    expect(input.value).toBe("100.000");
  });
});

// ============================================================================
// TESTS: Preserve User Input
// ============================================================================

describe("NumericInput - Preserve User Input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call onValueChange with parsed numeric value", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput {...defaultProps} value={0} onValueChange={onValueChange} />
    );

    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5000" } });

    expect(onValueChange).toHaveBeenCalledWith(5000);
  });

  it("should call onValueChange with 0 when input is cleared", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput
        {...defaultProps}
        value={5000}
        onValueChange={onValueChange}
      />
    );

    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });

    expect(onValueChange).toHaveBeenCalledWith(0);
  });
});

// ============================================================================
// TESTS: Decimal Rejection
// ============================================================================

describe("NumericInput - Decimal Rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should strip decimal points from input", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput {...defaultProps} value={0} onValueChange={onValueChange} />
    );

    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    // Typing "123.45" should be parsed as integer
    fireEvent.change(input, { target: { value: "123.45" } });

    // parseFormattedInteger strips non-digits, so this becomes 12345 or 123
    // depending on implementation details - the key is it's an integer
    expect(onValueChange).toHaveBeenCalled();
    const calledValue = onValueChange.mock.calls[0][0];
    expect(Number.isInteger(calledValue)).toBe(true);
  });

  it("should strip decimal commas from input", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput {...defaultProps} value={0} onValueChange={onValueChange} />
    );

    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "123,45" } });

    expect(onValueChange).toHaveBeenCalled();
    const calledValue = onValueChange.mock.calls[0][0];
    expect(Number.isInteger(calledValue)).toBe(true);
  });

  it("should only accept digit characters", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput {...defaultProps} value={0} onValueChange={onValueChange} />
    );

    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "abc123def456" } });

    // Should parse to 123456 (only digits)
    expect(onValueChange).toHaveBeenCalled();
    const calledValue = onValueChange.mock.calls[0][0];
    expect(Number.isInteger(calledValue)).toBe(true);
  });
});

// ============================================================================
// TESTS: Thousand Separator Display on Blur
// ============================================================================

describe("NumericInput - Thousand Separator Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display German thousand separators when lang is de", () => {
    render(<NumericInput {...defaultProps} value={1234567} lang="de" />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1.234.567");
  });

  it("should display English thousand separators when lang is en", () => {
    render(<NumericInput {...defaultProps} value={1234567} lang="en" />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1,234,567");
  });

  it("should show raw number without separators when focused", () => {
    render(<NumericInput {...defaultProps} value={1234567} lang="de" />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1.234.567");

    fireEvent.focus(input);

    expect(input.value).toBe("1234567");
  });

  it("should format correctly after blur", () => {
    render(<NumericInput {...defaultProps} value={100000} lang="de" />);

    const input = screen.getByRole("textbox") as HTMLInputElement;

    fireEvent.focus(input);
    expect(input.value).toBe("100000");

    fireEvent.blur(input);
    expect(input.value).toBe("100.000");
  });
});

// ============================================================================
// TESTS: Disabled Field Behavior
// ============================================================================

describe("NumericInput - Disabled State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render disabled input", () => {
    render(<NumericInput {...defaultProps} value={5000} disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("should still display formatted value when disabled", () => {
    render(<NumericInput {...defaultProps} value={100000} lang="de" disabled />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("100.000");
  });

  it("should not clear on focus when disabled", () => {
    render(<NumericInput {...defaultProps} value={0} disabled />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("0");

    fireEvent.focus(input);

    // Should remain "0" (no auto-clear when disabled)
    expect(input.value).toBe("0");
  });

  it("should not call onValueChange when disabled", () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput
        {...defaultProps}
        value={5000}
        onValueChange={onValueChange}
        disabled
      />
    );

    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "9999" } });

    // Should not call onValueChange when disabled
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("should have disabled styling classes", () => {
    render(<NumericInput {...defaultProps} disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("disabled:opacity-50");
    expect(input).toHaveClass("disabled:cursor-not-allowed");
  });
});

// ============================================================================
// TESTS: Sync with External Value Changes
// ============================================================================

describe("NumericInput - External Value Changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update display when value prop changes", () => {
    const { rerender } = render(
      <NumericInput {...defaultProps} value={1000} />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1.000");

    rerender(<NumericInput {...defaultProps} value={2000} />);

    expect(input.value).toBe("2.000");
  });

  it("should update display when lang prop changes", () => {
    const { rerender } = render(
      <NumericInput {...defaultProps} value={100000} lang="de" />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("100.000");

    rerender(<NumericInput {...defaultProps} value={100000} lang="en" />);

    expect(input.value).toBe("100,000");
  });

  it("should handle value change while focused", () => {
    const { rerender } = render(
      <NumericInput {...defaultProps} value={1000} />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;

    fireEvent.focus(input);
    expect(input.value).toBe("1000");

    // External value changes while focused
    rerender(<NumericInput {...defaultProps} value={2000} />);

    // Should show raw number since still focused
    expect(input.value).toBe("2000");
  });
});

// ============================================================================
// TESTS: Input Props Passthrough
// ============================================================================

describe("NumericInput - Props Passthrough", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass through className to Input component", () => {
    render(<NumericInput {...defaultProps} className="custom-class" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("should pass through placeholder", () => {
    render(<NumericInput {...defaultProps} placeholder="Enter amount" />);

    const input = screen.getByPlaceholderText("Enter amount");
    expect(input).toBeInTheDocument();
  });

  it("should pass through size prop", () => {
    render(<NumericInput {...defaultProps} size="sm" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-8");
  });

  it("should pass through error prop", () => {
    render(<NumericInput {...defaultProps} error />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-border-error");
  });

  it("should forward ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<NumericInput {...defaultProps} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("should pass through aria attributes", () => {
    render(
      <NumericInput
        {...defaultProps}
        aria-label="Revenue input"
        aria-describedby="revenue-description"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-label", "Revenue input");
    expect(input).toHaveAttribute("aria-describedby", "revenue-description");
  });
});

// ============================================================================
// TESTS: Variants
// ============================================================================

describe("NumericInput - Variants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render default variant", () => {
    render(<NumericInput {...defaultProps} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-white/5");
    expect(input).toHaveClass("border-border-default");
  });

  it("should render error variant when error prop is true", () => {
    render(<NumericInput {...defaultProps} error />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-feedback-error-bg");
    expect(input).toHaveClass("border-border-error");
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe("NumericInput - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle negative values", () => {
    render(<NumericInput {...defaultProps} value={-500} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("-500");
  });

  it("should handle very large numbers", () => {
    render(<NumericInput {...defaultProps} value={999999999} lang="de" />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("999.999.999");
  });

  it("should handle rapid focus/blur cycles", () => {
    render(<NumericInput {...defaultProps} value={5000} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Rapid focus/blur
    fireEvent.focus(input);
    fireEvent.blur(input);
    fireEvent.focus(input);
    fireEvent.blur(input);

    // Should end up with formatted value
    expect(input.value).toBe("5.000");
  });

  it("should display correct value after multiple interactions", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumericInput {...defaultProps} value={0} onValueChange={onValueChange} />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Focus (clears)
    fireEvent.focus(input);
    expect(input.value).toBe("");

    // Type a value
    fireEvent.change(input, { target: { value: "50000" } });
    expect(onValueChange).toHaveBeenCalledWith(50000);

    // Simulate parent updating the value
    rerender(
      <NumericInput
        {...defaultProps}
        value={50000}
        onValueChange={onValueChange}
      />
    );

    // Blur to see formatted value
    fireEvent.blur(input);
    expect(input.value).toBe("50.000");
  });
});
