"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleAddTag = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Pole do wpisywania */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" onClick={handleAddTag}>
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1 bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}