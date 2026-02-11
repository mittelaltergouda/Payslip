import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValidationErrorList } from './ValidationErrorList';
import { ZodError, type ZodIssue } from 'zod';
import { translations } from '@/lib/i18n/translations';
import { describe, it, expect } from 'vitest';

/**
 * Helper function to create a mock ZodError from an array of issues
 */
function createMockZodError(issues: ZodIssue[]): ZodError {
  return new ZodError(issues);
}

const mockSingleError = createMockZodError([
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: ['members', '0', 'handle'],
    message: 'Handle is required',
  },
]);

const mockMultipleErrors = createMockZodError([
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: ['members', '0', 'handle'],
    message: 'Handle is required',
  },
  {
    code: 'too_small',
    minimum: 1,
    type: 'string',
    inclusive: true,
    exact: false,
    path: ['members', '1', 'role'],
    message: 'Role must be at least 1 character',
  },
  {
    code: 'invalid_type',
    expected: 'number',
    received: 'string',
    path: ['revenue'],
    message: 'Revenue must be a number',
  },
]);

const mockErrorWithEmptyPath = createMockZodError([
  {
    code: 'custom',
    path: [],
    message: 'General validation error',
  },
]);

const mockErrorWithLongPath = createMockZodError([
  {
    code: 'custom',
    path: ['session', 'members', '0', 'expenses', '2', 'amount'],
    message: 'Amount must be positive',
  },
]);

describe('ValidationErrorList - Basic Rendering', () => {
  it('should render heading in German', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Validierungsfehler')).toBeInTheDocument();
  });

  it('should render heading in English', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
  });

  it('should render with role="alert" for accessibility', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toBeInTheDocument();
  });

  it('should render with aria-live="polite" for accessibility', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const liveElement = container.querySelector('[aria-live="polite"]');
    expect(liveElement).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
        className="custom-validation-class"
      />
    );

    const rootElement = container.querySelector('.custom-validation-class');
    expect(rootElement).toBeInTheDocument();
  });

  it('should have default spacing classes', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const rootElement = container.querySelector('.space-y-2');
    expect(rootElement).toBeInTheDocument();
  });
});

describe('ValidationErrorList - Empty State', () => {
  it('should display no errors message when errors is null in German', () => {
    render(
      <ValidationErrorList
        errors={null}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Keine Validierungsfehler')).toBeInTheDocument();
  });

  it('should display no errors message when errors is null in English', () => {
    render(
      <ValidationErrorList
        errors={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('No validation errors')).toBeInTheDocument();
  });

  it('should display no errors message when issues array is empty', () => {
    const emptyError = createMockZodError([]);

    render(
      <ValidationErrorList
        errors={emptyError}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('No validation errors')).toBeInTheDocument();
  });

  it('should not render error cards when errors is null', () => {
    const { container } = render(
      <ValidationErrorList
        errors={null}
        translations={translations.en}
        lang="en"
      />
    );

    const errorCards = container.querySelectorAll('.border-white\\/10');
    expect(errorCards.length).toBe(0);
  });

  it('should not render error cards when issues array is empty', () => {
    const emptyError = createMockZodError([]);

    const { container } = render(
      <ValidationErrorList
        errors={emptyError}
        translations={translations.en}
        lang="en"
      />
    );

    const errorCards = container.querySelectorAll('.border-white\\/10');
    expect(errorCards.length).toBe(0);
  });
});

describe('ValidationErrorList - Single Error Display', () => {
  it('should display error path correctly', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('members.0.handle')).toBeInTheDocument();
  });

  it('should display error message correctly', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Handle is required')).toBeInTheDocument();
  });

  it('should have monospace font for path', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const pathElement = screen.getByText('members.0.handle');
    expect(pathElement).toHaveClass('font-mono');
  });

  it('should have error color for message', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const messageElement = screen.getByText('Handle is required');
    expect(messageElement).toHaveClass('text-feedback-error');
  });

  it('should render error in a bordered card', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const errorCard = container.querySelector('.border-white\\/10.rounded-lg.p-3');
    expect(errorCard).toBeInTheDocument();
  });
});

describe('ValidationErrorList - Multiple Errors Display', () => {
  it('should render all error messages', () => {
    render(
      <ValidationErrorList
        errors={mockMultipleErrors}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Handle is required')).toBeInTheDocument();
    expect(screen.getByText('Role must be at least 1 character')).toBeInTheDocument();
    expect(screen.getByText('Revenue must be a number')).toBeInTheDocument();
  });

  it('should render all error paths', () => {
    render(
      <ValidationErrorList
        errors={mockMultipleErrors}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('members.0.handle')).toBeInTheDocument();
    expect(screen.getByText('members.1.role')).toBeInTheDocument();
    expect(screen.getByText('revenue')).toBeInTheDocument();
  });

  it('should render correct number of error cards', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockMultipleErrors}
        translations={translations.en}
        lang="en"
      />
    );

    const errorCards = container.querySelectorAll('.border-white\\/10.rounded-lg.p-3');
    expect(errorCards.length).toBe(3);
  });

  it('should not display no errors message when errors exist', () => {
    render(
      <ValidationErrorList
        errors={mockMultipleErrors}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByText('No validation errors')).not.toBeInTheDocument();
  });
});

