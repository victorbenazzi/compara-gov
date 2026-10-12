import type { Indicator } from "./indicators";

const SIGNED = new Set(["delta", "change", "realChange", "annualMean", "annualCompound"]);

const formatters = new Map<number, Intl.NumberFormat>();
function nf(decimals: number) {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f;
}

export function formatNumber(value: number, decimals: number): string {
  return nf(decimals).format(value);
}

/** Valor com unidade compacta, pronto para a célula da comparação. */
export function formatValue(indicator: Indicator, value: number): string {
  const rounded = Number(value.toFixed(indicator.decimals));
  const abs = nf(indicator.decimals).format(Math.abs(rounded));
  const sign = rounded < 0 ? "−" : SIGNED.has(indicator.method.kind) && rounded > 0 ? "+" : "";
  switch (indicator.unit) {
    case "R$":
      return `${sign}R$ ${abs}`;
    case "US$ bi":
      return `${sign}US$ ${abs} bi`;
    case "% a.a.":
      return `${sign}${abs}% a.a.`;
    case "p.p.":
    case "p.p. do PIB":
      return `${sign}${abs} p.p.`;
    case "%":
    case "% do PIB":
      return `${sign}${abs}%`;
    default:
      return `${sign}${abs} ${indicator.unit}`;
  }
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}
