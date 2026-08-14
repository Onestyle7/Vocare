// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { claimLegacyHobbiesForCv, parseLegacyHobbyNames } from '../utils/legacyHobbies';

const createStorage = (entries: Record<string, string>) => {
  const values = new Map(Object.entries(entries));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
};

describe('legacy hobbies migration', () => {
  it('reads the historical object format without changing its order', () => {
    expect(
      parseLegacyHobbyNames(
        JSON.stringify([
          { id: '2', name: ' Fotografia ' },
          { id: '1', name: 'Bieganie' },
          { id: 'empty', name: ' ' },
        ])
      )
    ).toEqual(['Fotografia', 'Bieganie']);
  });

  it('supports historical string entries and ignores invalid storage data', () => {
    expect(parseLegacyHobbyNames(JSON.stringify(['Muzyka', 'Podróże']))).toEqual([
      'Muzyka',
      'Podróże',
    ]);
    expect(parseLegacyHobbyNames('{invalid')).toEqual([]);
  });

  it('assigns the global legacy data to only one CV', () => {
    const storage = createStorage({
      hobbies: JSON.stringify([{ id: '1', name: 'Fotografia' }]),
    });

    expect(claimLegacyHobbiesForCv(storage, 'cv-a')).toEqual(['Fotografia']);
    storage.setItem('hobbies', JSON.stringify([{ id: '2', name: 'Dane innego CV' }]));
    expect(claimLegacyHobbiesForCv(storage, 'cv-a')).toEqual(['Fotografia']);
    expect(claimLegacyHobbiesForCv(storage, 'cv-b')).toEqual([]);
  });

  it('snapshots an empty migration so later global values cannot leak into another CV', () => {
    const storage = createStorage({ hobbies: '[]' });

    expect(claimLegacyHobbiesForCv(storage, 'cv-a')).toEqual([]);
    storage.setItem('hobbies', JSON.stringify([{ id: '2', name: 'Nowe hobby' }]));
    expect(claimLegacyHobbiesForCv(storage, 'cv-a')).toEqual([]);
    expect(claimLegacyHobbiesForCv(storage, 'cv-b')).toEqual([]);
  });
});
