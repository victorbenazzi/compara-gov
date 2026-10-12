import { CheckIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { dataset, photos, terms } from "@/lib/data";
import { formatDateTime, formatNumber } from "@/lib/format";
import { formatMonth } from "@/lib/period";
import { REPO_URL } from "@/lib/site";
import { SERIES_LIST, seriesSourceLabel, type SeriesId } from "@/lib/series";

export const metadata: Metadata = {
  title: "Fontes",
  description: "Séries oficiais usadas, estado da coleta, conferências e créditos das fotos.",
};

const STATUS = {
  ok: { label: "conferida", variant: "default" },
  rejected: { label: "rejeitada", variant: "outline" },
  missing: { label: "não baixada", variant: "muted" },
} as const;

export default function SourcesPage() {
  const people = [...new Map(terms.map((t) => [t.person.id, t.person])).values()];
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fontes</h1>
        <p className="text-muted-foreground">
          {dataset.generatedAt
            ? `Coleta mais recente: ${formatDateTime(dataset.generatedAt)}.`
            : "Os dados ainda não foram coletados. Rode `pnpm data:update` para baixá-los das fontes oficiais."}{" "}
          Os arquivos brutos ficam em{" "}
          <a href={`${REPO_URL}/tree/main/data/raw`} className="text-primary underline underline-offset-4">
            data/raw
          </a>{" "}
          com o hash SHA-256 de cada um.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Séries</h2>
        {SERIES_LIST.map((s) => {
          const info = dataset.sources[s.id as SeriesId];
          const status = STATUS[info?.status ?? "missing"];
          return (
            <article key={s.id} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {seriesSourceLabel(s)} · {s.unit} · {s.producer}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              {s.note && <p className="text-sm text-muted-foreground">{s.note}</p>}
              {info?.first && info.last && (
                <p className="text-sm">
                  {info.count} observações, de {formatMonth(info.first)} a {formatMonth(info.last)}.
                </p>
              )}
              {info?.problem && <p className="rounded-lg bg-muted p-3 text-sm">{info.problem}</p>}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Conferência com valores de referência</p>
                <ul className="space-y-1 text-sm">
                  {(info?.anchors.length ? info.anchors : s.anchors.map((a) => ({ ...a, actual: null, ok: null }))).map((a) => (
                    <li key={a.date} className="flex gap-2">
                      {a.ok === true && <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />}
                      {a.ok === false && <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" />}
                      {a.ok === null && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                      <span>
                        {a.reference}
                        {a.actual !== null && (
                          <span className="text-muted-foreground"> — obtido: {formatNumber(a.actual, 2)}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {info && info.files.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    {info.files.length} arquivo(s) bruto(s)
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {info.files.map((f) => (
                      <li key={f.path} className="space-y-0.5 break-all">
                        <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                          {f.path} <ExternalLinkIcon className="size-3 shrink-0" />
                        </a>
                        <p className="font-mono text-[11px] text-muted-foreground">sha256 {f.sha256}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <a href={s.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                Consultar no site da fonte <ExternalLinkIcon className="size-3.5" />
              </a>
            </article>
          );
        })}
      </section>

      <section id="fotos" className="scroll-mt-28 space-y-4">
        <h2 className="text-lg font-semibold">Fotos</h2>
        <p className="text-sm text-muted-foreground">
          Imagem principal do artigo de cada presidente na Wikipédia em português, hospedada no Wikimedia Commons. Só são
          usados arquivos com licença livre declarada.
        </p>
        <ul className="divide-y rounded-xl border bg-card text-sm">
          {people.map((p) => {
            const photo = photos[p.id];
            return (
              <li key={p.id} className="space-y-0.5 p-4">
                <p className="font-medium">{p.fullName}</p>
                {photo ? (
                  <p className="text-muted-foreground">
                    {photo.artist} · {photo.license} ·{" "}
                    <a href={photo.descriptionUrl} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                      {photo.file}
                    </a>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Ainda não baixada ·{" "}
                    <a href={`https://pt.wikipedia.org/wiki/${p.wikipedia}`} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                      artigo na Wikipédia
                    </a>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
