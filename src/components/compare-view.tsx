"use client";

import { InfoIcon, PencilIcon, Share2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AuditDialog, type AuditTarget } from "@/components/audit-dialog";
import { PresidentAvatar } from "@/components/president-avatar";
import { TermPicker } from "@/components/term-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { SlimResult, SlimResults, TermCard } from "@/lib/data";
import { formatValue } from "@/lib/format";
import { GROUPS, INDICATORS, type Indicator } from "@/lib/indicators";
import { MAX_COMPARE, compareHref, parseSelection } from "@/lib/selection";
import { cn } from "@/lib/utils";

/** Ids com o melhor valor da linha, segundo a direção declarada do indicador. */
function bestIds(indicator: Indicator, cells: [string, SlimResult][]): Set<string> {
  if (!indicator.better) return new Set();
  const valid = cells.filter(([, r]) => r.value !== null) as [string, SlimResult & { value: number }][];
  if (valid.length < 2) return new Set();
  const rounded = valid.map(([id, r]) => [id, Number(r.value.toFixed(indicator.decimals))] as const);
  const target =
    indicator.better === "higher" ? Math.max(...rounded.map(([, v]) => v)) : Math.min(...rounded.map(([, v]) => v));
  return new Set(rounded.filter(([, v]) => v === target).map(([id]) => id));
}

