import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FormField } from "./form-field";
import { describe, it, expect, vi } from "vitest";

describe("FormField - Basic Rendering", () => {
  it("should render with label and input", () => {
    render(<FormField id="test-field" label="Test Label" />);

    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should associate label with input via htmlFor and id", () => {
    render(<FormField id="username" label="Username" />);

    const label = screen.getByText("Username");
    const input = screen.getByRole("textbox");

    expect(label).toHaveAttribute("for", "username");
    expect(input).toHaveAttribute("id", "username");
  });

  it("should render input with default text type", () => {
    render(<FormField id="test" label="Test" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  it("should render input with custom type", () => {
    render(
      <FormField
        id="email"
        label="Email"
        inputProps={{ type: "email" }}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
  });

  it("should render number input", () => {
    render(
      <FormField
        id="amount"
        label="Amount"
        inputProps={{ type: "number" }}
      />
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
  });
});

describe("FormField - Label", () => {
  it("should render label text", () => {
    render(<FormField id="test" label="My Label" />);

    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("should have correct label styling", () => {
    render(<FormField id="test" label="Label" />);

    const label = screen.getByText("Label");
    expect(label).toHaveClass("text-sm");
    expect(label).toHaveClass("font-medium");
    expect(label).toHaveClass("text-text-primary");
  });

  it("should apply custom label className", () => {
    render(
      <FormField
        id="test"
        label="Label"
        labelClassName="custom-label"
      />
    );

    const label = screen.getByText("Label");
    expect(label).toHaveClass("custom-label");
    expect(label).toHaveClass("text-sm"); // Should also keep base classes
  });

  it("should show required indicator when required is true", () => {
    render(<FormField id="test" label="Required Field" required />);

    const requiredIndicator = screen.getByText("*");
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass("text-feedback-error");
    expect(requiredIndicator).toHaveAttribute("aria-label", "required");
  });

  it("should not show required indicator when required is false", () => {
    render(<FormField id="test" label="Optional Field" required={false} />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });
});

describe("FormField - Hint", () => {
  it("should render hint text when provided", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="This is a helpful hint"
      />
    );

    expect(screen.getByText("This is a helpful hint")).toBeInTheDocument();
  });

  it("should not render hint when not provided", () => {
    const { container } = render(<FormField id="test" label="Label" />);

    // Check that no hint paragraph exists
    const hints = container.querySelectorAll('p[id$="-hint"]');
    expect(hints.length).toBe(0);
  });

  it("should have correct hint styling", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="Hint text"
      />
    );

    const hint = screen.getByText("Hint text");
    expect(hint).toHaveClass("text-xs");
    expect(hint).toHaveClass("text-text-muted");
  });

  it("should apply custom hint className", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="Hint"
        hintClassName="custom-hint"
      />
    );

    const hint = screen.getByText("Hint");
    expect(hint).toHaveClass("custom-hint");
    expect(hint).toHaveClass("text-xs"); // Should also keep base classes
  });

  it("should have correct hint ID for ARIA", () => {
    render(
      <FormField
        id="test-field"
        label="Label"
        hint="Hint"
      />
    );

    const hint = screen.getByText("Hint");
    expect(hint).toHaveAttribute("id", "test-field-hint");
  });
});

describe("FormField - Error", () => {
  it("should render error message when provided", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="This field is required"
      />
    );

    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("should not render error when not provided", () => {
    const { container } = render(<FormField id="test" label="Label" />);

    // Check that no error paragraph exists
    const errors = container.querySelectorAll('p[id$="-error"]');
    expect(errors.length).toBe(0);
  });

  it("should have correct error styling", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
      />
    );

    const error = screen.getByText("Error message");
    expect(error).toHaveClass("text-xs");
    expect(error).toHaveClass("font-medium");
    expect(error).toHaveClass("text-feedback-error");
  });

  it("should apply custom error className", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error"
        errorClassName="custom-error"
      />
    );

    const error = screen.getByText("Error");
    expect(error).toHaveClass("custom-error");
    expect(error).toHaveClass("text-xs"); // Should also keep base classes
  });

  it("should have correct error ID for ARIA", () => {
    render(
      <FormField
        id="test-field"
        label="Label"
        error="Error"
      />
    );

    const error = screen.getByText("Error");
    expect(error).toHaveAttribute("id", "test-field-error");
  });

  it("should have role alert for error", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
      />
    );

    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Error message");
  });

  it("should have aria-live polite for error", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
      />
    );

    const error = screen.getByText("Error message");
    expect(error).toHaveAttribute("aria-live", "polite");
  });

  it("should style input in error state", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-border-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});

describe("FormField - ARIA Attributes", () => {
  it("should set aria-required when required is true", () => {
    render(<FormField id="test" label="Label" required />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("should not set aria-required when required is false", () => {
    render(<FormField id="test" label="Label" required={false} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-required", "false");
  });

  it("should set aria-describedby to hint when only hint is provided", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="Hint text"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "test-hint");
  });

  it("should set aria-describedby to error when only error is provided", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "test-error");
  });

  it("should set aria-describedby to both hint and error when both provided", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="Hint text"
        error="Error message"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "test-hint test-error");
  });

  it("should not set aria-describedby when no hint or error", () => {
    render(<FormField id="test" label="Label" />);

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should set aria-invalid when error is present", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should not set aria-invalid when no error", () => {
    render(<FormField id="test" label="Label" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });
});

