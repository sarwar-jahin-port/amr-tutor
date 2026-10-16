'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Division, Weekday } from '@/features/marketplace/types';
import { replaceAvailability, replaceLocations } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';

const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: 'SATURDAY', label: 'Saturday' },
  { id: 'SUNDAY', label: 'Sunday' },
  { id: 'MONDAY', label: 'Monday' },
  { id: 'TUESDAY', label: 'Tuesday' },
  { id: 'WEDNESDAY', label: 'Wednesday' },
  { id: 'THURSDAY', label: 'Thursday' },
  { id: 'FRIDAY', label: 'Friday' },
];

interface LocationRow {
  city: string;
  area: string;
}

interface SlotState {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function initialSlots(profile: TutorProfile): Record<Weekday, SlotState> {
  const base = Object.fromEntries(
    WEEKDAYS.map((d) => [d.id, { enabled: false, startTime: '17:00', endTime: '19:00' }]),
  ) as Record<Weekday, SlotState>;

  for (const slot of profile.availability) {
    base[slot.day] = {
      enabled: true,
      startTime: minutesToTime(slot.startMinute),
      endTime: minutesToTime(slot.endMinute),
    };
  }
  return base;
}

export function AvailabilityStage({
  profile,
  divisions,
  onSaved,
}: {
  profile: TutorProfile;
  divisions: Division[];
  onSaved: (profile: TutorProfile) => void;
}) {
  const districts = divisions.flatMap((d) => d.districts);
  const [locations, setLocations] = useState<LocationRow[]>(
    profile.locations.length > 0
      ? profile.locations.map((l) => ({ city: l.city, area: l.area }))
      : [{ city: '', area: '' }],
  );
  const [slots, setSlots] = useState<Record<Weekday, SlotState>>(() => initialSlots(profile));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateLocation(index: number, patch: Partial<LocationRow>) {
    setLocations((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeLocation(index: number) {
    setLocations((rows) => rows.filter((_, i) => i !== index));
  }

  function updateSlot(day: Weekday, patch: Partial<SlotState>) {
    setSlots((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  const onSubmit = async () => {
    setFormError(null);

    const validLocations = locations.filter((l) => l.city.trim() && l.area.trim());
    const selectedSlots = WEEKDAYS.filter((d) => slots[d.id].enabled).map((d) => ({
      day: d.id,
      startTime: slots[d.id].startTime,
      endTime: slots[d.id].endTime,
    }));

    const invalidSlot = selectedSlots.find((s) => s.startTime >= s.endTime);
    if (invalidSlot) {
      setFormError(`On ${invalidSlot.day.toLowerCase()}, the start time must be before the end time.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await replaceLocations(validLocations);
      const saved = await replaceAvailability(selectedSlots);
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your areas and availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">Areas you can teach in</legend>
        {locations.map((location, index) => (
          <div key={index} className="flex items-end gap-2">
            <Field className="flex-1">
              <FieldLabel htmlFor={`district-${index}`}>District</FieldLabel>
              <Select value={location.city} onValueChange={(v) => updateLocation(index, { city: v })}>
                <SelectTrigger id={`district-${index}`}>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor={`area-${index}`}>Area</FieldLabel>
              <Input
                id={`area-${index}`}
                placeholder="e.g. Dhanmondi"
                value={location.area}
                onChange={(e) => updateLocation(index, { area: e.target.value })}
              />
            </Field>
            {locations.length > 1 && (
              <Button
                type="button"
                variant="tertiary"
                size="md"
                aria-label="Remove this area"
                onClick={() => removeLocation(index)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {locations.length < 5 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setLocations((rows) => [...rows, { city: '', area: '' }])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add another area
          </Button>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">Weekly availability</legend>
        {WEEKDAYS.map((day) => (
          <div key={day.id} className="flex flex-wrap items-center gap-3">
            <div className="flex w-36 items-center gap-2">
              <Checkbox
                id={`day-${day.id}`}
                checked={slots[day.id].enabled}
                onCheckedChange={() => updateSlot(day.id, { enabled: !slots[day.id].enabled })}
              />
              <CheckboxLabel htmlFor={`day-${day.id}`}>{day.label}</CheckboxLabel>
            </div>
            {slots[day.id].enabled && (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  aria-label={`${day.label} start time`}
                  value={slots[day.id].startTime}
                  onChange={(e) => updateSlot(day.id, { startTime: e.target.value })}
                  className="flex-1 sm:w-36 sm:flex-none"
                />
                <span className="text-ink-secondary">–</span>
                <Input
                  type="time"
                  aria-label={`${day.label} end time`}
                  value={slots[day.id].endTime}
                  onChange={(e) => updateSlot(day.id, { endTime: e.target.value })}
                  className="flex-1 sm:w-36 sm:flex-none"
                />
              </div>
            )}
          </div>
        ))}
      </fieldset>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
