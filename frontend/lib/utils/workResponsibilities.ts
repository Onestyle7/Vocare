export const responsibilityLinesToText = (responsibilities?: readonly string[] | null) =>
  (responsibilities ?? []).join('\n');

export const textToResponsibilityLines = (text: string) => text.split(/\r?\n/);

export const normalizeResponsibilitiesForPayload = (
  responsibilities?: readonly (string | null | undefined)[] | null
) =>
  (responsibilities ?? [])
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
