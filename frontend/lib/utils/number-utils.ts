export function salaryFormatter(salary: number) {
  return (
    new Intl.NumberFormat('pl-PL', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(salary) + ' zł'
  );
}
