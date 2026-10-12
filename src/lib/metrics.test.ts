import { describe, expect, it } from "vitest";
import presidentsJson from "../../data/presidents.json";
import { INDICATORS_BY_ID } from "./indicators";
import { computeIndicator, compound, type ComputeContext, type SeriesStore } from "./metrics";
import { attributedMonths, majorityYears } from "./period";
import { presidentsFileSchema, resolveTerms, termPeriod } from "./presidents";

// Os números abaixo são sintéticos: servem só para testar as fórmulas.

const terms = resolveTerms(presidentsFileSchema.parse(presidentsJson));
const byId = new Map(terms.map((t) => [t.id, t]));
const singles = new Map(terms.filter((t) => t.kind === "single").map((t) => [t.id, t]));
const term = (id: string) => byId.get(id)!;
const indicator = (id: string) => INDICATORS_BY_ID.get(id)!;

function monthly(from: string, to: string, value: (m: string, i: number) => number) {
  const points: Record<string, number> = {};
  const months = attributedMonths(`${from}-01`, null, to);
  months.forEach((m, i) => (points[m] = value(m, i)));
  return { first: from, last: to, points };
}

function ctx(store: SeriesStore, asOf = "2026-10"): ComputeContext {
  return { store, asOf, singles };
}

describe("atribuição de períodos", () => {
  it("posse em 1º de janeiro: janeiro já é do novo governo", () => {
    const months = attributedMonths("2003-01-01", "2007-01-01", "2030-01");
    expect(months[0]).toBe("2003-01");
    expect(months.at(-1)).toBe("2006-12");
    expect(months).toHaveLength(48);
  });

  it("posse no meio do mês: conta a partir do primeiro mês completo", () => {
    expect(attributedMonths("1990-03-15", "1992-10-02", "2030-01")[0]).toBe("1990-04");
    expect(attributedMonths("1990-03-15", "1992-10-02", "2030-01").at(-1)).toBe("1992-10");
    expect(attributedMonths("1992-10-02", "1995-01-01", "2030-01")[0]).toBe("1992-11");
    expect(attributedMonths("2016-05-12", "2019-01-01", "2030-01")[0]).toBe("2016-06");
  });

  it("mandato em curso vai até o mês de referência", () => {
    expect(attributedMonths("2023-01-01", null, "2026-08").at(-1)).toBe("2026-08");
  });

  it("ano vai para quem governou mais da metade dele", () => {
    expect(majorityYears("1990-03-15", "1992-10-02")).toEqual([1990, 1991, 1992]);
    expect(majorityYears("1992-10-02", "1995-01-01")).toEqual([1993, 1994]);
    expect(majorityYears("2015-01-01", "2016-05-12")).toEqual([2015]);
    expect(majorityYears("2016-05-12", "2019-01-01")).toEqual([2016, 2017, 2018]);
  });

  it("todo mês a partir de 1985-04 pertence a exatamente um mandato simples", () => {
    const owners = new Map<string, string[]>();
    for (const t of singles.values()) {
      for (const m of attributedMonths(t.start, t.end, "2026-09")) {
        owners.set(m, [...(owners.get(m) ?? []), t.id]);
      }
    }
    for (const m of attributedMonths("1985-04-01", null, "2026-09")) {
      expect(owners.get(m), m).toHaveLength(1);
    }
  });
});

describe("cadastro", () => {
  it("expande mandatos combinados", () => {
    const fhc = term("fhc-1-2");
    expect(fhc.start).toBe("1995-01-01");
    expect(fhc.end).toBe("2003-01-01");
    expect(fhc.parts).toEqual(["fhc-1", "fhc-2"]);
    expect(termPeriod(fhc)).toBe("1995–2002");
    expect(termPeriod(term("lula-3"))).toBe("2023–atual");
  });
});

