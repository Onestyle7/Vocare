'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { plus } from '@/app/constants';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isRotated, setIsRotated] = React.useState(false);

  const handleAddTag = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
    setIsRotated((prev) => !prev); // zmienia stan obracania
  };

  const handleRemoveTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Pole do wpisywania */}
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-profile flex-1"
        />
        <Button type="button" onClick={handleAddTag} className="group dark:bg-primary h-[43px]">
          <Image
            src={plus}
            width={12}
            height={12}
            alt="add"
            className={`transition-transform duration-300 dark:invert ${isRotated ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <div
            key={index}
            className="dark:bg-secondary flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-300"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              className="cursor-pointer text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
