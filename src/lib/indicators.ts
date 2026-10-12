import type { SeriesId } from "./series";

export type Better = "higher" | "lower" | null;

export type Method =
  /** Π(1 + xᵢ/100) − 1 sobre os meses do mandato. */
  | { kind: "compound"; series: SeriesId }
  /** Taxa acumulada convertida para equivalente anual. */
  | { kind: "annualized"; series: SeriesId }
  /** Média geométrica das taxas anuais dos anos atribuídos. */
  | { kind: "annualMean"; series: SeriesId }
  /** Π(1 + xᵢ/100) − 1 sobre os anos atribuídos. */
  | { kind: "annualCompound"; series: SeriesId }
  /** Valor no último mês do mandato. */
  | { kind: "end"; series: SeriesId; scale?: number }
  /** Valor final − valor no mês anterior ao início. */
  | { kind: "delta"; series: SeriesId; scale?: number }
  /** Variação percentual entre o mês anterior ao início e o último mês. */
  | { kind: "change"; series: SeriesId }
  /** Média simples dos valores mensais do mandato. */
  | { kind: "mean"; series: SeriesId }
  /** Variação percentual descontada a inflação acumulada pelo deflator. */
  | { kind: "realChange"; series: SeriesId; deflator: SeriesId };

export type GroupId = "inflacao" | "atividade" | "emprego" | "juros" | "fiscal" | "externo";

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: "inflacao", label: "Inflação" },
  { id: "atividade", label: "Atividade econômica" },
  { id: "emprego", label: "Emprego e renda" },
  { id: "juros", label: "Juros e câmbio" },
  { id: "fiscal", label: "Contas públicas" },
  { id: "externo", label: "Setor externo" },
];

export interface Indicator {
  id: string;
  group: GroupId;
  label: string;
  unit: string;
  decimals: number;
  /** Direção considerada favorável, usada só para o destaque opcional. `null` = sem destaque. */
  better: Better;
  method: Method;
  description: string;
}

