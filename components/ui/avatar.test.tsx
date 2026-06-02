import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Avatar } from "./avatar";
import { describe, it, expect } from "vitest";

describe("Avatar - Basic Rendering", () => {
  it("should render an avatar with initials", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent("P");
  });

  it("should render with aria-label", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("aria-label", "Avatar for Pilot");
  });

  it("should render initials with aria-hidden", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    const initialsSpan = avatar.querySelector("span");
    expect(initialsSpan).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Avatar - Initials Extraction", () => {
  it("should extract single letter from single word", () => {
    render(<Avatar name="Pilot" />);

    expect(screen.getByRole("img")).toHaveTextContent("P");
  });

  it("should extract two letters from two words", () => {
    render(<Avatar name="John Doe" />);

    expect(screen.getByRole("img")).toHaveTextContent("JD");
  });

  it("should extract two letters from three words", () => {
    render(<Avatar name="John Michael Doe" />);

    expect(screen.getByRole("img")).toHaveTextContent("JM");
  });

  it("should handle lowercase names", () => {
    render(<Avatar name="pilot" />);

    expect(screen.getByRole("img")).toHaveTextContent("P");
  });

  it("should handle mixed case names", () => {
    render(<Avatar name="jOhN dOe" />);

    expect(screen.getByRole("img")).toHaveTextContent("JD");
  });

  it("should handle names with extra whitespace", () => {
    render(<Avatar name="  Pilot  " />);

    expect(screen.getByRole("img")).toHaveTextContent("P");
  });

  it("should handle names with multiple spaces between words", () => {
    render(<Avatar name="John    Doe" />);

    expect(screen.getByRole("img")).toHaveTextContent("JD");
  });

  it("should show question mark for empty name", () => {
    render(<Avatar name="" />);

    expect(screen.getByRole("img")).toHaveTextContent("?");
  });

  it("should show question mark for whitespace-only name", () => {
    render(<Avatar name="   " />);

    expect(screen.getByRole("img")).toHaveTextContent("?");
  });
});

describe("Avatar - Size Variants", () => {
  it("should render medium size by default", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("h-10");
    expect(avatar).toHaveClass("w-10");
    expect(avatar).toHaveClass("text-sm");
  });

  it("should render small size", () => {
    render(<Avatar name="Pilot" size="sm" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("h-8");
    expect(avatar).toHaveClass("w-8");
    expect(avatar).toHaveClass("text-xs");
  });

  it("should render medium size when explicitly specified", () => {
    render(<Avatar name="Pilot" size="md" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("h-10");
    expect(avatar).toHaveClass("w-10");
    expect(avatar).toHaveClass("text-sm");
  });

  it("should render large size", () => {
    render(<Avatar name="Pilot" size="lg" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("h-12");
    expect(avatar).toHaveClass("w-12");
    expect(avatar).toHaveClass("text-base");
  });
});

describe("Avatar - Base Styles", () => {
  it("should have circular shape", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("rounded-full");
  });

  it("should have glassmorphism effect", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("bg-white/5");
    expect(avatar).toHaveClass("border");
    expect(avatar).toHaveClass("border-white/10");
    expect(avatar).toHaveClass("backdrop-blur-md");
  });

  it("should have flex layout for centering", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("inline-flex");
    expect(avatar).toHaveClass("items-center");
    expect(avatar).toHaveClass("justify-center");
  });

  it("should have transition styles", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("transition-all");
    expect(avatar).toHaveClass("duration-200");
  });

  it("should have shadow", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("shadow-sm");
  });

  it("should have font styling", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("font-semibold");
    expect(avatar).toHaveClass("text-text-primary");
  });
});

