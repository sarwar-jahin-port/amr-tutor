'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Weekday } from '@/features/marketplace/types';
import { updateListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';

const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: 'SATURDAY', label: 'Saturday' },
  { id: 'SUNDAY', label: 'Sunday' },
  { id: 'MONDAY', label: 'Monday' },
  { id: 'TUESDAY', label: 'Tuesday' },
  { id: 'WEDNESDAY', label: 'Wednesday' },
  { id: 'THURSDAY', label: 'Thursday' },
  { id: 'FRIDAY', label: 'Friday' },
];

const TEACHING_MODE_OPTIONS: { id: 'HOME' | 'ONLINE' | 'BOTH'; name: string }[] = [
  { id: 'HOME', name: "At the student's home" },
  { id: 'ONLINE', name: 'Online' },
  { id: 'BOTH', name: 'Either' },
];

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

function initialSlots(listing: ListingDetail): Record<Weekday, SlotState> {
  const base = Object.fromEntries(
    WEEKDAYS.map((d) => [d.id, { enabled: false, startTime: '17:00', endTime: '18:00' }]),
  ) as Record<Weekday, SlotState>;

  for (const slot of listing.schedules) {
    base[slot.day] = {
      enabled: true,
      startTime: slot.startMinute !== null ? minutesToTime(slot.startMinute) : '17:00',
      endTime: slot.endMinute !== null ? minutesToTime(slot.endMinute) : '18:00',
    };
  }
  return base;
}

export function ScheduleStage({
  listing,
  onSaved,
}: {
  listing: ListingDetail;
  onSaved: (listing: ListingDetail) => void;
}) {
  const [slots, setSlots] = useState<Record<Weekday, SlotState>>(() => initialSlots(listing));
  const [teachingMode, setTeachingMode] = useState(listing.teachingMode);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateSlot(day: Weekday, patch: Partial<SlotState>) {
    setSlots((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  const onSubmit = async () => {
    setFormError(null);

    const schedules = WEEKDAYS.filter((d) => slots[d.id].enabled).map((d) => ({
      day: d.id,
      startTime: slots[d.id].startTime,
      endTime: slots[d.id].endTime,
    }));

    const invalidSlot = schedules.find((s) => s.startTime >= s.endTime);
    if (invalidSlot) {
      setFormError(`On ${invalidSlot.day.toLowerCase()}, the start time must be before the end time.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await updateListing(listing.id, { schedules, teachingMode });
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save the schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="teachingMode">Teaching mode</FieldLabel>
        <Select value={teachingMode} onValueChange={(v) => setTeachingMode(v as typeof teachingMode)}>
          <SelectTrigger id="teachingMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEACHING_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">Weekly schedule</legend>
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
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  aria-label={`${day.label} start time`}
                  value={slots[day.id].startTime}
                  onChange={(e) => updateSlot(day.id, { startTime: e.target.value })}
                  className="w-32"
                />
                <span className="text-ink-secondary">–</span>
                <Input
                  type="time"
                  aria-label={`${day.label} end time`}
                  value={slots[day.id].endTime}
                  onChange={(e) => updateSlot(day.id, { endTime: e.target.value })}
                  className="w-32"
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
