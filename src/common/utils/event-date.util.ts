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

const SAO_PAULO_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Dia corrente no fuso de Brasília, representado como meia-noite UTC — a mesma
 * representação de `parseEventoDate`, para as duas serem comparadas direto.
 * `data_evento` é uma data de calendário brasileira: usar o dia em UTC faria o
 * "hoje" virar às 21h de Brasília (ver issue #33).
 */
export function todayInSaoPaulo(now: Date = new Date()): Date {
  const parts = SAO_PAULO_DATE_FORMAT.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value);

  return new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
}

/**
 * Data como "YYYYMMDD": texto que ordena igual à data. É a chave usada para
 * comparar com `data_evento` direto no banco (ver `findUpcoming`).
 */
export function toSortableDateKey(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
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
