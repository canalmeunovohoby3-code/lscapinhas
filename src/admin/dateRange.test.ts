import { describe, expect, it } from 'vitest';
import { getPeriodRange } from './dateRange';

const reference = new Date(2026, 9, 29, 15, 30);

describe('atalhos de período do admin', () => {
  it('monta hoje, últimos 7 dias e este mês', () => {
    expect(getPeriodRange('today', reference)).toEqual({
      from: '2026-10-29',
      to: '2026-10-29',
    });
    expect(getPeriodRange('last7', reference)).toEqual({
      from: '2026-10-23',
      to: '2026-10-29',
    });
    expect(getPeriodRange('thisMonth', reference)).toEqual({
      from: '2026-10-01',
      to: '2026-10-29',
    });
  });

  it('monta o mês anterior e o período completo', () => {
    expect(getPeriodRange('lastMonth', reference)).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(getPeriodRange('all', reference)).toEqual({ from: '', to: '' });
  });
});
