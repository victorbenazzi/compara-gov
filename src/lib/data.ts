import datasetJson from "../../data/indicators.json";
import photosJson from "../../data/photos.json";
import presidentsJson from "../../data/presidents.json";
import type { Dataset, PhotoInfo, PhotosFile } from "./dataset";
import type { MetricStatus } from "./metrics";
import { presidentsFileSchema, resolveTerms, termPeriod, termTitle, type Term } from "./presidents";
import { SERIES_LIST } from "./series";

export const dataset = datasetJson as unknown as Dataset;
export const photos: Record<string, PhotoInfo> = (photosJson as PhotosFile).photos;

/** Mandatos em ordem cronológica (combinados logo após seus componentes). */
export const terms: Term[] = resolveTerms(presidentsFileSchema.parse(presidentsJson)).sort(
  (a, b) => a.start.localeCompare(b.start) || (a.end ?? "9999").localeCompare(b.end ?? "9999"),
);

export const termsById = new Map(terms.map((t) => [t.id, t]));

export const hasData = dataset.generatedAt !== null;

/** Versão enxuta dos resultados (sem os dados de entrada), para enviar ao navegador. */
export type SlimResult = { status: MetricStatus; value: number | null; note?: string };
export type SlimResults = Record<string, Record<string, SlimResult>>;

export function slimResults(): SlimResults {
  const out: SlimResults = {};
  for (const [termId, byIndicator] of Object.entries(dataset.results)) {
    out[termId] = {};
    for (const [id, r] of Object.entries(byIndicator)) {
      out[termId][id] = { status: r.status, value: r.value, ...(r.note ? { note: r.note } : {}) };
    }
  }
  return out;
}

export function sourceStatusSummary() {
  return SERIES_LIST.map((s) => ({ id: s.id, name: s.name, status: dataset.sources[s.id as keyof Dataset["sources"]]?.status ?? "missing" }));
}

/** Informações mínimas de cada mandato para componentes de cliente. */
export interface TermCard {
  id: string;
  personId: string;
  name: string;
  fullName: string;
  label: string;
  period: string;
  kind: Term["kind"];
  parties: string[];
  ongoing: boolean;
  photo: string | null;
}

export function toCard(term: Term): TermCard {
  return {
    id: term.id,
    personId: term.person.id,
    name: termTitle(term),
    fullName: term.person.fullName,
    label: term.label,
    period: termPeriod(term),
    kind: term.kind,
    parties: term.parties,
    ongoing: term.end === null,
    photo: photos[term.person.id]?.src ?? null,
  };
}

export const termCards: TermCard[] = terms.map(toCard);