describe('ValidationErrorList - Edge Cases', () => {
  it('should handle error with empty path', () => {
    render(
      <ValidationErrorList
        errors={mockErrorWithEmptyPath}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('General validation error')).toBeInTheDocument();
  });

  it('should not render path element when path is empty', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockErrorWithEmptyPath}
        translations={translations.en}
        lang="en"
      />
    );

    // Empty path should result in empty string, which won't render the span
    const pathElements = container.querySelectorAll('.font-mono');
    // The span should not be rendered due to the `{path && ...}` condition
    expect(pathElements.length).toBe(0);
  });

  it('should handle error with long path', () => {
    render(
      <ValidationErrorList
        errors={mockErrorWithLongPath}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('session.members.0.expenses.2.amount')).toBeInTheDocument();
    expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
  });

  it('should handle error messages with special characters', () => {
    const errorWithSpecialChars = createMockZodError([
      {
        code: 'custom',
        path: ['field'],
        message: 'Value must be > 0 & < 100 (50% recommended)',
      },
    ]);

    render(
      <ValidationErrorList
        errors={errorWithSpecialChars}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Value must be > 0 & < 100 (50% recommended)')).toBeInTheDocument();
  });

  it('should handle error paths with numeric indices', () => {
    const errorWithIndices = createMockZodError([
      {
        code: 'custom',
        path: ['items', '0', 'subitems', '5', 'value'],
        message: 'Invalid value',
      },
    ]);

    render(
      <ValidationErrorList
        errors={errorWithIndices}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('items.0.subitems.5.value')).toBeInTheDocument();
  });

  it('should handle very long error messages', () => {
    const longMessage = 'This is a very long error message that describes in great detail exactly what went wrong with the validation process and provides helpful suggestions for how to fix it';
    const errorWithLongMessage = createMockZodError([
      {
        code: 'custom',
        path: ['field'],
        message: longMessage,
      },
    ]);

    render(
      <ValidationErrorList
        errors={errorWithLongMessage}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});

describe('ValidationErrorList - Styling', () => {
  it('should apply correct heading styles', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const heading = screen.getByText('Validation Errors');
    expect(heading).toHaveClass('font-semibold');
    expect(heading).toHaveClass('text-white/80');
  });

  it('should apply correct no errors message styles', () => {
    render(
      <ValidationErrorList
        errors={null}
        translations={translations.en}
        lang="en"
      />
    );

    const message = screen.getByText('No validation errors');
    expect(message).toHaveClass('text-white/60');
    expect(message).toHaveClass('text-sm');
  });

  it('should apply correct path styles', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const path = screen.getByText('members.0.handle');
    expect(path).toHaveClass('text-xs');
    expect(path).toHaveClass('text-white/60');
    expect(path).toHaveClass('font-mono');
  });

  it('should apply correct message styles', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const message = screen.getByText('Handle is required');
    expect(message).toHaveClass('text-sm');
    expect(message).toHaveClass('text-feedback-error');
  });

  it('should apply correct card styles', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    const card = container.querySelector('.border.border-white\\/10.rounded-lg.p-3');
    expect(card).toBeInTheDocument();
  });

  it('should have correct spacing between errors', () => {
    const { container } = render(
      <ValidationErrorList
        errors={mockMultipleErrors}
        translations={translations.en}
        lang="en"
      />
    );

    const errorContainer = container.querySelector('.space-y-2:last-child');
    expect(errorContainer).toBeInTheDocument();
  });
});

describe('ValidationErrorList - Language Support', () => {
  it('should render heading in German when lang is "de"', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Validierungsfehler')).toBeInTheDocument();
    expect(screen.queryByText('Validation Errors')).not.toBeInTheDocument();
  });

  it('should render heading in English when lang is "en"', () => {
    render(
      <ValidationErrorList
        errors={mockSingleError}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(screen.queryByText('Validierungsfehler')).not.toBeInTheDocument();
  });

  it('should render no errors message in German when lang is "de"', () => {
    render(
      <ValidationErrorList
        errors={null}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Keine Validierungsfehler')).toBeInTheDocument();
    expect(screen.queryByText('No validation errors')).not.toBeInTheDocument();
  });

  it('should render no errors message in English when lang is "en"', () => {
    render(
      <ValidationErrorList
        errors={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('No validation errors')).toBeInTheDocument();
    expect(screen.queryByText('Keine Validierungsfehler')).not.toBeInTheDocument();
  });
});
