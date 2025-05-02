export const formatDate = (dateString) => {
  if (!dateString) return 'Present';

  // Spróbuj sparsować datę w formacie DD.MM.YYYY HH:mm:ss
  const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Spróbuj sparsować datę w formacie ISO lub innym poprawnym dla new Date()
  const d = new Date(dateString);
  if (!isNaN(d.valueOf())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return 'Invalid date';
};
