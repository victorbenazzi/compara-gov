/**
 * Baixa a foto principal do artigo de cada presidente na Wikipédia em português,
 * com autoria e licença vindas do Wikimedia Commons. Só aceita arquivos do Commons
 * (licença livre); imagens de "uso restrito" hospedadas localmente são ignoradas.
 *
 * Uso: pnpm data:photos
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import presidentsJson from "../data/presidents.json";
import type { PhotoInfo, PhotosFile } from "../src/lib/dataset";
import { presidentsFileSchema } from "../src/lib/presidents";
import { DATA_DIR, ROOT, exists, httpGet, log, readJson, sha256, writeJson } from "./lib/util";

const OUTPUT = path.join(DATA_DIR, "photos.json");
const PHOTO_DIR = path.join(ROOT, "public", "photos");
const WIDTH = 480;

interface PageImageResponse {
  query?: { pages?: { title: string; pageimage?: string; missing?: boolean }[] };
}

interface ImageInfoResponse {
  query?: {
    pages?: {
      missing?: boolean;
      imageinfo?: {
        thumburl?: string;
        url: string;
        descriptionurl: string;
        extmetadata?: Record<string, { value: string } | undefined>;
      }[];
    }[];
  };
}

function api(host: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ action: "query", format: "json", formatversion: "2", ...params });
  return `https://${host}/w/api.php?${qs}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function photoFor(personId: string, article: string): Promise<PhotoInfo> {
  const pageRes = (await (
    await httpGet(api("pt.wikipedia.org", { prop: "pageimages", piprop: "name", titles: article, redirects: "1" }))
  ).json()) as PageImageResponse;
  const file = pageRes.query?.pages?.[0]?.pageimage;
  if (!file) throw new Error(`artigo "${article}" sem imagem principal`);

  const infoRes = (await (
    await httpGet(
      api("commons.wikimedia.org", {
        prop: "imageinfo",
        iiprop: "url|extmetadata",
        iiurlwidth: String(WIDTH),
        titles: `File:${file}`,
      }),
    )
  ).json()) as ImageInfoResponse;
  const page = infoRes.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info || page?.missing) throw new Error(`"${file}" não está no Wikimedia Commons (provavelmente sem licença livre)`);

  const meta = info.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value ?? "");
  if (!license) throw new Error(`"${file}" sem licença declarada no Commons`);

  const imageUrl = info.thumburl ?? info.url;
  const bytes = Buffer.from(await (await httpGet(imageUrl)).arrayBuffer());
  const ext = (path.extname(new URL(imageUrl).pathname) || ".jpg").toLowerCase();
  const name = `${personId}${ext}`;
  await writeFile(path.join(PHOTO_DIR, name), bytes);

  return {
    src: `/photos/${name}`,
    file,
    descriptionUrl: info.descriptionurl,
    sourceUrl: imageUrl,
    artist: stripHtml(meta.Artist?.value ?? meta.Credit?.value ?? "Autor desconhecido"),
    license,
    licenseUrl: meta.LicenseUrl?.value ?? null,
    sha256: sha256(bytes),
    fetchedAt: new Date().toISOString(),
  };
}

async function main() {
  const { people } = presidentsFileSchema.parse(presidentsJson);
  await mkdir(PHOTO_DIR, { recursive: true });
  const current: PhotosFile = (await exists(OUTPUT))
    ? await readJson<PhotosFile>(OUTPUT)
    : { $comment: "", photos: {} };

  let failures = 0;
  for (const person of people) {
    try {
      const photo = await photoFor(person.id, person.wikipedia);
      current.photos[person.id] = photo;
      log(`✓ ${person.name}: ${photo.file} (${photo.license})`);
    } catch (err) {
      failures++;
      log(`✗ ${person.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await writeJson(OUTPUT, {
    $comment:
      "Gerado por `pnpm data:photos`. Fotos da imagem principal de cada artigo da Wikipédia em português, hospedadas no Wikimedia Commons, com autoria e licença.",
    photos: Object.fromEntries(Object.entries(current.photos).sort(([a], [b]) => a.localeCompare(b))),
  } satisfies PhotosFile);
  if (failures) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
