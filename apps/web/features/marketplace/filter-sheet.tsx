'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/** Full-height mobile filter sheet (ui-ux.md §6: "Filters should open in a full-height sheet"). */
export function FilterSheet({ children }: { children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className="md:hidden">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetTitle>Filters</SheetTitle>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <SheetFooter className="mt-6 border-t-0 p-0">
          <SheetClose asChild>
            <Button className="w-full">Show results</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
