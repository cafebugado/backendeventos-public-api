import { getIsoWeek, getIsoYear, parseEventoDate } from './event-date.util';

describe('parseEventoDate', () => {
  it('faz parse de uma data válida DD/MM/YYYY', () => {
    const result = parseEventoDate('10/03/2026');

    expect(result).not.toBeNull();
    expect(result?.getUTCFullYear()).toBe(2026);
    expect(result?.getUTCMonth()).toBe(2); // março, 0-indexed
    expect(result?.getUTCDate()).toBe(10);
  });

  it('retorna null para formato inválido', () => {
    expect(parseEventoDate('2026-03-10')).toBeNull();
    expect(parseEventoDate('10-03-2026')).toBeNull();
    expect(parseEventoDate('')).toBeNull();
    expect(parseEventoDate('abc')).toBeNull();
  });

  it('retorna null para data calendarmente inválida (ex.: 31/02)', () => {
    expect(parseEventoDate('31/02/2026')).toBeNull();
  });

  it('faz parse corretamente de datas em anos bissextos (29/02)', () => {
    const result = parseEventoDate('29/02/2028');

    expect(result).not.toBeNull();
    expect(result?.getUTCDate()).toBe(29);
  });
});

describe('getIsoWeek / getIsoYear', () => {
  it('01/01/2026 (quinta-feira) é semana 1 do ano ISO 2026', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');

    expect(getIsoWeek(date)).toBe(1);
    expect(getIsoYear(date)).toBe(2026);
  });

  it('29/12/2025 (segunda-feira) já pertence à semana 1 do ano ISO 2026', () => {
    const date = new Date('2025-12-29T00:00:00.000Z');

    expect(getIsoWeek(date)).toBe(1);
    expect(getIsoYear(date)).toBe(2026);
  });

  it('28/12/2020 (segunda-feira) é semana 53 do ano ISO 2020 (não vira o ano)', () => {
    const date = new Date('2020-12-28T00:00:00.000Z');

    expect(getIsoWeek(date)).toBe(53);
    expect(getIsoYear(date)).toBe(2020);
  });

  it('30/12/2019 (segunda-feira) já pertence à semana 1 do ano ISO 2020', () => {
    const date = new Date('2019-12-30T00:00:00.000Z');

    expect(getIsoWeek(date)).toBe(1);
    expect(getIsoYear(date)).toBe(2020);
  });

  it('duas datas na virada do ano (29/12/2025 e 04/01/2026) caem na mesma semana ISO', () => {
    const a = new Date('2025-12-29T00:00:00.000Z');
    const b = new Date('2026-01-04T00:00:00.000Z');

    expect(getIsoWeek(a)).toBe(getIsoWeek(b));
    expect(getIsoYear(a)).toBe(getIsoYear(b));
  });
});
