import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const DATA_DIR = path.join(ROOT, "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");

export const USER_AGENT =
  "compara-gov/0.1 (+https://github.com/victorbenazzi/compara-gov; projeto open source de dados públicos)";

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + "\n");
}

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function exists(file: string): Promise<boolean> {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
}

/** GET com timeout e novas tentativas (backoff exponencial). */
export async function httpGet(url: string, { attempts = 4, timeoutMs = 60_000 } = {}): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json, */*" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return res;
      // 4xx (exceto 429) não melhora com nova tentativa.
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`HTTP ${res.status} em ${url}: ${(await res.text()).slice(0, 300)}`);
      }
      lastError = new Error(`HTTP ${res.status} em ${url}`);
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.message.startsWith("HTTP 4")) throw err;
    }
    await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
  }
  throw lastError;
}

export function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}
