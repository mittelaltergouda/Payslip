import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SinisterAccessTerminal, HINT_AFTER_ATTEMPTS } from './SinisterAccessTerminal';
import { ThemeSwitcher } from './ThemeSwitcher';

function setup() {
  const onUnlock = vi.fn();
  const onOpenChange = vi.fn();
  render(<SinisterAccessTerminal open lang="de" onOpenChange={onOpenChange} onUnlock={onUnlock} />);
  const input = screen.getByRole('textbox');
  const submit = (value: string) => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigen' }));
  };
  return { onUnlock, onOpenChange, input, submit };
}

describe('SinisterAccessTerminal', () => {
  it('denies a wrong code and shows the hint after a few attempts', async () => {
    const { submit, onUnlock } = setup();
    submit('SINISTER');
    expect(await screen.findByRole('alert')).toHaveTextContent('ZUGRIFF VERWEIGERT');
    expect(screen.queryByText(/Nur wer dazugehört/)).not.toBeInTheDocument();
    for (let i = 1; i < HINT_AFTER_ATTEMPTS; i++) {
      submit('falsch' + i);
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
    }
    expect(await screen.findByText('Nur wer dazugehört, kennt die Kennung.')).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it('grants access for S1NISTER and unlocks after the welcome', async () => {
    const { submit, onUnlock, onOpenChange } = setup();
    submit('s1nister');
    expect(await screen.findByText(/ZUGANG GEWÄHRT/)).toBeInTheDocument();
    await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('SinisterAccessTerminal when already unlocked', () => {
  it('offers to revoke the access instead of asking for the code', () => {
    const onLock = vi.fn();
    const onOpenChange = vi.fn();
    render(<SinisterAccessTerminal open lang="de" unlocked onOpenChange={onOpenChange} onUnlock={vi.fn()} onLock={onLock} />);
    expect(screen.getByRole('status')).toHaveTextContent('ZUGANG AKTIV');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zugang entfernen' }));
    expect(onLock).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('labels the revoke button in English', () => {
    render(<SinisterAccessTerminal open lang="en" unlocked onOpenChange={vi.fn()} onUnlock={vi.fn()} onLock={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Revoke access' })).toBeInTheDocument();
  });
});

describe('ThemeSwitcher', () => {
  it('offers Standard and Sinister as radio buttons', () => {
    const onThemeChange = vi.fn();
    render(<ThemeSwitcher theme="sinister" onThemeChange={onThemeChange} label="Design" defaultLabel="Standard" />);
    expect(screen.getByRole('radiogroup', { name: 'Design' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sinister' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Standard' }));
    expect(onThemeChange).toHaveBeenCalledWith('default');
  });
});
