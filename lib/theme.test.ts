import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULT_THEME_PREFS,
  KONAMI_SEQUENCE,
  THEME_BOOT_SCRIPT,
  THEME_STORAGE_KEY,
  TITLE_TAPS_REQUIRED,
  TITLE_TAP_WINDOW_MS,
  advanceKonami,
  isAccessCode,
  normalizeAccessCode,
  parseThemePrefs,
  registerTitleTap,
  serializeThemePrefs,
} from './theme';

describe('access code', () => {
  it('accepts the org spectrum ID regardless of case and spaces', async () => {
    expect(await isAccessCode('S1NISTER')).toBe(true);
    expect(await isAccessCode('s1nister')).toBe(true);
    expect(await isAccessCode('  S1 NISTER ')).toBe(true);
  });

  it('rejects anything else', async () => {
    for (const wrong of ['', '   ', 'SINISTER', 'S1NISTERX', 'S1NISTE', 'sinister incorporated']) {
      expect(await isAccessCode(wrong)).toBe(false);
    }
  });

  it('normalises input to upper case without whitespace', () => {
    expect(normalizeAccessCode(' s1 nis\tter ')).toBe('S1NISTER');
  });
});

describe('stored theme preferences', () => {
  it('falls back to locked default for missing or broken data', () => {
    expect(parseThemePrefs(null)).toEqual(DEFAULT_THEME_PREFS);
    expect(parseThemePrefs('not json')).toEqual(DEFAULT_THEME_PREFS);
    expect(parseThemePrefs('{"unlocked":"yes","theme":"sinister"}')).toEqual(DEFAULT_THEME_PREFS);
    expect(parseThemePrefs('{"unlocked":true,"theme":"neon-pink"}')).toEqual(DEFAULT_THEME_PREFS);
  });

  it('never activates the Sinister theme without the unlock', () => {
    expect(parseThemePrefs('{"unlocked":false,"theme":"sinister"}')).toEqual(DEFAULT_THEME_PREFS);
  });

  it('round-trips unlocked preferences', () => {
    for (const prefs of [{ unlocked: true, theme: 'sinister' }, { unlocked: true, theme: 'default' }] as const) {
      expect(parseThemePrefs(serializeThemePrefs(prefs))).toEqual(prefs);
    }
  });
});

describe('Konami code', () => {
  const run = (keys: string[]) => keys.reduce((progress, key) => advanceKonami(progress, key), 0);

  it('completes on the full sequence, with upper or lower case letters', () => {
    expect(run([...KONAMI_SEQUENCE])).toBe(KONAMI_SEQUENCE.length);
    expect(run([...KONAMI_SEQUENCE.slice(0, 8), 'B', 'A'])).toBe(KONAMI_SEQUENCE.length);
  });

  it('resets on a wrong key and lets a new attempt start right away', () => {
    expect(run(['ArrowUp', 'ArrowUp', 'x'])).toBe(0);
    expect(run(['ArrowUp', 'ArrowDown', ...KONAMI_SEQUENCE])).toBe(KONAMI_SEQUENCE.length);
  });
});

describe('title taps', () => {
  it('opens after five taps inside the time window', () => {
    let taps: number[] = [];
    let open = false;
    for (let i = 0; i < TITLE_TAPS_REQUIRED; i++) {
      ({ taps, open } = registerTitleTap(taps, 1000 + i * 200));
    }
    expect(open).toBe(true);
    expect(taps).toEqual([]);
  });

  it('does not open on slow or too few taps', () => {
    let taps: number[] = [];
    let open = false;
    for (let i = 0; i < TITLE_TAPS_REQUIRED * 2; i++) {
      ({ taps, open } = registerTitleTap(taps, i * (TITLE_TAP_WINDOW_MS / 2)));
      expect(open).toBe(false);
    }
  });
});

describe('boot script', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  const boot = () => new Function(THEME_BOOT_SCRIPT)();

  it('applies a stored, unlocked Sinister theme before the app renders', () => {
    localStorage.setItem(THEME_STORAGE_KEY, serializeThemePrefs({ unlocked: true, theme: 'sinister' }));
    boot();
    expect(document.documentElement.dataset.theme).toBe('sinister');
  });

  it('leaves the default design for locked, default or broken preferences', () => {
    for (const raw of [null, 'garbage', '{"unlocked":false,"theme":"sinister"}', '{"unlocked":true,"theme":"default"}']) {
      localStorage.clear();
      if (raw) {localStorage.setItem(THEME_STORAGE_KEY, raw);}
      boot();
      expect(document.documentElement.dataset.theme).toBeUndefined();
    }
  });
});