describe("Avatar - Custom Styling", () => {
  it("should apply custom className", () => {
    render(<Avatar name="Pilot" className="custom-class" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("custom-class");
  });

  it("should merge custom className with variant styles", () => {
    render(<Avatar name="Pilot" size="sm" className="custom-class" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("custom-class");
    expect(avatar).toHaveClass("h-8");
  });

  it("should allow ring customization via className", () => {
    render(<Avatar name="Pilot" className="ring-2 ring-interaction-primary" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveClass("ring-2");
    expect(avatar).toHaveClass("ring-interaction-primary");
  });
});

describe("Avatar - Accessibility", () => {
  it("should have img role", () => {
    render(<Avatar name="Pilot" />);

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("should have descriptive aria-label", () => {
    render(<Avatar name="John Doe" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("aria-label", "Avatar for John Doe");
  });

  it("should hide initials text from screen readers", () => {
    render(<Avatar name="Pilot" />);

    const avatar = screen.getByRole("img");
    const initialsSpan = avatar.querySelector("span");
    expect(initialsSpan).toHaveAttribute("aria-hidden", "true");
  });

  it("should support additional aria attributes", () => {
    render(<Avatar name="Pilot" aria-describedby="avatar-description" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("aria-describedby", "avatar-description");
  });
});

describe("Avatar - Ref Forwarding", () => {
  it("should forward ref to div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Avatar name="Pilot" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toBe("P");
  });

  it("should allow ref methods to be called", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Avatar name="Pilot" ref={ref} />);

    const scrollHeight = ref.current?.scrollHeight;
    expect(typeof scrollHeight).toBe("number");
  });
});

describe("Avatar - Additional Props", () => {
  it("should support data attributes", () => {
    render(<Avatar name="Pilot" data-testid="custom-avatar" />);

    const avatar = screen.getByTestId("custom-avatar");
    expect(avatar).toBeInTheDocument();
  });

  it("should support title attribute", () => {
    render(<Avatar name="Pilot" title="Pilot avatar" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("title", "Pilot avatar");
  });

  it("should support id attribute", () => {
    render(<Avatar name="Pilot" id="unique-avatar" />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("id", "unique-avatar");
  });
});

describe("Avatar - Edge Cases", () => {
  it("should handle single character name", () => {
    render(<Avatar name="A" />);

    expect(screen.getByRole("img")).toHaveTextContent("A");
  });

  it("should handle names with numbers", () => {
    render(<Avatar name="Player1" />);

    expect(screen.getByRole("img")).toHaveTextContent("P");
  });

  it("should handle names starting with numbers", () => {
    render(<Avatar name="3rdPilot" />);

    expect(screen.getByRole("img")).toHaveTextContent("3");
  });

  it("should handle names with special characters", () => {
    render(<Avatar name="Dr. Smith" />);

    expect(screen.getByRole("img")).toHaveTextContent("DS");
  });

  it("should handle names with hyphens", () => {
    render(<Avatar name="Jean-Luc Picard" />);

    expect(screen.getByRole("img")).toHaveTextContent("JP");
  });

  it("should handle very long names", () => {
    render(<Avatar name="Extremely Long Username That Could Break Layout" />);

    expect(screen.getByRole("img")).toHaveTextContent("EL");
  });

  it("should handle unicode characters", () => {
    render(<Avatar name="José García" />);

    expect(screen.getByRole("img")).toHaveTextContent("JG");
  });
});

describe("Avatar - Display Name", () => {
  it("should have display name for debugging", () => {
    expect(Avatar.displayName).toBe("Avatar");
  });
});

describe("Avatar - Memoization", () => {
  it("should memoize initials calculation", () => {
    const { rerender } = render(<Avatar name="Pilot" />);
    const initialAvatar = screen.getByRole("img");
    const initialInitials = initialAvatar.textContent;

    // Re-render with same name
    rerender(<Avatar name="Pilot" />);
    const rerenderedAvatar = screen.getByRole("img");

    expect(rerenderedAvatar.textContent).toBe(initialInitials);
  });

  it("should recalculate initials when name changes", () => {
    const { rerender } = render(<Avatar name="Pilot" />);
    expect(screen.getByRole("img")).toHaveTextContent("P");

    rerender(<Avatar name="Escort" />);
    expect(screen.getByRole("img")).toHaveTextContent("E");
  });
});
