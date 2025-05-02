'use client';

import React from 'react';

interface WorkExperienceEntry {
  company: string;
  position: string;
  description: string;
  responsibilities?: string[];
  startDate?: string;
  endDate?: string;
}

interface WorkExperienceInputProps {
  value: WorkExperienceEntry[];
  onChange: (value: WorkExperienceEntry[]) => void;
}

export function WorkExperienceInput({ value, onChange }: WorkExperienceInputProps) {
  const addExperience = () => {
    onChange([
      ...value,
      {
        company: '',
        position: '',
        description: '',
        responsibilities: [],
        startDate: '',
        endDate: '',
      },
    ]);
  };

  const updateExperience = (index: number, key: keyof WorkExperienceEntry, newValue: any) => {
    const updated = [...value];
    updated[index][key] = newValue;
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {value.map((entry, index) => (
        <div key={index} className="space-y-2 border-b pb-4">
          <input
            type="text"
            placeholder="Company"
            value={entry.company}
            onChange={(e) => updateExperience(index, 'company', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Position"
            value={entry.position}
            onChange={(e) => updateExperience(index, 'position', e.target.value)}
            className="input-profile w-full"
          />
          <textarea
            placeholder="Description"
            value={entry.description}
            onChange={(e) => updateExperience(index, 'description', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Start Date (yyyy-mm-dd)"
            value={entry.startDate || ''}
            onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="End Date (yyyy-mm-dd or 'Present')"
            value={entry.endDate || ''}
            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
            className="input-profile w-full"
          />
          <button
            type="button"
            onClick={() => removeExperience(index)}
            className="self-start text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addExperience} className="text-blue-500 hover:text-blue-700">
        + Add Work Experience
      </button>
    </div>
  );
}
