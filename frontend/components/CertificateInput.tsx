'use client';

import React from 'react';

interface CertificateEntry {
  name: string;
  date?: string;
  issuer?: string;
}

interface CertificateInputProps {
  value: CertificateEntry[];
  onChange: (value: CertificateEntry[]) => void;
}

export function CertificateInput({ value, onChange }: CertificateInputProps) {
  const addCertificate = () => {
    onChange([...value, { name: '', date: '', issuer: '' }]);
  };

  const updateCertificate = (index: number, key: keyof CertificateEntry, newValue: string) => {
    const updated = [...value];
    updated[index][key] = newValue;
    onChange(updated);
  };

  const removeCertificate = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 border-b pb-4">
          <input
            type="text"
            placeholder="Certificate Name"
            value={entry.name}
            onChange={(e) => updateCertificate(index, 'name', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Date (yyyy-mm-dd) (optional)"
            value={entry.date || ''}
            onChange={(e) => updateCertificate(index, 'date', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="text"
            placeholder="Issuer (optional)"
            value={entry.issuer || ''}
            onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
            className="input-profile w-full"
          />
          <button
            type="button"
            onClick={() => removeCertificate(index)}
            className="self-start text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addCertificate}
        className="text-blue-500 hover:text-blue-700"
      >
        + Add Certificate
      </button>
    </div>
  );
}
