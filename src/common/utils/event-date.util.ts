const DATA_EVENTO_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Parse de `data_evento` no formato "DD/MM/YYYY" — retorna `null` se inválido. */
export function parseEventoDate(dataEvento: string): Date | null {
  const match = DATA_EVENTO_REGEX.exec(dataEvento);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  const isValidCalendarDate =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);

  return isValidCalendarDate ? date : null;
}

function isoThursdayOf(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const isoWeekday = d.getUTCDay() || 7; // domingo (0) vira 7
  d.setUTCDate(d.getUTCDate() + 4 - isoWeekday);
  return d;
}

/** Número da semana ISO-8601 (1-53), calculado pela quinta-feira da semana. */
export function getIsoWeek(date: Date): number {
  const thursday = isoThursdayOf(date);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
}

/** Ano ISO-8601 correspondente — pode divergir do ano calendário perto da virada do ano. */
export function getIsoYear(date: Date): number {
  return isoThursdayOf(date).getUTCFullYear();
}
