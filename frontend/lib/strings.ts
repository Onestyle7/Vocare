/**
 * Remove Polish diacritics from a string.
 * Examples:
 *  - "Jóźwik" -> "Jozwik"
 *  - "Łukasz Żółć" -> "Lukasz Zolc"
 */
export function removePolishDiacritics(input: string): string {
  if (!input) return input;

  // First remove all combining diacritical marks via NFD normalization
  // Note: some characters like Ł/ł don't decompose canonically, so map them manually after.
  const stripped = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Handle characters that don't decompose to base letters
  return stripped.replace(/ł/g, 'l').replace(/Ł/g, 'L');
}

/**
 * Map Polish diacritics using a strict replacement table.
 * Useful if you prefer to avoid Unicode normalization.
 */
export function removePolishDiacriticsStrict(input: string): string {
  if (!input) return input;
  const map: Record<string, string> = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ż: 'z',
    ź: 'z',
    Ą: 'A',
    Ć: 'C',
    Ę: 'E',
    Ł: 'L',
    Ń: 'N',
    Ó: 'O',
    Ś: 'S',
    Ż: 'Z',
    Ź: 'Z',
  };
  return input.replace(/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, (ch) => map[ch] || ch);
}
