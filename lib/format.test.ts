import { format, formatCurrency, formatPercent, formatCompact, formatCurrencyCompact, formatInteger, parseFormattedInteger } from './format';

// Test cases for format() - Basic number formatting with thousand separators

describe('format', () => {
  it('should format numbers with English thousand separators', () => {
    expect(format(1234567, 'en')).toBe('1,234,567');
    expect(format(1000, 'en')).toBe('1,000');
    expect(format(999, 'en')).toBe('999');
  });

  it('should format numbers with German thousand separators', () => {
    expect(format(1234567, 'de')).toBe('1.234.567');
    expect(format(1000, 'de')).toBe('1.000');
    expect(format(999, 'de')).toBe('999');
  });

  it('should round decimal numbers to nearest integer before formatting', () => {
    expect(format(42.7, 'en')).toBe('43');
    expect(format(42.4, 'en')).toBe('42');
    expect(format(42.5, 'en')).toBe('43');
    expect(format(1234.6, 'de')).toBe('1.235');
  });

  it('should handle zero', () => {
    expect(format(0, 'en')).toBe('0');
    expect(format(0, 'de')).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(format(-1234567, 'en')).toBe('-1,234,567');
    expect(format(-1234567, 'de')).toBe('-1.234.567');
    expect(format(-42.7, 'en')).toBe('-43');
  });

  it('should handle very large numbers', () => {
    expect(format(999999999, 'en')).toBe('999,999,999');
    expect(format(1000000000, 'en')).toBe('1,000,000,000');
  });
});

// Test cases for formatCurrency() - Currency formatting with symbols

describe('formatCurrency', () => {
  describe('aUEC (Star Citizen currency)', () => {
    it('should format aUEC with English thousand separators', () => {
      expect(formatCurrency(1234567, 'aUEC', 'en')).toBe('1,234,567 aUEC');
      expect(formatCurrency(1000, 'aUEC', 'en')).toBe('1,000 aUEC');
    });

    it('should format aUEC with German thousand separators', () => {
      expect(formatCurrency(1234567, 'aUEC', 'de')).toBe('1.234.567 aUEC');
      expect(formatCurrency(1000, 'aUEC', 'de')).toBe('1.000 aUEC');
    });

    it('should round aUEC amounts to nearest integer', () => {
      expect(formatCurrency(1234.56, 'aUEC', 'en')).toBe('1,235 aUEC');
      expect(formatCurrency(1234.4, 'aUEC', 'en')).toBe('1,234 aUEC');
    });

    it('should handle zero and negative aUEC amounts', () => {
      expect(formatCurrency(0, 'aUEC', 'en')).toBe('0 aUEC');
      expect(formatCurrency(-500, 'aUEC', 'en')).toBe('-500 aUEC');
    });
  });

  describe('USD (US Dollar)', () => {
    it('should format USD with proper symbol and decimals in English', () => {
      expect(formatCurrency(1234.56, 'USD', 'en')).toBe('$1,234.56');
      expect(formatCurrency(1000, 'USD', 'en')).toBe('$1,000.00');
    });

    it('should format USD in German locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'de');
      // German locale formats USD as "1.234,56 $"
      expect(result).toContain('1.234,56');
      expect(result).toContain('$');
    });

    it('should handle zero and negative USD amounts', () => {
      expect(formatCurrency(0, 'USD', 'en')).toBe('$0.00');
      const negative = formatCurrency(-100.50, 'USD', 'en');
      expect(negative).toContain('100.50');
    });
  });

  describe('EUR (Euro)', () => {
    it('should format EUR with proper symbol and decimals in English', () => {
      const result = formatCurrency(1234.56, 'EUR', 'en');
      expect(result).toContain('1,234.56');
      expect(result).toContain('€');
    });

    it('should format EUR in German locale', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de');
      // German locale formats EUR as "1.234,56 €"
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });
  });

  describe('GBP (British Pound)', () => {
    it('should format GBP with proper symbol and decimals in English', () => {
      expect(formatCurrency(1234.56, 'GBP', 'en')).toBe('£1,234.56');
    });

    it('should format GBP in German locale', () => {
      const result = formatCurrency(1234.56, 'GBP', 'de');
      expect(result).toContain('1.234,56');
      expect(result).toContain('£');
    });
  });
});

