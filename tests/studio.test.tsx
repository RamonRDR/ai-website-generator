import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GeneratorStudio } from "../src/ui/GeneratorStudio";
import { generateDemo } from "../src/domain/demo";
import { validInput } from "./fixtures";

describe("studio components", () => {
  it("renders form controls and desktop/mobile preview toggles", async () => {
    render(<GeneratorStudio />);
    expect(screen.getByLabelText("Project / business name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute("aria-pressed", "true");
  });

  it("hydrates and works when localStorage read and write are blocked", async () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked by browser policy", "SecurityError");
    });
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked by browser policy", "SecurityError");
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ site: generateDemo(validInput), mode: "demo" }),
    })) as unknown as typeof fetch;
    try {
      render(<GeneratorStudio />);
      await waitFor(() => expect(read).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: "Generate website" }));
      await waitFor(() => expect(screen.getByLabelText("Heading")).toBeInTheDocument());
      await waitFor(() => expect(write).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: "Save version" }));
      expect(screen.getByText("Version saved to this browser.")).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
      read.mockRestore();
      write.mockRestore();
    }
  });

  it("generates, edits and saves a deterministic site", async () => {
    const originalFetch = globalThis.fetch;
    const mock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ site: generateDemo(validInput), mode: "demo" }),
    }));
    globalThis.fetch = mock as unknown as typeof fetch;
    try {
      render(<GeneratorStudio />);
      fireEvent.click(screen.getByRole("button", { name: "Generate website" }));
      await waitFor(() => expect(screen.getByTitle("Website preview")).toBeInTheDocument());
      expect(screen.getByLabelText("Heading")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Save version" }));
      expect(screen.getByText("Version saved to this browser.")).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
