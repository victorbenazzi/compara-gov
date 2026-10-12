import type { Indicator, Method } from "./indicators";
import { addMonths, attributedMonths, formatMonth, majorityYears } from "./period";
import type { Term } from "./presidents";
import type { SeriesId } from "./series";

export interface SeriesData {
  /** Primeiro e último período com dado ("AAAA-MM" ou "AAAA"). */
  first: string;
  last: string;
  points: Record<string, number>;
}

export type SeriesStore = Partial<Record<SeriesId, SeriesData>>;

export type MetricStatus = "ok" | "partial" | "unavailable";

export interface MetricInput {
  series: SeriesId;
  /** Pares [período, valor] exatamente como usados no cálculo. */
  points: [string, number][];
}

export interface MetricResult {
  status: MetricStatus;
  value: number | null;
  note?: string;
  inputs: MetricInput[];
}

export interface ComputeContext {
  store: SeriesStore;
  /** Mês de referência para mandatos em curso ("AAAA-MM"). */
  asOf: string;
  /** Mandatos simples por id, para expandir mandatos combinados. */
  singles: Map<string, Term>;
}

const unavailable = (note: string): MetricResult => ({ status: "unavailable", value: null, note, inputs: [] });

export function computeIndicator(indicator: Indicator, term: Term, ctx: ComputeContext): MetricResult {
  const m = indicator.method;
  switch (m.kind) {
    case "annualMean":
    case "annualCompound":
      return computeAnnual(m, term, ctx);
    default:
      return computeMonthly(m, term, ctx);
  }
}

function ongoingNote(term: Term, lastUsed: string, complete: boolean): Pick<MetricResult, "status" | "note"> {
  if (term.end === null) return { status: "partial", note: `Mandato em curso: dados até ${formatMonth(lastUsed)}.` };
  if (!complete) return { status: "partial", note: `Dados publicados só até ${formatMonth(lastUsed)}.` };
  return { status: "ok" };
}

function round(x: number, digits = 6): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

function computeMonthly(m: Exclude<Method, { kind: "annualMean" | "annualCompound" }>, term: Term, ctx: ComputeContext): MetricResult {
  const data = ctx.store[m.series];
  if (!data) return unavailable("Série ainda não baixada das fontes oficiais.");

  const months = attributedMonths(term.start, term.end, ctx.asOf);
  if (months.length === 0) return unavailable("Mandato sem nenhum mês completo.");

  const used = months.filter((x) => x <= data.last);
  if (used.length === 0) return unavailable(`Série publicada só até ${formatMonth(data.last)}.`);
  const lastUsed = used[used.length - 1];
  const complete = used.length === months.length;
  const scale = "scale" in m && m.scale ? m.scale : 1;

  if (m.kind === "end") {
    if (lastUsed < data.first) return unavailable(`Série disponível a partir de ${formatMonth(data.first)}.`);
    const v = data.points[lastUsed];
    if (v === undefined) return unavailable(`Sem dado para ${formatMonth(lastUsed)}.`);
    return { ...ongoingNote(term, lastUsed, complete), value: round(v * scale), inputs: [{ series: m.series, points: [[lastUsed, v]] }] };
  }

  if (m.kind === "delta" || m.kind === "change" || m.kind === "realChange") {
    const ref = addMonths(months[0], -1);
    const v0 = data.points[ref];
    const v1 = data.points[lastUsed];
    if (v0 === undefined) {
      return unavailable(
        ref < data.first
          ? `Série disponível a partir de ${formatMonth(data.first)}; sem valor herdado em ${formatMonth(ref)}.`
          : `Sem dado para ${formatMonth(ref)}.`,
      );
    }
    if (v1 === undefined) return unavailable(`Sem dado para ${formatMonth(lastUsed)}.`);
    const inputs: MetricInput[] = [{ series: m.series, points: [[ref, v0], [lastUsed, v1]] }];
    const status = ongoingNote(term, lastUsed, complete);

    if (m.kind === "delta") return { ...status, value: round((v1 - v0) * scale), inputs };
    if (m.kind === "change") return { ...status, value: round((v1 / v0 - 1) * 100), inputs };

    const defl = ctx.store[m.deflator];
    if (!defl) return unavailable("Série do deflator ainda não baixada.");
    const deflPoints = collect(defl, used);
    if (!deflPoints.ok) return unavailable(deflPoints.note);
    const inflation = compound(deflPoints.points.map(([, v]) => v));
    inputs.push({ series: m.deflator, points: deflPoints.points });
    return { ...status, value: round(((v1 / v0) / (1 + inflation) - 1) * 100), inputs };
  }

  // Indicadores de fluxo: exigem todos os meses do mandato.
  if (months[0] < data.first) return unavailable(`Série disponível a partir de ${formatMonth(data.first)}.`);
  const got = collect(data, used);
  if (!got.ok) return unavailable(got.note);
  const values = got.points.map(([, v]) => v);
  const status = ongoingNote(term, lastUsed, complete);
  const inputs = [{ series: m.series, points: got.points }];

  if (m.kind === "compound") return { ...status, value: round(compound(values) * 100), inputs };
  if (m.kind === "annualized") {
    const acc = compound(values);
    return { ...status, value: round((Math.pow(1 + acc, 12 / values.length) - 1) * 100), inputs };
  }
  // mean
  return { ...status, value: round(values.reduce((a, b) => a + b, 0) / values.length), inputs };
}

