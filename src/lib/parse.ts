import type { Series } from "./series";

/** Converte respostas brutas das APIs oficiais em pares período → valor. */
export function parseRaw(series: Series, body: string): Record<string, number> {
  const json: unknown = JSON.parse(body);
  return series.provider === "bcb-sgs" ? parseSgs(series, json) : parseSidra(json);
}

/** SGS: [{ "data": "01/01/2003", "valor": "2.25" }, ...] */
function parseSgs(series: Series, json: unknown): Record<string, number> {
  if (!Array.isArray(json)) throw new Error(`Resposta inesperada do SGS: ${JSON.stringify(json).slice(0, 200)}`);
  const out: Record<string, number> = {};
  for (const row of json as { data?: string; valor?: string }[]) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(row.data ?? "");
    if (!m) throw new Error(`Data inválida no SGS: ${JSON.stringify(row)}`);
    const value = toNumber(row.valor);
    if (value === null) continue;
    const period = series.frequency === "annual" ? m[3] : `${m[3]}-${m[2]}`;
    out[period] = value;
  }
  return out;
}

/**
 * SIDRA: a primeira linha é o cabeçalho ({ "D3C": "Trimestre Móvel (Código)", ... }),
 * as demais trazem o código do período (AAAAMM) e o valor em "V".
 */
function parseSidra(json: unknown): Record<string, number> {
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error(`Resposta inesperada do SIDRA: ${JSON.stringify(json).slice(0, 200)}`);
  }
  const [header, ...rows] = json as Record<string, string>[];
  const periodKey = Object.keys(header).find((k) =>
    /^(Trimestre Móvel|Mês|Trimestre|Ano) \(Código\)$/.test(header[k] ?? ""),
  );
  if (!periodKey) throw new Error(`Cabeçalho do SIDRA sem coluna de período: ${JSON.stringify(header)}`);
  const out: Record<string, number> = {};
  for (const row of rows) {
    const code = row[periodKey];
    const value = toNumber(row.V);
    if (value === null) continue;
    if (/^\d{6}$/.test(code)) out[`${code.slice(0, 4)}-${code.slice(4)}`] = value;
    else if (/^\d{4}$/.test(code)) out[code] = value;
    else throw new Error(`Período inválido no SIDRA: ${code}`);
  }
  return out;
}

function toNumber(v: unknown): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  // O SIDRA usa "-", "..", "..." e "X" para valores ausentes ou sigilosos.
  if (!/^-?\d+(\.\d+)?$/.test(v.trim())) return null;
  return Number(v);
}
