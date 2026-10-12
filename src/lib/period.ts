/** Utilitários de períodos. Meses são "AAAA-MM", anos são "AAAA", datas são "AAAA-MM-DD". */

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

/**
 * Meses atribuídos a um período de governo: um mês pertence a quem estava no
 * cargo no seu primeiro dia (intervalo semiaberto [início, fim)).
 * Equivale a "primeiro mês completo no cargo" para posses no meio do mês.
 */
export function attributedMonths(start: string, end: string | null, until: string): string[] {
  const first = start.endsWith("-01") ? start.slice(0, 7) : addMonths(start.slice(0, 7), 1);
  let last = until;
  if (end) {
    // Último mês cujo dia 1 é estritamente anterior ao fim.
    const endMonth = end.slice(0, 7);
    const lastByEnd = end.endsWith("-01") ? addMonths(endMonth, -1) : endMonth;
    if (lastByEnd < last) last = lastByEnd;
  }
  return first <= last ? monthRange(first, last) : [];
}

function dayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / 86_400_000;
}

/** Dias de sobreposição entre [start, end) e o ano civil `year`. */
export function overlapDaysInYear(start: string, end: string, year: number): number {
  const a = Math.max(dayNumber(start), dayNumber(`${year}-01-01`));
  const b = Math.min(dayNumber(end), dayNumber(`${year + 1}-01-01`));
  return Math.max(0, b - a);
}

export function daysInYear(year: number): number {
  return dayNumber(`${year + 1}-01-01`) - dayNumber(`${year}-01-01`);
}

/** Anos em que [start, end) cobre mais da metade dos dias. */
export function majorityYears(start: string, end: string): number[] {
  const out: number[] = [];
  const y0 = Number(start.slice(0, 4));
  const y1 = Number(end.slice(0, 4));
  for (let y = y0; y <= y1; y++) {
    if (overlapDaysInYear(start, end, y) * 2 > daysInYear(y)) out.push(y);
  }
  return out;
}

export function daysBetween(start: string, end: string): number {
  return dayNumber(end) - dayNumber(start);
}

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  if (!m) return y;
  return `${MONTHS_PT[Number(m) - 1]}/${y}`;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
