export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Present';

  // Parsowanie daty w formacie DD.MM.YYYY HH:mm:ss
  const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Parsowanie daty w formacie ISO
  const d = new Date(dateString);
  if (!isNaN(d.valueOf())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return 'Invalid date';
};
