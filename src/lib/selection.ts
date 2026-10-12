export function compareHref(ids: string[]): string {
  return `/comparar/?p=${ids.join(",")}`;
}

/** Lê o parâmetro `p` da URL, descartando ids desconhecidos e repetidos. */
export function parseSelection(param: string | null, known: Set<string>, max: number): string[] {
  if (!param) return [];
  const out: string[] = [];
  for (const id of param.split(",")) {
    const clean = id.trim();
    if (known.has(clean) && !out.includes(clean)) out.push(clean);
  }
  return out.slice(0, max);
}

export const MAX_COMPARE = 10;
