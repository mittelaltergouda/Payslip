import { useEffect, type RefObject } from "react";

export function useColumnEnterNavigation(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const column = target.dataset.navCol;
      const rowValue = target.dataset.navRow;
      if (!column || rowValue === undefined) {
        return;
      }

      const currentRow = Number(rowValue);
      if (Number.isNaN(currentRow)) {
        return;
      }

      const nextRow = currentRow + 1;
      const selector = `input[data-nav-col="${column}"][data-nav-row="${nextRow}"]`;
      const nextInput = container.querySelector<HTMLInputElement>(selector);

      if (nextInput) {
        event.preventDefault();
        nextInput.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef]);
}
