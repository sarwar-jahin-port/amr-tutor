'use client';

import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import type { ReferenceItem } from '@/features/marketplace/types';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** A bounded multi-select rendered as a checkbox grid (used instead of a MultiSelect component — see ui-ux.md §17: for a small, fully-visible option set a checkbox grid is simpler and arguably better UX than a dropdown). */
export function CheckboxGrid({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: ReferenceItem[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const id = `${legend}-${option.id}`;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.includes(option.id)}
                onCheckedChange={() => onChange(toggle(selected, option.id))}
              />
              <CheckboxLabel htmlFor={id}>{option.name}</CheckboxLabel>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
