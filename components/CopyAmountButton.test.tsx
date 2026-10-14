import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CopyAmountButton } from './CopyAmountButton';
import { TransfersList } from './TransfersList';
import { translations } from '@/lib/i18n/translations';

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
});

describe('CopyAmountButton', () => {
  it('copies the amount as plain digits without separators', async () => {
    const writeText = mockClipboard();
    render(<CopyAmountButton amount={262_687} label="Amount kopieren" copiedLabel="Kopiert" />);
    fireEvent.click(screen.getByRole('button', { name: 'Amount kopieren' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('262687'));
    expect(await screen.findByText('✓ Kopiert')).toBeInTheDocument();
  });

  it('shows the copy icon again after a moment', async () => {
    vi.useFakeTimers();
    mockClipboard();
    render(<CopyAmountButton amount={500} label="Copy" copiedLabel="Copied" />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy' })); });
    expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1600); });
    expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();
  });

  it('falls back to the legacy copy command without the Clipboard API', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    render(<CopyAmountButton amount={1_000} label="Copy" copiedLabel="Copied" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    expect(await screen.findByText('✓ Copied')).toBeInTheDocument();
  });

  it('does not claim success when copying fails', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(false), configurable: true });
    render(<CopyAmountButton amount={1_000} label="Copy" copiedLabel="Copied" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(document.execCommand).toHaveBeenCalled());
    expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();
  });
});

describe('TransfersList copy buttons', () => {
  it('offers one copy button per suggested transfer with the in-game amount', async () => {
    const writeText = mockClipboard();
    render(
      <TransfersList
        transfers={[
          { fromMemberId: 'a', toMemberId: 'b', netAmount: 262_687, feeAmount: 1_314, grossAmount: 264_001 },
          { fromMemberId: 'a', toMemberId: 'c', netAmount: 1_000, feeAmount: 5, grossAmount: 1_005 },
        ]}
        members={[{ id: 'a', handle: 'Player 1' }, { id: 'b', handle: 'Player 2' }, { id: 'c', handle: 'Player 3' }]}
        translations={translations.de}
        lang="de"
      />
    );
    expect(screen.getByText('262.687 aUEC')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Amount kopieren Player 1 → Player 2' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('262687'));
    fireEvent.click(screen.getByRole('button', { name: 'Amount kopieren Player 1 → Player 3' }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith('1000'));
  });
});
