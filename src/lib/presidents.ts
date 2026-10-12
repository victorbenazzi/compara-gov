import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve estar no formato AAAA-MM-DD");

export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  fullName: z.string(),
  wikipedia: z.string(),
});

const singleTermSchema = z.object({
  id: z.string(),
  person: z.string(),
  label: z.string(),
  start: isoDate,
  end: isoDate.nullable(),
  scheduledEnd: isoDate.optional(),
  party: z.string(),
  vice: z.string().nullable(),
  howStarted: z.string(),
  howEnded: z.string(),
});

const combinedTermSchema = z.object({
  id: z.string(),
  person: z.string(),
  label: z.string(),
  combines: z.array(z.string()).min(2),
});

export const presidentsFileSchema = z.object({
  people: z.array(personSchema),
  terms: z.array(z.union([singleTermSchema, combinedTermSchema])),
});

export type Person = z.infer<typeof personSchema>;
export type SingleTerm = z.infer<typeof singleTermSchema>;
export type CombinedTerm = z.infer<typeof combinedTermSchema>;
export type PresidentsFile = z.infer<typeof presidentsFileSchema>;

/** A term ready for display and computation; combined terms are expanded. */
export interface Term {
  id: string;
  person: Person;
  label: string;
  kind: "single" | "combined";
  /** Ids of the single terms that make up this entry (itself, for single terms). */
  parts: string[];
  start: string;
  /** Exclusive end date, or null while in office. */
  end: string | null;
  scheduledEnd?: string;
  parties: string[];
  vices: string[];
  howStarted: string;
  howEnded: string;
}

export function resolveTerms(file: PresidentsFile): Term[] {
  const people = new Map(file.people.map((p) => [p.id, p]));
  const singles = new Map<string, SingleTerm>();
  for (const t of file.terms) if (!("combines" in t)) singles.set(t.id, t);

  const getPerson = (id: string) => {
    const p = people.get(id);
    if (!p) throw new Error(`Pessoa desconhecida: ${id}`);
    return p;
  };

  return file.terms.map((t): Term => {
    if (!("combines" in t)) {
      return {
        id: t.id,
        person: getPerson(t.person),
        label: t.label,
        kind: "single",
        parts: [t.id],
        start: t.start,
        end: t.end,
        scheduledEnd: t.scheduledEnd,
        parties: [t.party],
        vices: t.vice ? [t.vice] : [],
        howStarted: t.howStarted,
        howEnded: t.howEnded,
      };
    }
    const parts = t.combines.map((id) => {
      const s = singles.get(id);
      if (!s) throw new Error(`Mandato combinado ${t.id} referencia mandato desconhecido: ${id}`);
      return s;
    });
    for (let i = 1; i < parts.length; i++) {
      if (parts[i - 1].end !== parts[i].start) {
        throw new Error(`Mandatos de ${t.id} não são consecutivos: ${parts[i - 1].id} → ${parts[i].id}`);
      }
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    return {
      id: t.id,
      person: getPerson(t.person),
      label: t.label,
      kind: "combined",
      parts: parts.map((p) => p.id),
      start: first.start,
      end: last.end,
      scheduledEnd: last.scheduledEnd,
      parties: unique(parts.map((p) => p.party)),
      vices: unique(parts.flatMap((p) => (p.vice ? [p.vice] : []))),
      howStarted: first.howStarted,
      howEnded: last.howEnded,
    };
  });
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function termTitle(term: Term): string {
  return term.person.shortName ?? term.person.name;
}

export function termPeriod(term: Term): string {
  const y0 = term.start.slice(0, 4);
  if (!term.end) return `${y0}–atual`;
  // `end` is exclusive: a term ending on 2003-01-01 is shown as "…–2002".
  const endDate = new Date(`${term.end}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  const y1 = String(endDate.getUTCFullYear());
  return y0 === y1 ? y0 : `${y0}–${y1}`;
}
