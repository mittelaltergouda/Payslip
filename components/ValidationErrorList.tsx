"use client";

import type { ZodError } from "zod";
import type { Lang } from "@/lib/i18n/translations";

/**
 * Props for the ValidationErrorList component.
 */
export interface ValidationErrorListProps {
  /**
   * Zod validation error object containing issues array, or null if no errors.
   */
  errors: ZodError | null;

  /**
   * Translation strings for the current language.
   */
  translations: Record<string, string>;

  /**
   * Current language for formatting.
   */
  lang: Lang;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * ValidationErrorList component displays Zod validation errors in a user-friendly format.
 * It shows the error path and message for each validation issue.
 *
 * The component displays:
 * - A header with the "Validation Errors" title
 * - A "no validation errors" message if the list is empty or errors is null
 * - Each validation issue showing:
 *   - Field path (e.g., "members.0.handle")
 *   - Error message
 *
 * Follows the TransfersList component pattern for rendering arrays of items
 * with consistent styling and empty state handling.
 *
 * @example
 * ```tsx
 * import { z } from "zod";
 * import { ValidationErrorList } from "@/components/ValidationErrorList";
 * import { translations } from "@/lib/i18n/translations";
 *
 * const schema = z.object({
 *   name: z.string().min(1, "Name is required"),
 *   age: z.number().min(0, "Age must be positive"),
 * });
 *
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     return (
 *       <ValidationErrorList
 *         errors={error}
 *         translations={translations[lang]}
 *         lang={lang}
 *       />
 *     );
 *   }
 * }
 * ```
 */
export function ValidationErrorList({
  errors,
  translations,
  lang: _lang,
  className = "",
}: ValidationErrorListProps) {
  const t = translations;

  // Get issues array, or empty array if errors is null
  const issues = errors?.issues ?? [];

  return (
    <div className={`space-y-2 ${className}`} role="alert" aria-live="polite">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white/80">{t.validationErrors}</h4>
      </div>

      {issues.length === 0 && (
        <p className="text-white/60 text-sm">{t.noValidationErrors}</p>
      )}

      <div className="space-y-2">
        {issues.map((issue, idx) => {
          // Join the path array with dots (e.g., ["members", "0", "handle"] -> "members.0.handle")
          const path = issue.path.join(".");
          const message = issue.message;

          return (
            <div key={idx} className="border border-white/10 rounded-lg p-3">
              <div className="flex flex-col gap-1">
                {path && (
                  <span className="text-xs text-white/60 font-mono">{path}</span>
                )}
                <span className="text-sm text-feedback-error">{message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