describe("FormField - Input Props", () => {
  it("should pass through input props", () => {
    render(
      <FormField
        id="test"
        label="Label"
        inputProps={{
          placeholder: "Enter text",
          disabled: true,
          maxLength: 10,
        }}
      />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("placeholder", "Enter text");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("maxLength", "10");
  });

  it("should pass through onChange handler", () => {
    const handleChange = vi.fn();
    render(
      <FormField
        id="test"
        label="Label"
        inputProps={{ onChange: handleChange }}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("should pass through onFocus and onBlur handlers", () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(
      <FormField
        id="test"
        label="Label"
        inputProps={{ onFocus: handleFocus, onBlur: handleBlur }}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("should pass through value prop", () => {
    render(
      <FormField
        id="test"
        label="Label"
        inputProps={{ value: "Test value", onChange: () => {} }}
      />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Test value");
  });

  it("should support input size prop", () => {
    render(
      <FormField
        id="test"
        label="Label"
        inputProps={{ size: "lg" }}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-12"); // lg size
  });

  it("should support number input props", () => {
    render(
      <FormField
        id="test"
        label="Label"
        inputProps={{
          type: "number",
          min: 0,
          max: 100,
          step: 0.01,
        }}
      />
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "0.01");
  });
});

describe("FormField - Combinations", () => {
  it("should render required field with hint", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="Hint text"
        required
      />
    );

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("Hint text")).toBeInTheDocument();
  });

  it("should render required field with error", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
        required
      />
    );

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("should render field with hint and error", () => {
    render(
      <FormField
        id="test"
        label="Label"
        hint="Hint text"
        error="Error message"
      />
    );

    expect(screen.getByText("Hint text")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("should render all features together", () => {
    render(
      <FormField
        id="test"
        label="Complete Field"
        hint="This is a hint"
        error="This is an error"
        required
        inputProps={{ placeholder: "Enter value" }}
      />
    );

    expect(screen.getByText("Complete Field")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("This is a hint")).toBeInTheDocument();
    expect(screen.getByText("This is an error")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });
});

describe("FormField - Custom Styling", () => {
  it("should apply custom className to wrapper", () => {
    const { container } = render(
      <FormField
        id="test"
        label="Label"
        className="custom-wrapper"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-wrapper");
    expect(wrapper).toHaveClass("flex"); // Should also keep base classes
  });

  it("should have correct wrapper layout", () => {
    const { container } = render(<FormField id="test" label="Label" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("flex-col");
    expect(wrapper).toHaveClass("gap-1.5");
  });
});

describe("FormField - Ref Forwarding", () => {
  it("should forward ref to input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FormField id="test" label="Label" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("should allow calling input methods via ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FormField id="test" label="Label" ref={ref} />);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("should allow setting value via ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FormField id="test" label="Label" ref={ref} />);

    if (ref.current) {
      ref.current.value = "test value";
      expect(ref.current.value).toBe("test value");
    }
  });
});

describe("FormField - Accessibility", () => {
  it("should be fully keyboard accessible", () => {
    render(<FormField id="test" label="Test Label" />);

    const input = screen.getByLabelText("Test Label");
    input.focus();

    expect(input).toHaveFocus();
  });

  it("should associate label with input for screen readers", () => {
    render(<FormField id="username" label="Username" />);

    const input = screen.getByLabelText("Username");
    expect(input).toBeInTheDocument();
  });

  it("should provide error feedback for screen readers", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="This field is invalid"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "test-error");

    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("This field is invalid");
  });

  it("should indicate required fields for screen readers", () => {
    render(<FormField id="test" label="Label" required />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-required", "true");

    const requiredIndicator = screen.getByText("*");
    expect(requiredIndicator).toHaveAttribute("aria-label", "required");
  });
});

describe("FormField - Display Name", () => {
  it("should have display name for debugging", () => {
    expect(FormField.displayName).toBe("FormField");
  });
});

describe("FormField - Edge Cases", () => {
  it("should handle empty string error", () => {
    const { container } = render(
      <FormField
        id="test"
        label="Label"
        error=""
      />
    );

    // Empty error should not render error element
    const errors = container.querySelectorAll('p[id$="-error"]');
    expect(errors.length).toBe(0);
  });

  it("should handle empty string hint", () => {
    const { container } = render(
      <FormField
        id="test"
        label="Label"
        hint=""
      />
    );

    // Empty hint should not render hint element
    const hints = container.querySelectorAll('p[id$="-hint"]');
    expect(hints.length).toBe(0);
  });

  it("should handle long error message", () => {
    const longError = "This is a very long error message that should still display correctly and not break the layout or cause any visual issues";
    render(
      <FormField
        id="test"
        label="Label"
        error={longError}
      />
    );

    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  it("should handle long hint text", () => {
    const longHint = "This is a very long hint that provides detailed instructions on how to fill out this field properly and what format is expected";
    render(
      <FormField
        id="test"
        label="Label"
        hint={longHint}
      />
    );

    expect(screen.getByText(longHint)).toBeInTheDocument();
  });

  it("should handle disabled input with error", () => {
    render(
      <FormField
        id="test"
        label="Label"
        error="Error message"
        inputProps={{ disabled: true }}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });
});
