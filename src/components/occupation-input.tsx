'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { Loader2, X as XIcon } from 'lucide-react';
import { suggestOccupations } from '@/ai/flows/suggest-occupations';

interface OccupationInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const MAX_OCCUPATIONS = 5;

export function OccupationInput({ value, onChange }: OccupationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await suggestOccupations({ query: inputValue });
        const newSuggestions = result.occupations.filter(
          (occ) => !value.includes(occ)
        );
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timerId);
    };
  }, [inputValue, value]);

  const handleSelect = useCallback(
    (occupation: string) => {
      setInputValue('');
      if (value.length < MAX_OCCUPATIONS && !value.includes(occupation)) {
        onChange([...value, occupation]);
      }
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (occupation: string) => {
      onChange(value.filter((item) => item !== occupation));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        // Prevent form submission on enter
        e.preventDefault();
      }
      if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault();
        handleRemove(value[value.length - 1]);
      }
    },
    [inputValue, value, handleRemove]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="group w-full rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div className="flex flex-wrap gap-1 p-2">
            {value.map((occupation) => (
                <Badge key={occupation} variant="secondary">
                {occupation}
                <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleRemove(occupation);
                    }
                    }}
                    onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    }}
                    onClick={() => handleRemove(occupation)}
                >
                    <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
                </Badge>
            ))}
             <div className="flex-1 min-w-[60px]">
                <Command onKeyDown={handleKeyDown}>
                    <CommandInput
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        placeholder={value.length >= MAX_OCCUPATIONS ? 'Limit reached' : 'Add occupation...'}
                        disabled={value.length >= MAX_OCCUPATIONS}
                        className="h-full border-none p-0 focus:ring-0"
                    />
                </Command>
             </div>
            </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading && (
                <div className="p-2 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
            )}
            {!isLoading && suggestions.length === 0 && inputValue.length > 1 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer"
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
