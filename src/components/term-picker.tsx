"use client";

import { CheckIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PresidentAvatar } from "@/components/president-avatar";
import { Input } from "@/components/ui/input";
import type { TermCard } from "@/lib/data";
import { cn } from "@/lib/utils";

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Lista de presidentes com os mandatos como "chips" selecionáveis. */
export function TermPicker({
  cards,
  selected,
  onToggle,
  max,
}: {
  cards: TermCard[];
  selected: string[];
  onToggle: (id: string) => void;
  max: number;
}) {
  const [query, setQuery] = useState("");
  const full = selected.length >= max;

  const people = useMemo(() => {
    const groups = new Map<string, TermCard[]>();
    for (const c of cards) groups.set(c.personId, [...(groups.get(c.personId) ?? []), c]);
    // Dentro de cada pessoa: mandatos em ordem e, por último, o governo completo.
    for (const list of groups.values()) list.sort((a, b) => Number(a.kind === "combined") - Number(b.kind === "combined"));
    const q = normalize(query.trim());
    return [...groups.values()].filter(
      (terms) =>
        !q ||
        terms.some((t) => normalize(`${t.name} ${t.fullName} ${t.parties.join(" ")} ${t.period}`).includes(q)),
    );
  }, [cards, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, partido ou ano"
          aria-label="Buscar presidente"
          className="pl-9"
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {people.map((terms) => {
          const head = terms[0];
          const anySelected = terms.some((t) => selected.includes(t.id));
          return (
            <li
              key={head.personId}
              className={cn(
                "rounded-xl border bg-card p-3 transition-colors",
                anySelected && "border-primary/50 bg-accent/40",
              )}
            >
              <div className="flex items-center gap-3">
                <PresidentAvatar name={head.fullName} photo={head.photo} className="size-12" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{head.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{head.fullName}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {terms.map((t) => {
                  const on = selected.includes(t.id);
                  const disabled = !on && full;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onToggle(t.id)}
                      disabled={disabled}
                      aria-pressed={on}
                      title={disabled ? `Máximo de ${max} na comparação` : undefined}
                      className={cn(
                        "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-left text-xs transition-colors",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:border-primary/60 hover:bg-accent",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {on && <CheckIcon className="size-3.5" />}
                      <span className="font-medium">{t.period}</span>
                      {(t.kind === "combined" || t.label.includes("mandato")) && (
                        <span className={cn("opacity-70", on && "opacity-90")}>
                          · {t.kind === "combined" ? "completo" : t.label}
                        </span>
                      )}
                      {t.ongoing && (
                        <span className={cn("opacity-70", on && "opacity-90")}>· em curso</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {people.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum resultado.</p>}
    </div>
  );
}
