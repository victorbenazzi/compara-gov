/**
 * Recalcula todos os indicadores a partir das respostas brutas em data/raw.
 * Não acessa a internet: qualquer pessoa pode rodar e conferir o resultado.
 *
 * Uso: pnpm data:build            → grava data/indicators.json e data/series/*.json
 *      pnpm data:build --check    → só confere se os arquivos versionados estão em dia
 *      pnpm data:build --strict   → falha se alguma série for rejeitada na conferência
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import presidentsJson from "../data/presidents.json";
import type { AnchorCheck, Dataset, SourceInfo } from "../src/lib/dataset";
import { INDICATORS } from "../src/lib/indicators";
import { computeIndicator, type SeriesData, type SeriesStore } from "../src/lib/metrics";
import { parseRaw } from "../src/lib/parse";
import { presidentsFileSchema, resolveTerms } from "../src/lib/presidents";
import { SERIES_LIST, type SeriesId } from "../src/lib/series";
import type { Manifest } from "./lib/manifest";
import { DATA_DIR, RAW_DIR, exists, log, readJson, sha256, writeJson } from "./lib/util";

const OUTPUT = path.join(DATA_DIR, "indicators.json");

async function loadSeries(manifest: Manifest | null) {
  const store: SeriesStore = {};
  const sources = {} as Record<SeriesId, SourceInfo>;

  for (const series of SERIES_LIST) {
    const id = series.id as SeriesId;
    const entry = manifest?.series[id];
    const info: SourceInfo = {
      status: "missing",
      fetchedAt: entry?.fetchedAt ?? null,
      first: null,
      last: null,
      count: 0,
      files: entry?.files.map(({ path, url, sha256 }) => ({ path, url, sha256 })) ?? [],
      anchors: [],
    };
    sources[id] = info;
    if (!entry) continue;

    try {
      const points: Record<string, number> = {};
      for (const file of entry.files) {
        const body = await readFile(path.join(RAW_DIR, file.path), "utf8");
        if (sha256(body) !== file.sha256) {
          throw new Error(`hash de ${file.path} não confere com o manifesto (arquivo alterado?)`);
        }
        for (const [k, v] of Object.entries(parseRaw(series, body))) {
          if (k >= series.from) points[k] = v;
        }
      }
      const keys = Object.keys(points).sort();
      if (keys.length === 0) throw new Error("nenhum valor na resposta");

      const anchors: AnchorCheck[] = series.anchors.map((a) => {
        const actual = points[a.date] ?? null;
        return { ...a, actual, ok: actual !== null && actual >= a.min && actual <= a.max };
      });
      Object.assign(info, { first: keys[0], last: keys[keys.length - 1], count: keys.length, anchors });

      const failed = anchors.filter((a) => !a.ok);
      if (failed.length) {
        info.status = "rejected";
        info.problem = `Conferência falhou: ${failed
          .map((a) => `${a.date} = ${a.actual ?? "sem dado"} (esperado entre ${a.min} e ${a.max})`)
          .join("; ")}`;
        continue;
      }
      info.status = "ok";
      store[id] = { first: keys[0], last: keys[keys.length - 1], points: Object.fromEntries(keys.map((k) => [k, points[k]])) };
    } catch (err) {
      info.status = "rejected";
      info.problem = err instanceof Error ? err.message : String(err);
    }
  }
  return { store, sources };
}

async function main() {
  const check = process.argv.includes("--check");
  const manifestPath = path.join(RAW_DIR, "manifest.json");
  const manifest = (await exists(manifestPath)) ? await readJson<Manifest>(manifestPath) : null;

  const terms = resolveTerms(presidentsFileSchema.parse(presidentsJson));
  const singles = new Map(terms.filter((t) => t.kind === "single").map((t) => [t.id, t]));
  const { store, sources } = await loadSeries(manifest);

  // Referência determinística: a data da coleta mais recente, não o relógio de quem roda.
  const fetchedDates = Object.values(sources)
    .map((s) => s.fetchedAt)
    .filter((d): d is string => d !== null)
    .sort();
  const generatedAt = fetchedDates.at(-1) ?? null;
  const asOf = generatedAt ? generatedAt.slice(0, 7) : null;

  const results: Dataset["results"] = {};
  for (const term of terms) {
    results[term.id] = {};
    for (const indicator of INDICATORS) {
      results[term.id][indicator.id] = asOf
        ? computeIndicator(indicator, term, { store, asOf, singles })
        : { status: "unavailable", value: null, note: "Dados ainda não baixados das fontes oficiais.", inputs: [] };
    }
  }

  const dataset: Dataset = {
    $comment:
      "Gerado por `pnpm data:build` a partir de data/raw. Não edite à mão: rode o pipeline e confira com `pnpm data:verify`.",
    schemaVersion: 1,
    generatedAt,
    asOf,
    sources,
    results,
  };

  const seriesFiles: [string, SeriesData][] = Object.entries(store).map(([id, data]) => [
    path.join(DATA_DIR, "series", `${id}.json`),
    data as SeriesData,
  ]);

  if (check) {
    const stale: string[] = [];
    const same = async (file: string, value: unknown) =>
      (await exists(file)) && (await readFile(file, "utf8")) === JSON.stringify(value, null, 2) + "\n";
    if (!(await same(OUTPUT, dataset))) stale.push(path.relative(DATA_DIR, OUTPUT));
    for (const [file, data] of seriesFiles) if (!(await same(file, data))) stale.push(path.relative(DATA_DIR, file));
    if (stale.length) {
      log(`Arquivos desatualizados em relação a data/raw: ${stale.join(", ")}. Rode \`pnpm data:build\`.`);
      process.exit(1);
    }
    log("OK: indicadores versionados batem com o recálculo a partir dos dados brutos.");
  } else {
    await writeJson(OUTPUT, dataset);
    for (const [file, data] of seriesFiles) await writeJson(file, data);
    log(`Gravado ${path.relative(process.cwd(), OUTPUT)}`);
  }

  for (const [id, s] of Object.entries(sources)) {
    const mark = s.status === "ok" ? "✓" : s.status === "missing" ? "·" : "✗";
    log(`  ${mark} ${id.padEnd(14)} ${s.status.padEnd(9)} ${s.first ?? ""}${s.last ? `…${s.last}` : ""} ${s.problem ?? ""}`);
  }
  // Séries rejeitadas ficam fora dos cálculos e aparecem como tal no site.
  // Com --strict, isso também derruba o processo (útil para revisar mudanças no catálogo).
  if (process.argv.includes("--strict") && Object.values(sources).some((s) => s.status === "rejected")) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