export const INDICATORS: Indicator[] = [
  {
    id: "ipca_acumulado",
    group: "inflacao",
    label: "IPCA acumulado no mandato",
    unit: "%",
    decimals: 1,
    better: "lower",
    method: { kind: "compound", series: "ipca" },
    description: "Inflação oficial acumulada nos meses do mandato.",
  },
  {
    id: "ipca_anual",
    group: "inflacao",
    label: "IPCA médio ao ano",
    unit: "% a.a.",
    decimals: 1,
    better: "lower",
    method: { kind: "annualized", series: "ipca" },
    description: "Inflação acumulada convertida em taxa anual equivalente: (1 + acumulado)^(12 / meses) − 1.",
  },
  {
    id: "pib_medio",
    group: "atividade",
    label: "Crescimento médio do PIB",
    unit: "% a.a.",
    decimals: 1,
    better: "higher",
    method: { kind: "annualMean", series: "pib" },
    description:
      "Média geométrica do crescimento real anual do PIB nos anos atribuídos ao mandato (ano conta para quem governou mais da metade dele).",
  },
  {
    id: "pib_acumulado",
    group: "atividade",
    label: "Crescimento acumulado do PIB",
    unit: "%",
    decimals: 1,
    better: "higher",
    method: { kind: "annualCompound", series: "pib" },
    description: "Crescimento real do PIB acumulado nos anos atribuídos ao mandato.",
  },
  {
    id: "desocupacao_fim",
    group: "emprego",
    label: "Desemprego ao fim",
    unit: "%",
    decimals: 1,
    better: "lower",
    method: { kind: "end", series: "desocupacao" },
    description: "Taxa de desocupação (PNAD Contínua) no trimestre móvel encerrado no último mês do mandato.",
  },
  {
    id: "desocupacao_var",
    group: "emprego",
    label: "Variação do desemprego",
    unit: "p.p.",
    decimals: 1,
    better: "lower",
    method: { kind: "delta", series: "desocupacao" },
    description: "Diferença, em pontos percentuais, entre a desocupação ao fim e a herdada no mês anterior à posse.",
  },
  {
    id: "salario_minimo_real",
    group: "emprego",
    label: "Ganho real do salário mínimo",
    unit: "%",
    decimals: 1,
    better: "higher",
    method: { kind: "realChange", series: "salarioMinimo", deflator: "ipca" },
    description: "Variação do salário mínimo descontada a inflação (IPCA) do período.",
  },
  {
    id: "salario_minimo_fim",
    group: "emprego",
    label: "Salário mínimo ao fim",
    unit: "R$",
    decimals: 0,
    better: null,
    method: { kind: "end", series: "salarioMinimo" },
    description: "Valor nominal do salário mínimo no último mês do mandato.",
  },
  {
    id: "selic_fim",
    group: "juros",
    label: "Selic ao fim",
    unit: "% a.a.",
    decimals: 2,
    better: null,
    method: { kind: "end", series: "selic" },
    description: "Taxa Selic efetiva do último mês do mandato, anualizada.",
  },
  {
    id: "selic_media",
    group: "juros",
    label: "Selic média",
    unit: "% a.a.",
    decimals: 2,
    better: null,
    method: { kind: "mean", series: "selic" },
    description: "Média simples da Selic efetiva mensal (anualizada) ao longo do mandato.",
  },
  {
    id: "dolar_fim",
    group: "juros",
    label: "Dólar ao fim",
    unit: "R$",
    decimals: 2,
    better: null,
    method: { kind: "end", series: "dolar" },
    description: "Cotação de venda do dólar no último dia útil do último mês do mandato (valor nominal).",
  },
  {
    id: "dolar_var",
    group: "juros",
    label: "Variação do dólar",
    unit: "%",
    decimals: 1,
    better: null,
    method: { kind: "change", series: "dolar" },
    description: "Variação nominal da cotação do dólar entre o mês anterior à posse e o último mês do mandato.",
  },
  {
    id: "dlsp_fim",
    group: "fiscal",
    label: "Dívida líquida ao fim",
    unit: "% do PIB",
    decimals: 1,
    better: "lower",
    method: { kind: "end", series: "dlsp" },
    description: "Dívida Líquida do Setor Público consolidado no último mês do mandato.",
  },
  {
    id: "dlsp_var",
    group: "fiscal",
    label: "Variação da dívida líquida",
    unit: "p.p. do PIB",
    decimals: 1,
    better: "lower",
    method: { kind: "delta", series: "dlsp" },
    description: "Diferença entre a dívida líquida ao fim e a herdada no mês anterior à posse.",
  },
  {
    id: "dbgg_fim",
    group: "fiscal",
    label: "Dívida bruta ao fim",
    unit: "% do PIB",
    decimals: 1,
    better: "lower",
    method: { kind: "end", series: "dbgg" },
    description: "Dívida Bruta do Governo Geral no último mês do mandato.",
  },
  {
    id: "dbgg_var",
    group: "fiscal",
    label: "Variação da dívida bruta",
    unit: "p.p. do PIB",
    decimals: 1,
    better: "lower",
    method: { kind: "delta", series: "dbgg" },
    description: "Diferença entre a dívida bruta ao fim e a herdada no mês anterior à posse.",
  },
  {
    id: "reservas_fim",
    group: "externo",
    label: "Reservas internacionais ao fim",
    unit: "US$ bi",
    decimals: 1,
    better: "higher",
    method: { kind: "end", series: "reservas", scale: 0.001 },
    description: "Estoque de reservas internacionais no último mês do mandato.",
  },
  {
    id: "reservas_var",
    group: "externo",
    label: "Variação das reservas",
    unit: "US$ bi",
    decimals: 1,
    better: "higher",
    method: { kind: "delta", series: "reservas", scale: 0.001 },
    description: "Diferença entre as reservas ao fim e as herdadas no mês anterior à posse.",
  },
];

export const INDICATORS_BY_ID = new Map(INDICATORS.map((i) => [i.id, i]));

export function methodSeries(method: Method): SeriesId[] {
  return method.kind === "realChange" ? [method.series, method.deflator] : [method.series];
}

export const FORMULAS: Record<Method["kind"], string> = {
  compound: "Π (1 + taxa mensal / 100) − 1",
  annualized: "(1 + acumulado)^(12 / nº de meses) − 1",
  annualMean: "[Π (1 + taxa anual / 100)]^(1 / nº de anos) − 1",
  annualCompound: "Π (1 + taxa anual / 100) − 1",
  end: "valor do último mês do mandato",
  delta: "valor final − valor do mês anterior à posse",
  change: "valor final / valor do mês anterior à posse − 1",
  mean: "soma dos valores mensais / nº de meses",
  realChange: "(valor final / valor inicial) / Π (1 + IPCA mensal / 100) − 1",
};