export function CompareView({ cards, results }: { cards: TermCard[]; results: SlimResults }) {
  const router = useRouter();
  const params = useSearchParams();
  const known = useMemo(() => new Set(cards.map((c) => c.id)), [cards]);
  const selected = parseSelection(params.get("p"), known, MAX_COMPARE);
  const columns = cards.filter((c) => selected.includes(c.id));

  const [highlight, setHighlight] = useState(true);
  const [editing, setEditing] = useState(false);
  const [audit, setAudit] = useState<AuditTarget | null>(null);
  const [openInfo, setOpenInfo] = useState<string | null>(null);

  const setSelection = useCallback(
    (ids: string[]) => router.replace(compareHref(ids), { scroll: false }),
    [router],
  );
  const toggle = (id: string) =>
    setSelection(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id].slice(0, MAX_COMPARE));

  // Cabeçalho fixo e corpo rolam juntos na horizontal.
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const sync = (from: "head" | "body") => {
    if (syncing.current) {
      syncing.current = false;
      return;
    }
    const src = from === "head" ? headRef.current : bodyRef.current;
    const dst = from === "head" ? bodyRef.current : headRef.current;
    if (src && dst && dst.scrollLeft !== src.scrollLeft) {
      syncing.current = true;
      dst.scrollLeft = src.scrollLeft;
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "Comparação de governos – ComparaGov", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado");
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  const n = columns.length;
  const width = { width: `max(100%, calc(${n} * var(--col-w)))` };
  const grid = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <div className="[--col-w:9.75rem] sm:[--col-w:12rem]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Comparação</h1>
          <p className="text-sm text-muted-foreground">
            {n === 0 ? "Nenhum mandato selecionado" : `${n} de até ${MAX_COMPARE} mandatos · toque em um valor para ver o cálculo`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="mr-1 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={highlight} onCheckedChange={setHighlight} aria-label="Destacar melhor valor" />
            <span className="hidden sm:inline">Destacar melhor</span>
            <span className="sm:hidden">Destaque</span>
          </label>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon /> Editar
          </Button>
          {n > 0 && (
            <Button variant="outline" size="icon-sm" onClick={share} aria-label="Compartilhar comparação">
              <Share2Icon />
            </Button>
          )}
        </div>
      </div>

      {n === 0 ? (
        <div className="mx-auto max-w-6xl px-4">
          <TermPicker cards={cards} selected={selected} onToggle={toggle} max={MAX_COMPARE} />
        </div>
      ) : (
        <div className="mx-auto max-w-6xl sm:px-4">
          {/* Cabeçalho com fotos, fixo ao rolar a página */}
          <div className="sticky top-[calc(3.75rem+2.25rem)] z-20 border-y bg-background/95 backdrop-blur sm:top-[3.75rem] sm:rounded-t-xl sm:border-x">
            <div ref={headRef} onScroll={() => sync("head")} className="overflow-x-auto scrollbar-none">
              <div className="grid" style={{ ...width, ...grid }}>
                {columns.map((c) => (
                  <div key={c.id} className="relative flex flex-col items-center gap-1 border-r px-2 py-2 text-center last:border-r-0 sm:gap-1.5 sm:py-3">
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="absolute top-1.5 right-1.5 cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Remover ${c.name} ${c.period}`}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                    <Link href={`/presidente/${c.id}/`} className="flex flex-col items-center gap-1 sm:gap-1.5">
                      <PresidentAvatar name={c.fullName} photo={c.photo} className="size-10 sm:size-16" />
                      <span className="line-clamp-1 text-sm leading-tight font-semibold">{c.name}</span>
                    </Link>
                    <span className="text-xs leading-tight text-muted-foreground">
                      {c.period}
                      {c.kind === "combined" && " · completo"}
                    </span>
                    <span className="hidden flex-wrap justify-center gap-1 sm:flex">
                      {c.parties.map((p) => (
                        <Badge key={p} variant="muted" className="px-1.5 text-[10px]">
                          {p}
                        </Badge>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Corpo: grupos de indicadores, uma linha de rótulo + uma linha de valores */}
          <div ref={bodyRef} onScroll={() => sync("body")} className="overflow-x-auto overscroll-x-contain border-b sm:rounded-b-xl sm:border-x">
            <div style={width}>
              {GROUPS.map((group) => (
                <section key={group.id}>
                  <h2 className="sticky left-0 w-fit bg-background px-4 pt-6 pb-2 text-xs font-semibold tracking-wider text-primary uppercase">
                    {group.label}
                  </h2>
                  {INDICATORS.filter((i) => i.group === group.id).map((indicator) => {
                    const cells = columns.map((c) => [c.id, results[c.id]?.[indicator.id]] as [string, SlimResult]);
                    const best = highlight ? bestIds(indicator, cells) : new Set<string>();
                    const infoOpen = openInfo === indicator.id;
                    return (
                      <div key={indicator.id} className="border-t">
                        <div className="sticky left-0 w-fit max-w-[calc(100vw-1rem)] px-4 pt-2.5">
                          <button
                            type="button"
                            onClick={() => setOpenInfo(infoOpen ? null : indicator.id)}
                            className="flex cursor-pointer items-center gap-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
                            aria-expanded={infoOpen}
                          >
                            <span>{indicator.label}</span>
                            <InfoIcon className="size-3.5 shrink-0 opacity-60" />
                          </button>
                          {infoOpen && (
                            <p className="mt-1 max-w-prose text-xs text-muted-foreground">
                              {indicator.description}
                              {indicator.better && (
                                <> Destaque: {indicator.better === "lower" ? "menor" : "maior"} valor.</>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="grid" style={grid}>
                          {cells.map(([id, r]) => (
                            <ValueCell
                              key={id}
                              indicator={indicator}
                              result={r}
                              best={best.has(id)}
                              onClick={() => setAudit({ term: columns.find((c) => c.id === id)!, indicator })}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>

          <p className="px-4 pt-4 text-xs leading-relaxed text-muted-foreground sm:px-0">
            Indicadores econômicos refletem também o cenário internacional, a herança recebida e choques fora do controle
            do governo; não medem sozinhos a qualidade de uma gestão. O destaque marca apenas o maior ou menor número da
            linha. Valores marcados com * são parciais (mandato em curso ou dados ainda não publicados).
          </p>
        </div>
      )}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escolher mandatos</DialogTitle>
            <DialogDescription>
              {selected.length}/{MAX_COMPARE} selecionados. As alterações já valem para a comparação.
            </DialogDescription>
          </DialogHeader>
          <TermPicker cards={cards} selected={selected} onToggle={toggle} max={MAX_COMPARE} />
          <Button onClick={() => setEditing(false)} className="sticky bottom-0">
            Ver comparação
          </Button>
        </DialogContent>
      </Dialog>

      <AuditDialog target={audit} onClose={() => setAudit(null)} />
    </div>
  );
}

/** Motivo resumido para a célula; o texto completo aparece no detalhe do cálculo. */
function shortReason(note: string | undefined): string {
  const since = note && /a partir de ([a-z]{3}\/\d{4}|\d{4})/.exec(note);
  if (since) return `série desde ${since[1]}`;
  if (note?.startsWith("Dados ainda não baixados")) return "aguardando coleta";
  if (note?.startsWith("Série indisponível") || note?.startsWith("Série do deflator")) return "série indisponível";
  return "sem dado";
}

function ValueCell({
  indicator,
  result,
  best,
  onClick,
}: {
  indicator: Indicator;
  result: SlimResult | undefined;
  best: boolean;
  onClick: () => void;
}) {
  const value = result?.value ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-14 cursor-pointer flex-col items-center justify-center border-r px-2 pt-1 pb-3 text-center last:border-r-0",
        "transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none",
      )}
      title={result?.note}
    >
      {value === null ? (
        <span className="text-base text-muted-foreground/60">—</span>
      ) : (
        <span
          className={cn(
            "rounded-md px-1.5 text-base font-semibold tabular-nums sm:text-lg",
            best && "bg-brand-yellow/50 text-accent-foreground ring-1 ring-brand-yellow",
          )}
        >
          {formatValue(indicator, value)}
          {result?.status === "partial" && <sup className="ml-0.5 text-xs text-muted-foreground">*</sup>}
        </span>
      )}
      {value === null && <span className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{shortReason(result?.note)}</span>}
    </button>
  );
}
