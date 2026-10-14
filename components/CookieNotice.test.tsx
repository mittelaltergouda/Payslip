import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookieNotice } from "@/components/CookieNotice";

const acknowledgementKey = "sc-payslip-storage-notice-acknowledged";

describe("CookieNotice", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("explains local storage without claiming that cookies are used", async () => {
    render(<CookieNotice />);

    const notice = await screen.findByRole("region", { name: "Cookie-Hinweis" });
    expect(notice).toHaveTextContent("setzt keine Cookies");
    expect(notice).toHaveTextContent("ausschließlich lokal in deinem Browser");
    expect(notice).toHaveTextContent("Tracking findet nicht statt");
    expect(notice).not.toHaveTextContent("CSRF");
    expect(screen.getByRole("link", { name: "Datenschutz" })).toHaveAttribute("href", "/datenschutz");
    expect(screen.getByRole("button", { name: "Verstanden" })).toBeInTheDocument();
  });

  it("closes after acknowledgement and remembers it for the browser tab", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<CookieNotice />);

    fireEvent.click(await screen.findByRole("button", { name: "Verstanden" }));

    expect(screen.queryByRole("region", { name: "Cookie-Hinweis" })).not.toBeInTheDocument();
    expect(setItem).toHaveBeenCalledWith(acknowledgementKey, "true");
  });

  it("stays hidden when it was already acknowledged in the browser tab", async () => {
    window.sessionStorage.setItem(acknowledgementKey, "true");
    const getItem = vi.spyOn(Storage.prototype, "getItem");

    render(<CookieNotice />);

    await waitFor(() => expect(getItem).toHaveBeenCalledWith(acknowledgementKey));
    expect(screen.queryByRole("region", { name: "Cookie-Hinweis" })).not.toBeInTheDocument();
  });
});
