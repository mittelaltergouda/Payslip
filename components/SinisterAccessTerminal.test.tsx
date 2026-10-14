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
