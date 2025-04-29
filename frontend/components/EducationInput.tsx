'use client';

import React from 'react';

interface EducationEntry {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

interface EducationInputProps {
  value: EducationEntry[];
  onChange: (value: EducationEntry[]) => void;
}

export function EducationInput({ value, onChange }: EducationInputProps) {
  const addEducation = () => {
    onChange([...value, { institution: '', degree: '', field: '', startDate: '', endDate: '' }]);
  };

  const updateEducation = (index: number, key: keyof EducationEntry, newValue: string) => {
    const updated = [...value];
    updated[index][key] = newValue;
    onChange(updated);
  };

  const removeEducation = (index: number) => {
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
            placeholder="Institution"
            value={entry.institution}
            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Degree (optional)"
            value={entry.degree || ''}
            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Field (optional)"
            value={entry.field || ''}
            onChange={(e) => updateEducation(index, 'field', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Start Date (yyyy-mm-dd)"
            value={entry.startDate || ''}
            onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="End Date (yyyy-mm-dd)"
            value={entry.endDate || ''}
            onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
            className="input-profile w-full"
          />
          <button
            type="button"
            onClick={() => removeEducation(index)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEducation}
        className="text-blue-500 hover:text-blue-700"
      >
        + Add Education
      </button>
    </div>
  );
}
