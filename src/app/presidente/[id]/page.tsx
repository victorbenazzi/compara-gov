import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IndicatorList } from "@/components/indicator-list";
import { PresidentAvatar } from "@/components/president-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { photos, slimResults, termCards, terms, termsById, toCard } from "@/lib/data";
import { daysBetween, formatDate } from "@/lib/period";
import { compareHref } from "@/lib/selection";

export const dynamicParams = false;

export function generateStaticParams() {
  return terms.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/presidente/[id]">): Promise<Metadata> {
  const term = termsById.get((await params).id);
  if (!term) return {};
  const card = toCard(term);
  return { title: `${card.name} (${card.period})`, description: `Indicadores oficiais do mandato de ${term.person.fullName}.` };
}

export default async function PresidentPage({ params }: PageProps<"/presidente/[id]">) {
  const term = termsById.get((await params).id);
  if (!term) notFound();
  const card = toCard(term);
  const photo = photos[term.person.id];
  const siblings = terms.filter((t) => t.person.id === term.person.id && t.id !== term.id);
  const endLabel = term.end ? formatDate(term.end) : term.scheduledEnd ? `em curso (previsto até ${formatDate(term.scheduledEnd)})` : "em curso";
  const today = new Date().toISOString().slice(0, 10);

  const facts: [string, string][] = [
    ["Período no cargo", `${formatDate(term.start)} – ${endLabel}`],
    ["Dias no cargo", new Intl.NumberFormat("pt-BR").format(daysBetween(term.start, term.end ?? today)) + (term.end ? "" : ` (até ${formatDate(today)})`)],
    [term.parties.length > 1 ? "Partidos" : "Partido", term.parties.join(", ")],
    [term.vices.length > 1 ? "Vices" : "Vice", term.vices.length ? term.vices.join(", ") : "—"],
    ["Como assumiu", term.howStarted],
    ["Como terminou", term.howEnded],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4 sm:gap-6">
        <PresidentAvatar name={term.person.fullName} photo={card.photo} className="size-24 sm:size-32" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">{card.period}{term.kind === "combined" && " · governo completo"}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{card.name}</h1>
          <p className="text-sm text-muted-foreground">{term.person.fullName}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {term.label !== card.period && <Badge variant="secondary">{term.label}</Badge>}
            {term.parties.map((p) => (
              <Badge key={p} variant="outline">{p}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={compareHref([term.id])}>
            Comparar com outros <ArrowRightIcon />
          </Link>
        </Button>
        {siblings.map((s) => (
          <Button key={s.id} asChild variant="outline">
            <Link href={`/presidente/${s.id}/`}>{toCard(s).period}{s.kind === "combined" ? " · completo" : ""}</Link>
          </Button>
        ))}
      </div>

      <dl className="mt-8 divide-y rounded-xl border bg-card">
        {facts.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Indicadores</h2>
      <IndicatorList card={card} results={slimResults()[term.id] ?? {}} />

      <p className="mt-8 text-xs text-muted-foreground">
        {photo ? (
          <>
            Foto: {photo.artist} ·{" "}
            {photo.licenseUrl ? (
              <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.license}</a>
            ) : (
              photo.license
            )}{" "}
            ·{" "}
            <a href={photo.descriptionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
              Wikimedia Commons <ExternalLinkIcon className="size-3" />
            </a>
          </>
        ) : (
          <>
            Foto ainda não baixada. Fonte prevista:{" "}
            <a href={`https://pt.wikipedia.org/wiki/${term.person.wikipedia}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Wikipédia
            </a>
            .
          </>
        )}
      </p>
      <p className="sr-only">{termCards.length} mandatos disponíveis para comparação.</p>
    </div>
  );
}
