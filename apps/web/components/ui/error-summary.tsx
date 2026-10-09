'use client';

import { CircleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface ErrorSummaryItem {
  /** DOM id of the field this error belongs to, so clicking the message focuses it. */
  fieldId: string;
  message: string;
}

export interface ErrorSummaryProps {
  title?: string;
  errors: ErrorSummaryItem[];
}

/**
 * GOV.UK-style error summary (docs/ui-ux.md §2, §19-20): lists every
 * validation error at the top of the form, links each one to its field, and
 * moves keyboard/screen-reader focus to itself the moment it appears so the
 * failure is announced immediately rather than discovered field-by-field.
 */
export function ErrorSummary({ title = 'There is a problem', errors }: ErrorSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (errors.length > 0) {
      headingRef.current?.focus();
    }
  }, [errors.length]);

  if (errors.length === 0) return null;

  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-surface p-4">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <div className="flex-1">
          <h2 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-ink outline-none">
            {title}
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {errors.map((error) => (
              <li key={error.fieldId}>
                <a
                  href={`#${error.fieldId}`}
                  className="text-sm font-medium text-danger underline underline-offset-2 hover:text-[#8f1c12]"
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(error.fieldId)?.focus();
                  }}
                >
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
