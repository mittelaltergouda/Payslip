import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "./input";
import { describe, it, expect, vi } from "vitest";

describe("Input - Basic Rendering", () => {
  it("should render an input element", () => {
    render(<Input />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render with default type attribute", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  it("should render with custom type attribute", () => {
    render(<Input type="email" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
  });

  it("should render number input", () => {
    render(<Input type="number" />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
  });

  it("should render password input", () => {
    render(<Input type="password" />);

    // Password inputs don't have a specific role, use getAllByRole or querySelector
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("should render with placeholder", () => {
    render(<Input placeholder="Enter your name" />);

    const input = screen.getByPlaceholderText("Enter your name");
    expect(input).toBeInTheDocument();
  });

  it("should render with value", () => {
    render(<Input value="Test value" onChange={() => {}} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Test value");
  });
});

describe("Input - Variants", () => {
  it("should render default variant by default", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-white/5");
    expect(input).toHaveClass("border-border-default");
    expect(input).toHaveClass("text-text-primary");
  });

  it("should render default variant when explicitly specified", () => {
    render(<Input variant="default" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-white/5");
    expect(input).toHaveClass("border-border-default");
    expect(input).toHaveClass("hover:border-border-hover");
    expect(input).toHaveClass("focus:border-border-focus");
  });

  it("should render error variant", () => {
    render(<Input variant="error" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-feedback-error-bg");
    expect(input).toHaveClass("border-border-error");
    expect(input).toHaveClass("focus:border-border-error");
    expect(input).toHaveClass("focus:ring-border-error");
  });

  it("should render error variant when error prop is true", () => {
    render(<Input error />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-feedback-error-bg");
    expect(input).toHaveClass("border-border-error");
  });

  it("should prioritize error prop over variant prop", () => {
    render(<Input variant="default" error />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-feedback-error-bg");
    expect(input).toHaveClass("border-border-error");
  });
});

describe("Input - Sizes", () => {
  it("should render medium size by default", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-10");
    expect(input).toHaveClass("px-4");
    expect(input).toHaveClass("text-sm");
  });

  it("should render small size", () => {
    render(<Input size="sm" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-8");
    expect(input).toHaveClass("px-3");
    expect(input).toHaveClass("text-xs");
  });

  it("should render medium size when explicitly specified", () => {
    render(<Input size="md" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-10");
    expect(input).toHaveClass("px-4");
    expect(input).toHaveClass("text-sm");
  });

  it("should render large size", () => {
    render(<Input size="lg" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-12");
    expect(input).toHaveClass("px-6");
    expect(input).toHaveClass("text-base");
  });
});

describe("Input - Variant and Size Combinations", () => {
  it("should combine default variant with small size", () => {
    render(<Input variant="default" size="sm" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-white/5");
    expect(input).toHaveClass("h-8");
  });

  it("should combine error variant with large size", () => {
    render(<Input variant="error" size="lg" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bg-feedback-error-bg");
    expect(input).toHaveClass("h-12");
  });

  it("should combine error prop with medium size", () => {
    render(<Input error size="md" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-border-error");
    expect(input).toHaveClass("h-10");
  });

  it("should combine error prop with small size", () => {
    render(<Input error size="sm" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-border-error");
    expect(input).toHaveClass("h-8");
  });
});

describe("Input - Disabled State", () => {
  it("should render disabled input", () => {
    render(<Input disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:opacity-50");
    expect(input).toHaveClass("disabled:cursor-not-allowed");
  });

  it("should not accept input when disabled", () => {
    render(<Input disabled value="initial" onChange={() => {}} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeDisabled();
    // In real browsers, disabled inputs cannot be changed
    // Testing library's fireEvent may still trigger the handler, but the input is disabled
    expect(input.value).toBe("initial");
  });

  it("should have reduced opacity when disabled", () => {
    render(<Input disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("disabled:opacity-50");
  });

  it("should have special background when disabled", () => {
    render(<Input disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("disabled:bg-white/[0.02]");
    expect(input).toHaveClass("disabled:border-white/5");
  });
});

describe("Input - Error State", () => {
  it("should have aria-invalid when error is true", () => {
    render(<Input error />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should not have aria-invalid when error is false", () => {
    render(<Input error={false} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("should set aria-describedby when error and errorId are provided", () => {
    render(<Input error errorId="error-message" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "error-message");
  });

  it("should not set aria-describedby when error is false", () => {
    render(<Input error={false} errorId="error-message" />);

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should preserve existing aria-describedby when no error", () => {
    render(<Input aria-describedby="help-text" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "help-text");
  });

  it("should override aria-describedby with errorId when error is true", () => {
    render(<Input error errorId="error-message" aria-describedby="help-text" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "error-message");
  });

  it("should not set aria-describedby when error is true but errorId is not provided", () => {
    render(<Input error aria-describedby="help-text" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "help-text");
  });
});

describe("Input - Change Handling", () => {
  it("should call onChange when value changes", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("should update value on change", () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState("");
      return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
    };

    render(<TestComponent />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });

    expect(input.value).toBe("test");
  });

  it("should pass event to onChange handler", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
    expect(handleChange.mock.calls[0][0].target.value).toBe("test");
  });

  it("should handle multiple changes", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });

    expect(handleChange).toHaveBeenCalledTimes(3);
  });
});

describe("Input - Focus Handling", () => {
  it("should call onFocus when focused", () => {
    const handleFocus = vi.fn();
    render(<Input onFocus={handleFocus} />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it("should call onBlur when blurred", () => {
    const handleBlur = vi.fn();
    render(<Input onBlur={handleBlur} />);

    const input = screen.getByRole("textbox");
    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("should be focusable", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    input.focus();

    expect(input).toHaveFocus();
  });

  it("should not be focusable when disabled", () => {
    render(<Input disabled />);

    const input = screen.getByRole("textbox");
    input.focus();

    expect(input).not.toHaveFocus();
  });
});

describe("Input - Custom Styling", () => {
  it("should apply custom className", () => {
    render(<Input className="custom-class" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("should merge custom className with variant styles", () => {
    render(<Input variant="default" className="custom-class" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
    expect(input).toHaveClass("bg-white/5");
  });

  it("should allow width customization via className", () => {
    render(<Input className="w-1/2" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("w-1/2");
  });

  it("should allow max-width customization via className", () => {
    render(<Input className="max-w-md" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("max-w-md");
  });
});

describe("Input - Base Styles", () => {
  it("should have inline-flex display", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("inline-flex");
  });

  it("should have full width by default", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("w-full");
  });

  it("should have rounded corners", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("rounded-lg");
  });

  it("should have border", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border");
  });

  it("should have transition styles", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("transition-all");
    expect(input).toHaveClass("duration-200");
  });

  it("should have focus styles", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("focus:outline-none");
    expect(input).toHaveClass("focus:ring-2");
    expect(input).toHaveClass("focus:ring-border-focus");
  });

  it("should have placeholder styles", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("placeholder:text-text-muted");
  });
});

describe("Input - Accessibility", () => {
  it("should be keyboard accessible", () => {
    render(<Input />);

    const input = screen.getByRole("textbox");
    input.focus();

    expect(input).toHaveFocus();
  });

  it("should have textbox role by default", () => {
    render(<Input />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should support aria-label", () => {
    render(<Input aria-label="Username" />);

    const input = screen.getByRole("textbox", { name: "Username" });
    expect(input).toHaveAttribute("aria-label", "Username");
  });

  it("should support aria-labelledby", () => {
    render(<Input aria-labelledby="input-label" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-labelledby", "input-label");
  });

  it("should support aria-required", () => {
    render(<Input aria-required="true" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("should support required attribute", () => {
    render(<Input required />);

    const input = screen.getByRole("textbox");
    expect(input).toBeRequired();
  });
});

describe("Input - Ref Forwarding", () => {
  it("should forward ref to input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("should allow ref methods to be called", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("should allow setting value via ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    if (ref.current) {
      ref.current.value = "test value";
      expect(ref.current.value).toBe("test value");
    }
  });
});

describe("Input - Additional Props", () => {
  it("should support data attributes", () => {
    render(<Input data-testid="custom-input" />);

    const input = screen.getByTestId("custom-input");
    expect(input).toBeInTheDocument();
  });

  it("should support title attribute", () => {
    render(<Input title="Input tooltip" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("title", "Input tooltip");
  });

  it("should support id attribute", () => {
    render(<Input id="unique-input" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "unique-input");
  });

  it("should support name attribute", () => {
    render(<Input name="username" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "username");
  });

  it("should support maxLength attribute", () => {
    render(<Input maxLength={10} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "10");
  });

  it("should support minLength attribute", () => {
    render(<Input minLength={3} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("minLength", "3");
  });

  it("should support pattern attribute", () => {
    render(<Input pattern="[0-9]*" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
  });

  it("should support readOnly attribute", () => {
    render(<Input readOnly />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readOnly");
  });

  it("should support autoComplete attribute", () => {
    render(<Input autoComplete="email" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("autoComplete", "email");
  });

  it("should support autoFocus attribute", () => {
    render(<Input autoFocus />);

    const input = screen.getByRole("textbox");
    // autoFocus is a boolean attribute that causes the element to be focused on mount
    expect(document.activeElement).toBe(input);
  });
});

describe("Input - Number Type Specific", () => {
  it("should support min attribute for number input", () => {
    render(<Input type="number" min={0} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "0");
  });

  it("should support max attribute for number input", () => {
    render(<Input type="number" max={100} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("max", "100");
  });

  it("should support step attribute for number input", () => {
    render(<Input type="number" step={0.01} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("step", "0.01");
  });
});

describe("Input - Edge Cases", () => {
  it("should handle empty string value", () => {
    render(<Input value="" onChange={() => {}} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("should handle zero as value for number input", () => {
    render(<Input type="number" value={0} onChange={() => {}} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("0");
  });

  it("should handle both error and disabled states", () => {
    render(<Input error disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-border-error");
  });

  it("should handle null value gracefully", () => {
    render(<Input value={null as any} onChange={() => {}} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("should handle undefined value gracefully", () => {
    render(<Input value={undefined} onChange={() => {}} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});

describe("Input - Display Name", () => {
  it("should have display name for debugging", () => {
    expect(Input.displayName).toBe("Input");
  });
});
