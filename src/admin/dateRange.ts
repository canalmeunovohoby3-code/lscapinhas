export type PeriodPreset =
  | 'all'
  | 'today'
  | 'last7'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export type PeriodRangePreset = Exclude<PeriodPreset, 'custom'>;

export const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'all', label: 'Todo o período' },
  { value: 'today', label: 'Hoje' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'custom', label: 'Personalizado' },
];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPeriodRange(
  preset: PeriodRangePreset,
  now: Date = new Date(),
): { from: string; to: string } {
  if (preset === 'all') return { from: '', to: '' };

  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);

  if (preset === 'today') {
    return { from: toDateInputValue(end), to: toDateInputValue(end) };
  }

  if (preset === 'last7') {
    start.setDate(end.getDate() - 6);
    return { from: toDateInputValue(start), to: toDateInputValue(end) };
  }

  if (preset === 'thisMonth') {
    start.setDate(1);
    return { from: toDateInputValue(start), to: toDateInputValue(end) };
  }

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    from: toDateInputValue(lastMonthStart),
    to: toDateInputValue(lastMonthEnd),
  };
}
