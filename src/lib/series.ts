/**
 * Catálogo das séries oficiais usadas pelo projeto.
 *
 * Cada série traz "âncoras": valores amplamente divulgados que o pipeline confere
 * depois de baixar os dados. Se uma âncora não bater, a série é rejeitada — isso
 * protege contra código de série errado, mudança de unidade ou resposta corrompida.
 */

export type Frequency = "monthly" | "annual";

export interface Anchor {
  /** "AAAA-MM" para séries mensais, "AAAA" para anuais. */
  date: string;
  min: number;
  max: number;
  reference: string;
}

interface BaseSeries {
  id: string;
  name: string;
  unit: string;
  frequency: Frequency;
  /** Instituição que produz o dado. */
  producer: string;
  /** Primeiro período a baixar. */
  from: string;
  /** Página pública onde qualquer pessoa pode consultar a série. */
  publicUrl: string;
  /** Observação metodológica exibida na interface. */
  note?: string;
  anchors: Anchor[];
}

export interface BcbSgsSeries extends BaseSeries {
  provider: "bcb-sgs";
  code: number;
}

export interface IbgeSidraSeries extends BaseSeries {
  provider: "ibge-sidra";
  table: number;
  variable: number;
}

export type Series = BcbSgsSeries | IbgeSidraSeries;

const SGS_PUBLIC = "https://www3.bcb.gov.br/sgspub/localizarseries/localizarSeries.do?method=prepararTelaLocalizarSeries";