function computeAnnual(m: Extract<Method, { kind: "annualMean" | "annualCompound" }>, term: Term, ctx: ComputeContext): MetricResult {
  const data = ctx.store[m.series];
  if (!data) return unavailable("Série ainda não baixada das fontes oficiais.");

  const asOfYear = Number(ctx.asOf.slice(0, 4));
  const years = new Set<number>();
  for (const id of term.parts) {
    const part = ctx.singles.get(id);
    if (!part) throw new Error(`Mandato desconhecido: ${id}`);
    const end = part.end ?? part.scheduledEnd ?? `${asOfYear + 1}-01-01`;
    for (const y of majorityYears(part.start, end)) years.add(y);
  }
  const all = [...years].sort((a, b) => a - b).map(String);
  if (all.length === 0) {
    return unavailable("Nenhum ano civil em que o mandato tenha durado mais da metade dos dias.");
  }
  if (all[0] < data.first) return unavailable(`Série disponível a partir de ${data.first}.`);
  const used = all.filter((y) => y <= data.last);
  if (used.length === 0) return unavailable(`Ainda não há dado anual publicado para ${all.join(", ")}.`);
  const got = collect(data, used);
  if (!got.ok) return unavailable(got.note);

  const values = got.points.map(([, v]) => v);
  const acc = compound(values);
  const value = m.kind === "annualCompound" ? acc : Math.pow(1 + acc, 1 / values.length) - 1;
  const pending = all.filter((y) => y > data.last);
  const status: Pick<MetricResult, "status" | "note"> =
    pending.length > 0
      ? { status: "partial", note: `Considera ${used.join(", ")}; ${pending.join(", ")} ainda sem dado anual publicado.` }
      : { status: "ok" };
  return { ...status, value: round(value * 100), inputs: [{ series: m.series, points: got.points }] };
}

function collect(data: SeriesData, periods: string[]): { ok: true; points: [string, number][] } | { ok: false; note: string } {
  const points: [string, number][] = [];
  for (const p of periods) {
    const v = data.points[p];
    if (v === undefined) return { ok: false, note: `Sem dado para ${formatMonth(p)}.` };
    points.push([p, v]);
  }
  return { ok: true, points };
}

/** Π(1 + xᵢ/100) − 1, como fração. */
export function compound(ratesPct: number[]): number {
  return ratesPct.reduce((acc, x) => acc * (1 + x / 100), 1) - 1;
}
