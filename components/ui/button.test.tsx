import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "./button";
import { describe, it, expect, vi } from "vitest";

describe("Button - Basic Rendering", () => {
  it("should render a button with text", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should render with default type attribute", () => {
    render(<Button>Submit</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("should render with custom type attribute", () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should render children correctly", () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );

    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});

describe("Button - Variants", () => {
  it("should render primary variant by default", () => {
    render(<Button>Primary</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-interaction-primary");
    expect(button).toHaveClass("text-text-inverse");
  });

  it("should render primary variant when explicitly specified", () => {
    render(<Button variant="primary">Primary</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-interaction-primary");
    expect(button).toHaveClass("hover:bg-interaction-primary-hover");
  });

  it("should render secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-interaction-secondary");
    expect(button).toHaveClass("hover:bg-interaction-secondary-hover");
  });

  it("should render ghost variant with glassmorphism", () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white/5");
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("border-white/10");
    expect(button).toHaveClass("backdrop-blur-md");
  });

  it("should render danger variant", () => {
    render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-feedback-error");
    expect(button).toHaveClass("text-white");
    expect(button).toHaveClass("hover:bg-feedback-error/90");
  });

  it("should render success variant", () => {
    render(<Button variant="success">Save</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-feedback-success");
    expect(button).toHaveClass("text-white");
    expect(button).toHaveClass("hover:bg-feedback-success/90");
  });
});

describe("Button - Sizes", () => {
  it("should render medium size by default", () => {
    render(<Button>Medium</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("text-sm");
  });

  it("should render small size", () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-8");
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("text-xs");
  });

  it("should render medium size when explicitly specified", () => {
    render(<Button size="md">Medium</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("text-sm");
  });

  it("should render large size", () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-12");
    expect(button).toHaveClass("px-6");
    expect(button).toHaveClass("text-base");
  });
});

describe("Button - Variant and Size Combinations", () => {
  it("should combine primary variant with small size", () => {
    render(
      <Button variant="primary" size="sm">
        Primary Small
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-interaction-primary");
    expect(button).toHaveClass("h-8");
  });

  it("should combine secondary variant with large size", () => {
    render(
      <Button variant="secondary" size="lg">
        Secondary Large
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-interaction-secondary");
    expect(button).toHaveClass("h-12");
  });

  it("should combine ghost variant with medium size", () => {
    render(
      <Button variant="ghost" size="md">
        Ghost Medium
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white/5");
    expect(button).toHaveClass("h-10");
  });

  it("should combine danger variant with large size", () => {
    render(
      <Button variant="danger" size="lg">
        Danger Large
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-feedback-error");
    expect(button).toHaveClass("h-12");
  });

  it("should combine success variant with small size", () => {
    render(
      <Button variant="success" size="sm">
        Success Small
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-feedback-success");
    expect(button).toHaveClass("h-8");
  });
});

describe("Button - Disabled State", () => {
  it("should render disabled button", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
    expect(button).toHaveClass("disabled:cursor-not-allowed");
  });

  it("should not trigger onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should have pointer-events-none when disabled", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("disabled:pointer-events-none");
  });
});

describe("Button - Loading State", () => {
  it("should render loading spinner when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole("button");
    const spinner = button.querySelector("svg");

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("should be disabled when loading", () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should have aria-busy attribute when loading", () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("should not have aria-busy when not loading", () => {
    render(<Button isLoading={false}>Not Loading</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("should not trigger onClick when loading", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} isLoading>
        Loading
      </Button>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should hide spinner when not loading", () => {
    render(<Button isLoading={false}>Not Loading</Button>);

    const button = screen.getByRole("button");
    const spinner = button.querySelector("svg");

    expect(spinner).not.toBeInTheDocument();
  });

  it("should render text and spinner together", () => {
    render(<Button isLoading>Saving...</Button>);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });
});

describe("Button - Click Handling", () => {
  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick multiple times", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it("should pass event to onClick handler", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
  });
});

describe("Button - Custom Styling", () => {
  it("should apply custom className", () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("should merge custom className with variant styles", () => {
    render(
      <Button variant="primary" className="custom-class">
        Merged
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
    expect(button).toHaveClass("bg-interaction-primary");
  });

  it("should allow width customization via className", () => {
    render(<Button className="w-full">Full Width</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-full");
  });
});

describe("Button - Base Styles", () => {
  it("should have inline-flex display", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("inline-flex");
  });

  it("should have items-center alignment", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("items-center");
    expect(button).toHaveClass("justify-center");
  });

  it("should have gap for spacing children", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("gap-2");
  });

  it("should have rounded corners", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("rounded-lg");
  });

  it("should have transition styles", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("transition-all");
    expect(button).toHaveClass("duration-200");
  });

  it("should have focus styles", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("focus:outline-none");
    expect(button).toHaveClass("focus:ring-2");
    expect(button).toHaveClass("focus:ring-border-focus");
  });
});

describe("Button - Accessibility", () => {
  it("should be keyboard accessible", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Button</Button>);

    const button = screen.getByRole("button");
    button.focus();

    expect(button).toHaveFocus();
  });

  it("should have button role", () => {
    render(<Button>Button</Button>);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should support aria-label", () => {
    render(<Button aria-label="Close dialog">X</Button>);

    const button = screen.getByRole("button", { name: "Close dialog" });
    expect(button).toHaveAttribute("aria-label", "Close dialog");
  });

  it("should support aria-describedby", () => {
    render(<Button aria-describedby="button-description">Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-describedby", "button-description");
  });

  it("should support aria-disabled", () => {
    render(<Button aria-disabled="true">Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("should set aria-hidden on loading spinner", () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole("button");
    const spinner = button.querySelector("svg");

    expect(spinner).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Button - Ref Forwarding", () => {
  it("should forward ref to button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Button");
  });

  it("should allow ref methods to be called", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Button</Button>);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });
});

describe("Button - Additional Props", () => {
  it("should support data attributes", () => {
    render(<Button data-testid="custom-button">Button</Button>);

    const button = screen.getByTestId("custom-button");
    expect(button).toBeInTheDocument();
  });

  it("should support title attribute", () => {
    render(<Button title="Button tooltip">Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Button tooltip");
  });

  it("should support id attribute", () => {
    render(<Button id="unique-button">Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("id", "unique-button");
  });

  it("should support name attribute", () => {
    render(<Button name="submit-button">Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("name", "submit-button");
  });

  it("should support value attribute", () => {
    render(<Button value="button-value">Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("value", "button-value");
  });
});

describe("Button - Edge Cases", () => {
  it("should render without children", () => {
    render(<Button />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    // Button contains animation wrappers, but no text content
    expect(button.textContent).toBe("");
  });

  it("should handle both disabled and loading states", () => {
    render(
      <Button disabled isLoading>
        Button
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("should render with only an icon", () => {
    render(
      <Button>
        <svg data-testid="icon">
          <circle />
        </svg>
      </Button>
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("should handle empty string as children", () => {
    render(<Button />);

    const button = screen.getByRole("button");
    // Button contains animation wrappers, but no text content
    expect(button.textContent).toBe("");
  });

  it("should handle null as children", () => {
    render(<Button>{null}</Button>);

    const button = screen.getByRole("button");
    // Button contains animation wrappers, but no text content
    expect(button.textContent).toBe("");
  });

  it("should handle undefined as children", () => {
    render(<Button>{undefined}</Button>);

    const button = screen.getByRole("button");
    // Button contains animation wrappers, but no text content
    expect(button.textContent).toBe("");
  });
});

describe("Button - Display Name", () => {
  it("should have display name for debugging", () => {
    expect(Button.displayName).toBe("Button");
  });
});
