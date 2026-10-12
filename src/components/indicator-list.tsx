"use client";

import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { AuditDialog, type AuditTarget } from "@/components/audit-dialog";
import type { SlimResult, TermCard } from "@/lib/data";
import { formatValue } from "@/lib/format";
import { GROUPS, INDICATORS } from "@/lib/indicators";

export function IndicatorList({ card, results }: { card: TermCard; results: Record<string, SlimResult> }) {
  const [audit, setAudit] = useState<AuditTarget | null>(null);
  return (
    <div className="space-y-6">
      {GROUPS.map((g) => (
        <section key={g.id}>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-primary uppercase">{g.label}</h3>
          <ul className="divide-y rounded-xl border bg-card">
            {INDICATORS.filter((i) => i.group === g.id).map((indicator) => {
              const r = results[indicator.id];
              return (
                <li key={indicator.id}>
                  <button
                    type="button"
                    onClick={() => setAudit({ term: card, indicator })}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{indicator.label}</span>
                      {r?.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}
                    </span>
                    <span className="text-right font-semibold tabular-nums">
                      {r?.value == null ? <span className="text-muted-foreground/60">—</span> : formatValue(indicator, r.value)}
                      {r?.status === "partial" && <sup className="ml-0.5 text-xs text-muted-foreground">*</sup>}
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <AuditDialog target={audit} onClose={() => setAudit(null)} />
    </div>
  );
}
