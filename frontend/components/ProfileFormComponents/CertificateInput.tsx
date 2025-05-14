'use client';

import React from 'react';

interface CertificateEntry {
  name: string;
  issuer?: string;
  issueDate?: string; // yyyy-MM-dd
  expiryDate?: string; // yyyy-MM-dd
  noExpiry?: boolean; // true if the certificate does not expire
}

interface CertificateInputProps {
  value: CertificateEntry[];
  onChange: (value: CertificateEntry[]) => void;
}

export function CertificateInput({ value, onChange }: CertificateInputProps) {
  const addCertificate = () => {
    onChange([
      ...value,
      {
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        noExpiry: false,
      },
    ]);
  };

  const updateCertificate = (
    index: number,
    key: keyof CertificateEntry,
    newValue: string | boolean
  ) => {
    const updated = [...value];
    updated[index][key] = newValue as never;
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
            placeholder="Issuer (optional)"
            value={entry.issuer || ''}
            onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="date"
            placeholder="Issue Date"
            value={entry.issueDate || ''}
            onChange={(e) => updateCertificate(index, 'issueDate', e.target.value)}
            className="input-profile w-full"
          />
          <input
            type="date"
            placeholder="Expiry Date"
            value={entry.expiryDate || ''}
            onChange={(e) => updateCertificate(index, 'expiryDate', e.target.value)}
            className="input-profile w-full"
            disabled={entry.noExpiry}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={entry.noExpiry || false}
              onChange={(e) => updateCertificate(index, 'noExpiry', e.target.checked)}
            />
            No expiration date
          </label>
          <button
            type="button"
            onClick={() => removeCertificate(index)}
            className="self-start text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addCertificate} className="text-blue-500 hover:text-blue-700">
        + Add Certificate
      </button>
    </div>
  );
}
