'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UseFormReturn } from 'react-hook-form';
import { countries } from '@/app/constants';

interface CountryFormValues {
  country: string;
}

interface CountryComboboxProps {
  form: UseFormReturn<CountryFormValues>;
  name: keyof CountryFormValues;
}

export function CountryCombobox({ form, name }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const value = form.watch(name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? countries.find((c) => c.value === value)?.label : 'Select country...'}
          <ChevronsUpDown className="ml-2 opacity-50" size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={(currentValue) => {
                    form.setValue(name, currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  {country.label}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === country.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