export const SERIES = {
  ipca: {
    id: "ipca",
    provider: "bcb-sgs",
    code: 433,
    name: "IPCA – variação mensal",
    unit: "% no mês",
    frequency: "monthly",
    producer: "IBGE (publicado pelo Banco Central no SGS)",
    from: "1980-01",
    publicUrl: SGS_PUBLIC,
    anchors: [
      { date: "2003-01", min: 2.24, max: 2.26, reference: "IPCA de janeiro/2003: 2,25% (IBGE)" },
      { date: "2015-12", min: 0.95, max: 0.97, reference: "IPCA de dezembro/2015: 0,96% (IBGE)" },
    ],
  },
  pib: {
    id: "pib",
    provider: "bcb-sgs",
    code: 7326,
    name: "PIB – taxa de variação real no ano",
    unit: "% no ano",
    frequency: "annual",
    producer: "IBGE – Contas Nacionais (publicado pelo Banco Central no SGS)",
    from: "1980",
    publicUrl: SGS_PUBLIC,
    note: "Valores sujeitos a revisão pelo IBGE nas Contas Nacionais.",
    anchors: [
      { date: "2010", min: 7.0, max: 7.7, reference: "PIB 2010: +7,5% (IBGE)" },
      { date: "2020", min: -4.5, max: -3.0, reference: "PIB 2020: −3,3% (IBGE, revisado)" },
    ],
  },
  selic: {
    id: "selic",
    provider: "bcb-sgs",
    code: 4189,
    name: "Selic acumulada no mês, anualizada (base 252)",
    unit: "% ao ano",
    frequency: "monthly",
    producer: "Banco Central do Brasil",
    from: "1986-07",
    publicUrl: SGS_PUBLIC,
    anchors: [
      { date: "2002-12", min: 22, max: 26, reference: "Meta Selic em dez/2002: 25% a.a. (Copom)" },
      { date: "2021-01", min: 1.8, max: 2.2, reference: "Meta Selic em jan/2021: 2% a.a. (Copom)" },
    ],
  },
  dolar: {
    id: "dolar",
    provider: "bcb-sgs",
    code: 3696,
    name: "Dólar americano (venda) – câmbio livre – fim de período",
    unit: "R$/US$",
    frequency: "monthly",
    producer: "Banco Central do Brasil",
    from: "1994-07",
    publicUrl: SGS_PUBLIC,
    note: "Valores nominais. Usado apenas a partir do Plano Real (jul/1994).",
    anchors: [
      { date: "2002-12", min: 3.4, max: 3.7, reference: "PTAX venda em 31/12/2002: R$ 3,53" },
      { date: "2020-12", min: 5.1, max: 5.3, reference: "PTAX venda em 31/12/2020: R$ 5,20" },
    ],
  },
  salarioMinimo: {
    id: "salarioMinimo",
    provider: "bcb-sgs",
    code: 1619,
    name: "Salário mínimo",
    unit: "R$",
    frequency: "monthly",
    producer: "Governo Federal (publicado pelo Banco Central no SGS)",
    from: "1994-07",
    publicUrl: SGS_PUBLIC,
    note: "Valores nominais. Usado apenas a partir do Plano Real (jul/1994).",
    anchors: [
      { date: "2003-05", min: 240, max: 240, reference: "Salário mínimo a partir de abr/2003: R$ 240" },
      { date: "2023-01", min: 1302, max: 1302, reference: "Salário mínimo em jan/2023: R$ 1.302" },
    ],
  },
  desocupacao: {
    id: "desocupacao",
    // A mesma série está no SIDRA (tabela 6381, variável 4099), mas a API do IBGE
    // recusa conexões dos servidores do GitHub Actions; o SGS a republica.
    provider: "bcb-sgs",
    code: 24369,
    name: "Taxa de desocupação – PNAD Contínua (trimestre móvel)",
    unit: "%",
    frequency: "monthly",
    producer: "IBGE – PNAD Contínua (publicado pelo Banco Central no SGS)",
    from: "2012-03",
    publicUrl: "https://sidra.ibge.gov.br/tabela/6381",
    note: "Série iniciada em 2012. Cada mês representa o trimestre móvel encerrado nele.",
    anchors: [
      { date: "2024-12", min: 6.1, max: 6.3, reference: "Desocupação no trimestre out–dez/2024: 6,2% (IBGE)" },
      { date: "2021-03", min: 14.5, max: 15.0, reference: "Desocupação no trimestre jan–mar/2021: 14,7%–14,9% (IBGE)" },
    ],
  },
  dlsp: {
    id: "dlsp",
    provider: "bcb-sgs",
    code: 4513,
    name: "Dívida Líquida do Setor Público – setor público consolidado",
    unit: "% do PIB",
    frequency: "monthly",
    producer: "Banco Central do Brasil – Estatísticas Fiscais",
    from: "2001-12",
    publicUrl: SGS_PUBLIC,
    anchors: [{ date: "2002-12", min: 50, max: 65, reference: "DLSP em dez/2002: cerca de 60% do PIB (BCB)" }],
  },
  dbgg: {
    id: "dbgg",
    provider: "bcb-sgs",
    code: 13762,
    name: "Dívida Bruta do Governo Geral",
    unit: "% do PIB",
    frequency: "monthly",
    producer: "Banco Central do Brasil – Estatísticas Fiscais",
    from: "2006-12",
    publicUrl: SGS_PUBLIC,
    note: "Metodologia vigente a partir de 2008, com série retroativa a dez/2006.",
    anchors: [{ date: "2022-12", min: 68, max: 78, reference: "DBGG em dez/2022: cerca de 72% do PIB (BCB)" }],
  },
  reservas: {
    id: "reservas",
    provider: "bcb-sgs",
    code: 3546,
    name: "Reservas internacionais – total (conceito liquidez)",
    unit: "US$ milhões",
    frequency: "monthly",
    producer: "Banco Central do Brasil",
    from: "1985-01",
    publicUrl: SGS_PUBLIC,
    anchors: [{ date: "2010-12", min: 250000, max: 320000, reference: "Reservas em dez/2010: cerca de US$ 289 bilhões (BCB)" }],
  },
} as const satisfies Record<string, Series>;

export type SeriesId = keyof typeof SERIES;
export const SERIES_LIST: Series[] = Object.values(SERIES);

/** URL da API oficial com o recorte exato de datas (para auditoria). */
export function seriesApiUrl(series: Series, from: string, to: string): string {
  if (series.provider === "bcb-sgs") {
    return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series.code}/dados?formato=json&dataInicial=${toBcbDate(from, "start")}&dataFinal=${toBcbDate(to, "end")}`;
  }
  const p = (d: string) => d.replace("-", "");
  return `https://apisidra.ibge.gov.br/values/t/${series.table}/n1/all/v/${series.variable}/p/${p(from)}-${p(to)}`;
}

export function seriesSourceLabel(series: Series): string {
  return series.provider === "bcb-sgs"
    ? `Banco Central – SGS, série ${series.code}`
    : `IBGE – SIDRA, tabela ${series.table}, variável ${series.variable}`;
}

/** "2003-01" → "01/01/2003"; "2003" → "01/01/2003" (ou 31/12 para o fim). */
export function toBcbDate(period: string, edge: "start" | "end"): string {
  const [y, m] = period.split("-");
  if (!m) return edge === "start" ? `01/01/${y}` : `31/12/${y}`;
  if (edge === "start") return `01/${m}/${y}`;
  const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
  return `${String(last).padStart(2, "0")}/${m}/${y}`;
}
