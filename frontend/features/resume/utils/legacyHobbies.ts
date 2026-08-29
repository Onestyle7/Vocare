const LEGACY_HOBBIES_KEY = 'hobbies';
const LEGACY_HOBBIES_MIGRATION_KEY = 'resumeCreator:hobbiesMigratedToCv';

type ResumeStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface LegacyHobbiesClaim {
  cvId: string;
  hobbies: string[];
}

const parseLegacyHobbiesClaim = (storedClaim: string | null): LegacyHobbiesClaim | null => {
  if (!storedClaim) return null;

  try {
    const parsed: unknown = JSON.parse(storedClaim);
    if (!parsed || typeof parsed !== 'object') return null;

    const claim = parsed as Partial<LegacyHobbiesClaim>;
    if (typeof claim.cvId !== 'string' || !Array.isArray(claim.hobbies)) return null;

    return {
      cvId: claim.cvId,
      hobbies: claim.hobbies.filter((hobby): hobby is string => typeof hobby === 'string'),
    };
  } catch {
    return null;
  }
};

export const parseLegacyHobbyNames = (storedHobbies: string | null): string[] => {
  if (!storedHobbies) return [];

  try {
    const parsed: unknown = JSON.parse(storedHobbies);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') {
          return item.name.trim();
        }
        return '';
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

export const claimLegacyHobbiesForCv = (storage: ResumeStorage, cvId: string): string[] => {
  try {
    const existingClaim = parseLegacyHobbiesClaim(storage.getItem(LEGACY_HOBBIES_MIGRATION_KEY));
    if (existingClaim) {
      return existingClaim.cvId === cvId ? [...existingClaim.hobbies] : [];
    }

    const hobbyNames = parseLegacyHobbyNames(storage.getItem(LEGACY_HOBBIES_KEY));
    storage.setItem(
      LEGACY_HOBBIES_MIGRATION_KEY,
      JSON.stringify({ cvId, hobbies: hobbyNames } satisfies LegacyHobbiesClaim)
    );

    return hobbyNames;
  } catch {
    return [];
  }
};
