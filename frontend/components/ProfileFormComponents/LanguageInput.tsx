'use client';

import React from 'react';

interface LanguageEntry {
  language: string;
  level?: string;
}

interface LanguageInputProps {
  value: LanguageEntry[];
  onChange: (value: LanguageEntry[]) => void;
}

export function LanguageInput({ value, onChange }: LanguageInputProps) {
  const addLanguage = () => {
    onChange([...value, { language: '', level: '' }]);
  };

  const updateLanguage = (index: number, key: keyof LanguageEntry, newValue: string) => {
    const updated = [...value];
    updated[index][key] = newValue;
    onChange(updated);
  };

  const removeLanguage = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Language"
            value={entry.language}
            onChange={(e) => updateLanguage(index, 'language', e.target.value)}
            className="input-profile flex-1"
          />
          <input
            type="text"
            placeholder="Level (optional)"
            value={entry.level || ''}
            onChange={(e) => updateLanguage(index, 'level', e.target.value)}
            className="input-profile flex-1"
          />
          <button
            type="button"
            onClick={() => removeLanguage(index)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addLanguage} className="text-blue-500 hover:text-blue-700">
        + Add Language
      </button>
    </div>
  );
}