// Test cases for formatPercent() - Percentage formatting

describe('formatPercent', () => {
  describe('decimal input (0-1 range)', () => {
    it('should convert decimal to percentage with default 2 decimals', () => {
      expect(formatPercent(0.05)).toBe('5.00%');
      expect(formatPercent(0.1575)).toBe('15.75%');
      expect(formatPercent(0.3333)).toBe('33.33%');
    });

    it('should convert decimal to percentage with custom decimal places', () => {
      expect(formatPercent(0.05, 0)).toBe('5%');
      expect(formatPercent(0.3333, 1)).toBe('33.3%');
      expect(formatPercent(0.125, 3)).toBe('12.500%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0.00%');
      expect(formatPercent(0, 0)).toBe('0%');
    });

    it('should handle negative decimals', () => {
      expect(formatPercent(-0.05)).toBe('-5.00%');
      expect(formatPercent(-0.15, 1)).toBe('-15.0%');
    });
  });

  describe('percentage input (already > 1)', () => {
    it('should format already-percentage values with default 2 decimals', () => {
      expect(formatPercent(15.75)).toBe('15.75%');
      expect(formatPercent(100)).toBe('100.00%');
    });

    it('should format already-percentage values with custom decimals', () => {
      expect(formatPercent(100, 0)).toBe('100%');
      expect(formatPercent(15.755, 1)).toBe('15.8%');
    });

    it('should handle negative percentage values', () => {
      expect(formatPercent(-10)).toBe('-10.00%');
      expect(formatPercent(-5.5, 1)).toBe('-5.5%');
    });
  });

  describe('boundary cases', () => {
    it('should handle boundary value of 1', () => {
      // Value of exactly 1 is treated as already a percentage (not 100%)
      expect(formatPercent(1)).toBe('1.00%');
    });

    it('should handle boundary value of -1', () => {
      // Value of exactly -1 is treated as already a percentage
      expect(formatPercent(-1)).toBe('-1.00%');
    });

    it('should distinguish between 0.99 and 1.01', () => {
      expect(formatPercent(0.99)).toBe('99.00%'); // Decimal, converted
      expect(formatPercent(1.01)).toBe('1.01%');  // Already percentage
    });
  });
});

// Test cases for formatCompact() - Compact notation with K, M, B suffixes

