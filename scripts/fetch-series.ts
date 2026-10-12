/**
 * Baixa as séries oficiais (Banco Central/SGS e IBGE/SIDRA) e grava as respostas
 * brutas em data/raw, junto com um manifesto (URL + SHA-256 de cada arquivo).
 *
 * Uso: pnpm data:fetch [id-da-série ...]
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { SERIES_LIST, seriesApiUrl, type Series } from "../src/lib/series";
import { MANIFEST_COMMENT, type Manifest, type RawFile } from "./lib/manifest";
import { RAW_DIR, exists, httpGet, log, readJson, sha256, writeJson } from "./lib/util";

const MANIFEST = path.join(RAW_DIR, "manifest.json");

/** A API do SGS limita o intervalo por consulta; baixamos em janelas de 10 anos. */
function windows(series: Series, today: Date): [string, string][] {
  const out: [string, string][] = [];
  const endYear = today.getUTCFullYear();
  const lastMonth = `${endYear}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const startYear = Number(series.from.slice(0, 4));
  for (let y = startYear; y <= endYear; y += 10) {
    const isFirst = y === startYear;
    const from = series.frequency === "annual" ? String(y) : isFirst ? series.from : `${y}-01`;
    const yEnd = Math.min(y + 9, endYear);
    const to = series.frequency === "annual" ? String(yEnd) : yEnd === endYear ? lastMonth : `${yEnd}-12`;
    out.push([from, to]);
  }
  return out;
}

async function fetchSeries(series: Series): Promise<RawFile[]> {
  const ranges: [string, string][] =
    series.provider === "bcb-sgs" ? windows(series, new Date()) : [[series.from, "all"]];

  // Baixa tudo antes de tocar no disco: uma falha no meio não deixa a série pela metade.
  const downloads: { name: string; url: string; body: string }[] = [];
  for (const [from, to] of ranges) {
    const url =
      series.provider === "ibge-sidra"
        ? `https://apisidra.ibge.gov.br/values/t/${series.table}/n1/all/v/${series.variable}/p/all`
        : seriesApiUrl(series, from, to);
    log(`  ↓ ${url}`);
    const body = await (await httpGet(url)).text();
    downloads.push({ name: `${from}_${to}.json`, url, body });
  }

  const dir = path.join(RAW_DIR, series.id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const files: RawFile[] = [];
  for (const { name, url, body } of downloads) {
    await writeFile(path.join(dir, name), body);
    files.push({ path: `${series.id}/${name}`, url, sha256: sha256(body), bytes: Buffer.byteLength(body) });
  }
  return files;
}

async function main() {
  const only = process.argv.slice(2);
  const targets = only.length ? SERIES_LIST.filter((s) => only.includes(s.id)) : SERIES_LIST;
  if (only.length && targets.length !== only.length) {
    throw new Error(`Série desconhecida. Disponíveis: ${SERIES_LIST.map((s) => s.id).join(", ")}`);
  }

  const manifest: Manifest = (await exists(MANIFEST))
    ? await readJson<Manifest>(MANIFEST)
    : { $comment: MANIFEST_COMMENT, series: {} };

  const failures: string[] = [];
  for (const series of targets) {
    log(`• ${series.id} — ${series.name}`);
    try {
      const files = await fetchSeries(series);
      manifest.series[series.id] = { fetchedAt: new Date().toISOString(), files };
    } catch (err) {
      failures.push(`${series.id}: ${err instanceof Error ? err.message : String(err)}`);
      log(`  ✗ falhou: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  manifest.$comment = MANIFEST_COMMENT;
  manifest.series = Object.fromEntries(Object.entries(manifest.series).sort(([a], [b]) => a.localeCompare(b)));
  await writeJson(MANIFEST, manifest);

  if (failures.length) {
    log(`\n${failures.length} série(s) com falha:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    log("\nTodas as séries baixadas.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