describe("fórmulas", () => {
  it("compõe taxas mensais", () => {
    expect(compound([1, 1])).toBeCloseTo(0.0201, 10);
  });

  it("IPCA acumulado e anualizado", () => {
    const store = { ipca: monthly("1980-01", "2026-08", () => 0.5) };
    const acc = computeIndicator(indicator("ipca_acumulado"), term("lula-1"), ctx(store));
    expect(acc.status).toBe("ok");
    expect(acc.value).toBeCloseTo((1.005 ** 48 - 1) * 100, 4);
    expect(acc.inputs[0].points).toHaveLength(48);

    const yearly = computeIndicator(indicator("ipca_anual"), term("lula-1"), ctx(store));
    expect(yearly.value).toBeCloseTo((1.005 ** 12 - 1) * 100, 4);
  });

  it("mandato em curso fica como parcial", () => {
    const store = { ipca: monthly("1980-01", "2026-08", () => 0.5) };
    const r = computeIndicator(indicator("ipca_acumulado"), term("lula-3"), ctx(store));
    expect(r.status).toBe("partial");
    expect(r.inputs[0].points.at(-1)?.[0]).toBe("2026-08");
  });

  it("indicador de fluxo indisponível antes do início da série", () => {
    const store = { selic: monthly("1986-07", "2026-08", () => 10) };
    const r = computeIndicator(indicator("selic_media"), term("sarney"), ctx(store));
    expect(r.status).toBe("unavailable");
  });

  it("variação usa o mês anterior à posse como base", () => {
    const store = { desocupacao: monthly("2012-03", "2026-08", (m) => (m === "2018-12" ? 12 : m === "2022-12" ? 8 : 10)) };
    const r = computeIndicator(indicator("desocupacao_var"), term("bolsonaro"), ctx(store));
    expect(r.value).toBeCloseTo(-4, 10);
    expect(r.inputs[0].points).toEqual([
      ["2018-12", 12],
      ["2022-12", 8],
    ]);
  });

  it("variação sem valor herdado fica indisponível", () => {
    const store = { desocupacao: monthly("2012-03", "2026-08", () => 10) };
    expect(computeIndicator(indicator("desocupacao_var"), term("dilma-1"), ctx(store)).status).toBe("unavailable");
    expect(computeIndicator(indicator("desocupacao_fim"), term("dilma-1"), ctx(store)).status).toBe("ok");
  });

  it("ganho real do salário mínimo desconta o IPCA", () => {
    const store = {
      ipca: monthly("1980-01", "2026-08", () => 1),
      salarioMinimo: monthly("1994-07", "2026-08", (m) => (m < "2003-01" ? 200 : 300)),
    };
    const r = computeIndicator(indicator("salario_minimo_real"), term("lula-1"), ctx(store));
    expect(r.value).toBeCloseTo((300 / 200 / 1.01 ** 48 - 1) * 100, 6);
  });

  it("PIB usa os anos atribuídos, inclusive em mandatos combinados", () => {
    const points: Record<string, number> = {};
    for (let y = 1980; y <= 2025; y++) points[String(y)] = y === 2016 ? -3 : 2;
    const store = { pib: { first: "1980", last: "2025", points } };

    const temer = computeIndicator(indicator("pib_acumulado"), term("temer"), ctx(store));
    expect(temer.inputs[0].points.map(([y]) => y)).toEqual(["2016", "2017", "2018"]);
    expect(temer.value).toBeCloseTo((0.97 * 1.02 * 1.02 - 1) * 100, 6);

    const dilma = computeIndicator(indicator("pib_medio"), term("dilma-1-2"), ctx(store));
    expect(dilma.inputs[0].points.map(([y]) => y)).toEqual(["2011", "2012", "2013", "2014", "2015"]);
    expect(dilma.value).toBeCloseTo(2, 6);

    const lula3 = computeIndicator(indicator("pib_medio"), term("lula-3"), ctx(store));
    expect(lula3.status).toBe("partial");
    expect(lula3.inputs[0].points.map(([y]) => y)).toEqual(["2023", "2024", "2025"]);
  });

  it("série ausente deixa o indicador indisponível", () => {
    const r = computeIndicator(indicator("dolar_fim"), term("fhc-1"), ctx({}));
    expect(r.status).toBe("unavailable");
    expect(r.value).toBeNull();
  });
});