describe('formatCompact', () => {
  describe('values below 1000', () => {
    it('should display small numbers without suffix', () => {
      expect(formatCompact(0, 'en')).toBe('0');
      expect(formatCompact(42, 'en')).toBe('42');
      expect(formatCompact(500, 'en')).toBe('500');
      expect(formatCompact(999, 'en')).toBe('999');
    });

    it('should round decimals for small numbers', () => {
      expect(formatCompact(42.7, 'en')).toBe('43');
      expect(formatCompact(999.4, 'en')).toBe('999');
    });

    it('should handle small negative numbers', () => {
      expect(formatCompact(-42, 'en')).toBe('-42');
      expect(formatCompact(-999, 'en')).toBe('-999');
    });
  });

  describe('thousands (K)', () => {
    it('should format thousands with k suffix in English', () => {
      expect(formatCompact(1000, 'en')).toBe('1.0k');
      expect(formatCompact(1500, 'en')).toBe('1.5k');
      expect(formatCompact(15000, 'en')).toBe('15.0k');
      expect(formatCompact(999999, 'en')).toBe('1000.0k');
    });

    it('should format thousands with k suffix in German', () => {
      expect(formatCompact(1000, 'de')).toBe('1,0k');
      expect(formatCompact(1500, 'de')).toBe('1,5k');
      expect(formatCompact(15000, 'de')).toBe('15,0k');
    });

    it('should handle negative thousands', () => {
      expect(formatCompact(-1500, 'en')).toBe('-1.5k');
      expect(formatCompact(-1500, 'de')).toBe('-1,5k');
    });
  });

  describe('millions (M)', () => {
    it('should format millions with M suffix in English', () => {
      expect(formatCompact(1000000, 'en')).toBe('1.0M');
      expect(formatCompact(1234567, 'en')).toBe('1.2M');
      expect(formatCompact(15000000, 'en')).toBe('15.0M');
      expect(formatCompact(999999999, 'en')).toBe('1000.0M');
    });

    it('should format millions with M suffix in German', () => {
      expect(formatCompact(1000000, 'de')).toBe('1,0M');
      expect(formatCompact(1234567, 'de')).toBe('1,2M');
      expect(formatCompact(15000000, 'de')).toBe('15,0M');
    });

    it('should handle negative millions', () => {
      expect(formatCompact(-1234567, 'en')).toBe('-1.2M');
      expect(formatCompact(-1234567, 'de')).toBe('-1,2M');
    });
  });

  describe('billions (B)', () => {
    it('should format billions with B suffix in English', () => {
      expect(formatCompact(1000000000, 'en')).toBe('1.0B');
      expect(formatCompact(1234567890, 'en')).toBe('1.2B');
      expect(formatCompact(15000000000, 'en')).toBe('15.0B');
    });

    it('should format billions with B suffix in German', () => {
      expect(formatCompact(1000000000, 'de')).toBe('1,0B');
      expect(formatCompact(1234567890, 'de')).toBe('1,2B');
      expect(formatCompact(15000000000, 'de')).toBe('15,0B');
    });

    it('should handle negative billions', () => {
      expect(formatCompact(-1234567890, 'en')).toBe('-1.2B');
      expect(formatCompact(-1234567890, 'de')).toBe('-1,2B');
    });
  });

  describe('boundary values', () => {
    it('should handle transition from no suffix to k', () => {
      expect(formatCompact(999, 'en')).toBe('999');
      expect(formatCompact(1000, 'en')).toBe('1.0k');
    });

    it('should handle transition from k to M', () => {
      expect(formatCompact(999999, 'en')).toBe('1000.0k');
      expect(formatCompact(1000000, 'en')).toBe('1.0M');
    });

    it('should handle transition from M to B', () => {
      expect(formatCompact(999999999, 'en')).toBe('1000.0M');
      expect(formatCompact(1000000000, 'en')).toBe('1.0B');
    });
  });

  describe('rounding behavior', () => {
    it('should round to one decimal place for compact values', () => {
      expect(formatCompact(1549, 'en')).toBe('1.5k');  // 1.549k rounds to 1.5k
      expect(formatCompact(1551, 'en')).toBe('1.6k');  // 1.551k rounds to 1.6k
      expect(formatCompact(1234567, 'en')).toBe('1.2M'); // 1.234M rounds to 1.2M
      expect(formatCompact(1254567, 'en')).toBe('1.3M'); // 1.254M rounds to 1.3M
    });
  });
});

// Test cases for formatCurrencyCompact() - Compact currency formatting with K, M, B suffixes

