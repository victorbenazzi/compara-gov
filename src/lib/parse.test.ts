import { describe, expect, it } from "vitest";
import { parseRaw } from "./parse";
import { SERIES } from "./series";

// Fixtures reproduzem o formato das APIs; os valores são ilustrativos.

describe("parseRaw", () => {
  it("lê séries mensais do SGS", () => {
    const body = JSON.stringify([
      { data: "01/01/2003", valor: "2.25" },
      { data: "01/02/2003", valor: "1.57" },
    ]);
    expect(parseRaw(SERIES.ipca, body)).toEqual({ "2003-01": 2.25, "2003-02": 1.57 });
  });

  it("lê séries anuais do SGS pelo ano", () => {
    const body = JSON.stringify([{ data: "01/01/2010", valor: "7.5" }]);
    expect(parseRaw(SERIES.pib, body)).toEqual({ "2010": 7.5 });
  });

  it("rejeita resposta de erro do SGS", () => {
    expect(() => parseRaw(SERIES.ipca, JSON.stringify({ error: "x" }))).toThrow();
  });

  it("lê o SIDRA usando o cabeçalho e ignora valores ausentes", () => {
    const body = JSON.stringify([
      { NC: "Nível Territorial (Código)", V: "Valor", D3C: "Trimestre Móvel (Código)", D3N: "Trimestre Móvel" },
      { NC: "1", V: "8.0", D3C: "201203", D3N: "jan-fev-mar 2012" },
      { NC: "1", V: "...", D3C: "201204", D3N: "fev-mar-abr 2012" },
    ]);
    expect(parseRaw(SERIES.desocupacao, body)).toEqual({ "2012-03": 8 });
  });
});
