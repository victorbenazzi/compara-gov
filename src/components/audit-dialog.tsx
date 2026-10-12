"use client";

import { CalculatorIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Dataset } from "@/lib/dataset";
import { FORMULAS, type Indicator } from "@/lib/indicators";
import type { TermCard } from "@/lib/data";
import { formatNumber, formatValue } from "@/lib/format";
import type { MetricResult } from "@/lib/metrics";
import { formatMonth } from "@/lib/period";
import { SERIES, seriesApiUrl, seriesSourceLabel, type SeriesId } from "@/lib/series";
import { asset } from "@/lib/utils";

let datasetPromise: Promise<Dataset> | null = null;
function loadDataset(): Promise<Dataset> {
  datasetPromise ??= fetch(asset("/dados/indicadores.json")).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<Dataset>;
  });
  datasetPromise.catch(() => (datasetPromise = null));
  return datasetPromise;
}

export interface AuditTarget {
  term: TermCard;
  indicator: Indicator;
}

/** "Como chegamos a este número": fórmula, séries, período, valores e link para a API oficial. */
export function AuditDialog({ target, onClose }: { target: AuditTarget | null; onClose: () => void }) {
  // Guarda o resultado junto com a chave do alvo; ao trocar de alvo, o anterior é ignorado.
  const key = target ? `${target.term.id}/${target.indicator.id}` : null;
  const [loaded, setLoaded] = useState<{ key: string; result: MetricResult | null; error: boolean } | null>(null);

  useEffect(() => {
    if (!target || !key) return;
    let alive = true;
    loadDataset()
      .then((d) => alive && setLoaded({ key, result: d.results[target.term.id]?.[target.indicator.id] ?? null, error: false }))
      .catch(() => alive && setLoaded({ key, result: null, error: true }));
    return () => {
      alive = false;
    };
  }, [target, key]);

  const current = loaded?.key === key ? loaded : null;
  const result = current?.result ?? null;
  const error = current?.error ?? false;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target && (
          <>
            <DialogHeader>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                {target.term.name} · {target.term.period}
              </p>
              <DialogTitle>{target.indicator.label}</DialogTitle>
              <DialogDescription>{target.indicator.description}</DialogDescription>
            </DialogHeader>

            {error && <p className="text-sm text-destructive">Não foi possível carregar os dados de auditoria.</p>}
            {!current && <p className="text-sm text-muted-foreground">Carregando…</p>}
            {result && <AuditBody indicator={target.indicator} result={result} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AuditBody({ indicator, result }: { indicator: Indicator; result: MetricResult }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums">
          {result.value === null ? "—" : formatValue(indicator, result.value)}
        </span>
        {result.status === "partial" && <Badge variant="secondary">parcial</Badge>}
        {result.status === "unavailable" && <Badge variant="muted">indisponível</Badge>}
      </div>
      {result.note && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{result.note}</p>}

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <CalculatorIcon className="size-4 text-primary" /> Fórmula
        </h3>
        <code className="block rounded-lg border bg-muted/50 p-3 font-mono text-xs">{FORMULAS[indicator.method.kind]}</code>
      </section>

      {result.inputs.map((input) => (
        <InputTable key={input.series} seriesId={input.series} points={input.points} />
      ))}

      <p className="text-xs text-muted-foreground">
        Regras de atribuição de meses e anos a cada mandato na{" "}
        <Link href="/metodologia/" className="underline underline-offset-4">
          metodologia
        </Link>
        . Arquivos brutos e hashes em{" "}
        <Link href="/fontes/" className="underline underline-offset-4">
          fontes
        </Link>
        .
      </p>
    </div>
  );
}

function InputTable({ seriesId, points }: { seriesId: SeriesId; points: [string, number][] }) {
  const series = SERIES[seriesId];
  const from = points[0]?.[0];
  const to = points[points.length - 1]?.[0];
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-medium">{series.name}</h3>
        <p className="text-xs text-muted-foreground">
          {seriesSourceLabel(series)} · {series.unit} · produzido por {series.producer}
        </p>
      </div>
      {from && to && (
        <a
          href={seriesApiUrl(series, from, to)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Conferir na API oficial ({formatMonth(from)}
          {from !== to ? ` a ${formatMonth(to)}` : ""}) <ExternalLinkIcon className="size-3.5" />
        </a>
      )}
      <div className="max-h-56 overflow-y-auto rounded-lg border">
        <table className="w-full text-sm tabular-nums">
          <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Período</th>
              <th className="px-3 py-1.5 text-right font-medium">Valor ({series.unit})</th>
            </tr>
          </thead>
          <tbody>
            {points.map(([p, v]) => (
              <tr key={p} className="border-t">
                <td className="px-3 py-1">{formatMonth(p)}</td>
                <td className="px-3 py-1 text-right">{formatNumber(v, decimalsOf(v))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{points.length} valor(es) usados no cálculo.</p>
    </section>
  );
}

function decimalsOf(v: number): number {
  const s = String(v);
  const i = s.indexOf(".");
  return i === -1 ? 0 : Math.min(s.length - i - 1, 6);
}