describe('formatCurrencyCompact', () => {
  describe('aUEC (Star Citizen currency)', () => {
    describe('values below 1000', () => {
      it('should display small numbers without suffix', () => {
        expect(formatCurrencyCompact(0, 'aUEC', 'en')).toBe('0 aUEC');
        expect(formatCurrencyCompact(42, 'aUEC', 'en')).toBe('42 aUEC');
        expect(formatCurrencyCompact(500, 'aUEC', 'en')).toBe('500 aUEC');
        expect(formatCurrencyCompact(999, 'aUEC', 'en')).toBe('999 aUEC');
      });

      it('should handle small negative numbers', () => {
        expect(formatCurrencyCompact(-42, 'aUEC', 'en')).toBe('-42 aUEC');
        expect(formatCurrencyCompact(-999, 'aUEC', 'en')).toBe('-999 aUEC');
      });
    });

    describe('thousands (k)', () => {
      it('should format thousands with k suffix in English', () => {
        expect(formatCurrencyCompact(1000, 'aUEC', 'en')).toBe('1.0k aUEC');
        expect(formatCurrencyCompact(1500, 'aUEC', 'en')).toBe('1.5k aUEC');
        expect(formatCurrencyCompact(42000, 'aUEC', 'en')).toBe('42.0k aUEC');
        expect(formatCurrencyCompact(999999, 'aUEC', 'en')).toBe('1000.0k aUEC');
      });

      it('should format thousands with k suffix in German', () => {
        expect(formatCurrencyCompact(1000, 'aUEC', 'de')).toBe('1,0k aUEC');
        expect(formatCurrencyCompact(1500, 'aUEC', 'de')).toBe('1,5k aUEC');
        expect(formatCurrencyCompact(42000, 'aUEC', 'de')).toBe('42,0k aUEC');
      });

      it('should handle negative thousands', () => {
        expect(formatCurrencyCompact(-1500, 'aUEC', 'en')).toBe('-1.5k aUEC');
        expect(formatCurrencyCompact(-1500, 'aUEC', 'de')).toBe('-1,5k aUEC');
      });
    });

    describe('millions (M)', () => {
      it('should format millions with M suffix in English', () => {
        expect(formatCurrencyCompact(1000000, 'aUEC', 'en')).toBe('1.0M aUEC');
        expect(formatCurrencyCompact(1234567, 'aUEC', 'en')).toBe('1.2M aUEC');
        expect(formatCurrencyCompact(15000000, 'aUEC', 'en')).toBe('15.0M aUEC');
      });

      it('should format millions with M suffix in German', () => {
        expect(formatCurrencyCompact(1000000, 'aUEC', 'de')).toBe('1,0M aUEC');
        expect(formatCurrencyCompact(1234567, 'aUEC', 'de')).toBe('1,2M aUEC');
        expect(formatCurrencyCompact(15000000, 'aUEC', 'de')).toBe('15,0M aUEC');
      });

      it('should handle negative millions', () => {
        expect(formatCurrencyCompact(-1234567, 'aUEC', 'en')).toBe('-1.2M aUEC');
        expect(formatCurrencyCompact(-1234567, 'aUEC', 'de')).toBe('-1,2M aUEC');
      });
    });

    describe('billions (B)', () => {
      it('should format billions with B suffix in English', () => {
        expect(formatCurrencyCompact(1000000000, 'aUEC', 'en')).toBe('1.0B aUEC');
        expect(formatCurrencyCompact(1234567890, 'aUEC', 'en')).toBe('1.2B aUEC');
        expect(formatCurrencyCompact(15000000000, 'aUEC', 'en')).toBe('15.0B aUEC');
      });

      it('should format billions with B suffix in German', () => {
        expect(formatCurrencyCompact(1000000000, 'aUEC', 'de')).toBe('1,0B aUEC');
        expect(formatCurrencyCompact(1234567890, 'aUEC', 'de')).toBe('1,2B aUEC');
        expect(formatCurrencyCompact(15000000000, 'aUEC', 'de')).toBe('15,0B aUEC');
      });

      it('should handle negative billions', () => {
        expect(formatCurrencyCompact(-1234567890, 'aUEC', 'en')).toBe('-1.2B aUEC');
        expect(formatCurrencyCompact(-1234567890, 'aUEC', 'de')).toBe('-1,2B aUEC');
      });
    });
  });

  describe('USD (US Dollar)', () => {
    describe('values below 1000', () => {
      it('should display small amounts with dollar sign in English', () => {
        expect(formatCurrencyCompact(0, 'USD', 'en')).toBe('$0');
        expect(formatCurrencyCompact(42, 'USD', 'en')).toBe('$42');
        expect(formatCurrencyCompact(500, 'USD', 'en')).toBe('$500');
        expect(formatCurrencyCompact(999, 'USD', 'en')).toBe('$999');
      });

      it('should handle small negative amounts', () => {
        expect(formatCurrencyCompact(-42, 'USD', 'en')).toBe('-$42');
        expect(formatCurrencyCompact(-500, 'USD', 'en')).toBe('-$500');
      });
    });

    describe('thousands (k)', () => {
      it('should format thousands with k suffix in English', () => {
        expect(formatCurrencyCompact(1000, 'USD', 'en')).toBe('$1.0k');
        expect(formatCurrencyCompact(1500, 'USD', 'en')).toBe('$1.5k');
        expect(formatCurrencyCompact(42000, 'USD', 'en')).toBe('$42.0k');
      });

      it('should handle negative thousands', () => {
        expect(formatCurrencyCompact(-1500, 'USD', 'en')).toBe('-$1.5k');
      });
    });

    describe('millions (M)', () => {
      it('should format millions with M suffix in English', () => {
        expect(formatCurrencyCompact(1000000, 'USD', 'en')).toBe('$1.0M');
        expect(formatCurrencyCompact(1234567, 'USD', 'en')).toBe('$1.2M');
        expect(formatCurrencyCompact(15000000, 'USD', 'en')).toBe('$15.0M');
      });

      it('should handle negative millions', () => {
        expect(formatCurrencyCompact(-1500000, 'USD', 'en')).toBe('-$1.5M');
      });
    });

    describe('billions (B)', () => {
      it('should format billions with B suffix in English', () => {
        expect(formatCurrencyCompact(1000000000, 'USD', 'en')).toBe('$1.0B');
        expect(formatCurrencyCompact(1234567890, 'USD', 'en')).toBe('$1.2B');
      });

      it('should handle negative billions', () => {
        expect(formatCurrencyCompact(-1234567890, 'USD', 'en')).toBe('-$1.2B');
      });
    });
  });

  describe('EUR (Euro)', () => {
    describe('values below 1000', () => {
      it('should display small amounts with euro symbol in English', () => {
        const result = formatCurrencyCompact(42, 'EUR', 'en');
        expect(result).toContain('42');
        expect(result).toContain('€');
      });

      it('should display small amounts with euro symbol in German', () => {
        const result = formatCurrencyCompact(42, 'EUR', 'de');
        expect(result).toContain('42');
        expect(result).toContain('€');
      });
    });

    describe('thousands (k)', () => {
      it('should format thousands with k suffix in English', () => {
        const result = formatCurrencyCompact(1500, 'EUR', 'en');
        expect(result).toContain('1.5k');
        expect(result).toContain('€');
      });

      it('should format thousands with k suffix in German', () => {
        const result = formatCurrencyCompact(1500, 'EUR', 'de');
        expect(result).toContain('1,5k');
        expect(result).toContain('€');
      });
    });

    describe('millions (M)', () => {
      it('should format millions with M suffix in English', () => {
        const result = formatCurrencyCompact(1234567, 'EUR', 'en');
        expect(result).toContain('1.2M');
        expect(result).toContain('€');
      });

      it('should format millions with M suffix in German', () => {
        const result = formatCurrencyCompact(1234567, 'EUR', 'de');
        expect(result).toContain('1,2M');
        expect(result).toContain('€');
      });
    });

    describe('billions (B)', () => {
      it('should format billions with B suffix in English', () => {
        const result = formatCurrencyCompact(1234567890, 'EUR', 'en');
        expect(result).toContain('1.2B');
        expect(result).toContain('€');
      });

      it('should format billions with B suffix in German', () => {
        const result = formatCurrencyCompact(1234567890, 'EUR', 'de');
        expect(result).toContain('1,2B');
        expect(result).toContain('€');
      });
    });

    describe('negative values', () => {
      it('should handle negative EUR amounts', () => {
        const result = formatCurrencyCompact(-1500, 'EUR', 'en');
        expect(result).toContain('1.5k');
        expect(result).toContain('€');
        expect(result.startsWith('-')).toBe(true);
      });
    });
  });

  describe('GBP (British Pound)', () => {
    describe('values below 1000', () => {
      it('should display small amounts with pound sign in English', () => {
        expect(formatCurrencyCompact(42, 'GBP', 'en')).toBe('£42');
        expect(formatCurrencyCompact(500, 'GBP', 'en')).toBe('£500');
        expect(formatCurrencyCompact(999, 'GBP', 'en')).toBe('£999');
      });

      it('should handle small negative amounts', () => {
        expect(formatCurrencyCompact(-42, 'GBP', 'en')).toBe('-£42');
      });
    });

    describe('thousands (k)', () => {
      it('should format thousands with k suffix in English', () => {
        expect(formatCurrencyCompact(1500, 'GBP', 'en')).toBe('£1.5k');
        expect(formatCurrencyCompact(42000, 'GBP', 'en')).toBe('£42.0k');
      });

      it('should handle negative thousands', () => {
        expect(formatCurrencyCompact(-1500, 'GBP', 'en')).toBe('-£1.5k');
      });
    });

    describe('millions (M)', () => {
      it('should format millions with M suffix in English', () => {
        expect(formatCurrencyCompact(1234567, 'GBP', 'en')).toBe('£1.2M');
        expect(formatCurrencyCompact(15000000, 'GBP', 'en')).toBe('£15.0M');
      });

      it('should handle negative millions', () => {
        expect(formatCurrencyCompact(-1234567, 'GBP', 'en')).toBe('-£1.2M');
      });
    });

    describe('billions (B)', () => {
      it('should format billions with B suffix in English', () => {
        expect(formatCurrencyCompact(1234567890, 'GBP', 'en')).toBe('£1.2B');
      });

      it('should handle negative billions', () => {
        expect(formatCurrencyCompact(-1234567890, 'GBP', 'en')).toBe('-£1.2B');
      });
    });
  });

  describe('boundary values', () => {
    it('should handle transition from no suffix to k for aUEC', () => {
      expect(formatCurrencyCompact(999, 'aUEC', 'en')).toBe('999 aUEC');
      expect(formatCurrencyCompact(1000, 'aUEC', 'en')).toBe('1.0k aUEC');
    });

    it('should handle transition from k to M for USD', () => {
      expect(formatCurrencyCompact(999999, 'USD', 'en')).toBe('$1000.0k');
      expect(formatCurrencyCompact(1000000, 'USD', 'en')).toBe('$1.0M');
    });

    it('should handle transition from M to B for GBP', () => {
      expect(formatCurrencyCompact(999999999, 'GBP', 'en')).toBe('£1000.0M');
      expect(formatCurrencyCompact(1000000000, 'GBP', 'en')).toBe('£1.0B');
    });
  });

  describe('rounding behavior', () => {
    it('should round to one decimal place for compact values', () => {
      expect(formatCurrencyCompact(1549, 'aUEC', 'en')).toBe('1.5k aUEC');  // 1.549k rounds to 1.5k
      expect(formatCurrencyCompact(1551, 'aUEC', 'en')).toBe('1.6k aUEC');  // 1.551k rounds to 1.6k
      expect(formatCurrencyCompact(1234567, 'USD', 'en')).toBe('$1.2M'); // 1.234M rounds to 1.2M
      expect(formatCurrencyCompact(1254567, 'USD', 'en')).toBe('$1.3M'); // 1.254M rounds to 1.3M
    });
  });

  describe('locale-specific formatting', () => {
    it('should use period as decimal separator in English', () => {
      expect(formatCurrencyCompact(1500, 'aUEC', 'en')).toContain('1.5k');
      expect(formatCurrencyCompact(1234567, 'USD', 'en')).toContain('1.2M');
    });

    it('should use comma as decimal separator in German', () => {
      expect(formatCurrencyCompact(1500, 'aUEC', 'de')).toContain('1,5k');
      expect(formatCurrencyCompact(1234567, 'EUR', 'de')).toContain('1,2M');
    });
  });
});

// Test cases for formatInteger() - Integer formatting with thousand separators

describe('formatInteger', () => {
  describe('basic formatting', () => {
    it('should format zero', () => {
      expect(formatInteger(0, 'en')).toBe('0');
      expect(formatInteger(0, 'de')).toBe('0');
    });

    it('should format positive integers with English thousand separators', () => {
      expect(formatInteger(1234567, 'en')).toBe('1,234,567');
      expect(formatInteger(1000, 'en')).toBe('1,000');
      expect(formatInteger(999, 'en')).toBe('999');
      expect(formatInteger(100000, 'en')).toBe('100,000');
    });

    it('should format positive integers with German thousand separators', () => {
      expect(formatInteger(1234567, 'de')).toBe('1.234.567');
      expect(formatInteger(1000, 'de')).toBe('1.000');
      expect(formatInteger(999, 'de')).toBe('999');
      expect(formatInteger(100000, 'de')).toBe('100.000');
    });
  });

  describe('large numbers', () => {
    it('should format very large numbers (999.999.999)', () => {
      expect(formatInteger(999999999, 'en')).toBe('999,999,999');
      expect(formatInteger(999999999, 'de')).toBe('999.999.999');
    });

    it('should format billion-scale numbers', () => {
      expect(formatInteger(1000000000, 'en')).toBe('1,000,000,000');
      expect(formatInteger(1000000000, 'de')).toBe('1.000.000.000');
    });
  });

  describe('negative numbers', () => {
    it('should format negative integers correctly', () => {
      expect(formatInteger(-500, 'en')).toBe('-500');
      expect(formatInteger(-500, 'de')).toBe('-500');
      expect(formatInteger(-1234567, 'en')).toBe('-1,234,567');
      expect(formatInteger(-1234567, 'de')).toBe('-1.234.567');
    });
  });

  describe('decimal truncation', () => {
    it('should truncate decimal portions (not round)', () => {
      expect(formatInteger(42.7, 'en')).toBe('42');
      expect(formatInteger(42.9, 'en')).toBe('42');
      expect(formatInteger(42.1, 'de')).toBe('42');
      expect(formatInteger(1234.99, 'de')).toBe('1.234');
    });

    it('should truncate negative decimals correctly', () => {
      expect(formatInteger(-42.7, 'en')).toBe('-42');
      expect(formatInteger(-42.9, 'de')).toBe('-42');
    });
  });
});

// Test cases for parseFormattedInteger() - Parsing formatted strings to integers

describe('parseFormattedInteger', () => {
  describe('empty and invalid input', () => {
    it('should return 0 for empty string', () => {
      expect(parseFormattedInteger('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(parseFormattedInteger('   ')).toBe(0);
    });

    it('should return 0 for just a minus sign', () => {
      expect(parseFormattedInteger('-')).toBe(0);
    });

    it('should return 0 for non-numeric strings', () => {
      expect(parseFormattedInteger('abc')).toBe(0);
      expect(parseFormattedInteger('hello world')).toBe(0);
    });
  });

  describe('German locale parsing (thousand separator: dot)', () => {
    it('should parse German formatted thousands', () => {
      expect(parseFormattedInteger('100.000')).toBe(100000);
      expect(parseFormattedInteger('1.234.567')).toBe(1234567);
    });

    it('should parse very large German formatted numbers', () => {
      expect(parseFormattedInteger('999.999.999')).toBe(999999999);
    });
  });

  describe('English locale parsing (thousand separator: comma)', () => {
    it('should parse English formatted thousands', () => {
      expect(parseFormattedInteger('100,000')).toBe(100000);
      expect(parseFormattedInteger('1,234,567')).toBe(1234567);
    });

    it('should parse very large English formatted numbers', () => {
      expect(parseFormattedInteger('999,999,999')).toBe(999999999);
    });
  });

  describe('decimal rejection (truncation)', () => {
    it('should truncate decimal portion from plain decimals', () => {
      expect(parseFormattedInteger('123.45')).toBe(123);
      expect(parseFormattedInteger('1.5')).toBe(1);
    });

    it('should truncate German decimal comma', () => {
      expect(parseFormattedInteger('123,45')).toBe(123);
      expect(parseFormattedInteger('1,5')).toBe(1);
    });

    it('should handle mixed format with decimals (English: comma thousands, dot decimal)', () => {
      expect(parseFormattedInteger('1,234.56')).toBe(1234);
    });

    it('should handle mixed format with decimals (German: dot thousands, comma decimal)', () => {
      expect(parseFormattedInteger('1.234,56')).toBe(1234);
    });
  });

  describe('negative numbers', () => {
    it('should parse negative integers', () => {
      expect(parseFormattedInteger('-500')).toBe(-500);
      expect(parseFormattedInteger('-1234')).toBe(-1234);
    });

    it('should parse negative formatted numbers', () => {
      expect(parseFormattedInteger('-1,234,567')).toBe(-1234567);
      expect(parseFormattedInteger('-1.234.567')).toBe(-1234567);
    });
  });

  describe('paste-with-separators parsing', () => {
    it('should parse pasted German formatted numbers', () => {
      expect(parseFormattedInteger('50.000')).toBe(50000);
      expect(parseFormattedInteger('1.000.000')).toBe(1000000);
    });

    it('should parse pasted English formatted numbers', () => {
      expect(parseFormattedInteger('50,000')).toBe(50000);
      expect(parseFormattedInteger('1,000,000')).toBe(1000000);
    });

    it('should handle pasted values with extra whitespace', () => {
      expect(parseFormattedInteger(' 100.000 ')).toBe(100000);
      expect(parseFormattedInteger('  1,234,567  ')).toBe(1234567);
    });
  });

  describe('plain integers', () => {
    it('should parse plain integers without separators', () => {
      expect(parseFormattedInteger('0')).toBe(0);
      expect(parseFormattedInteger('42')).toBe(42);
      expect(parseFormattedInteger('100000')).toBe(100000);
      expect(parseFormattedInteger('999999999')).toBe(999999999);
    });
  });
});
