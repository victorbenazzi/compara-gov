"use client";

import { ArrowRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PresidentAvatar } from "@/components/president-avatar";
import { TermPicker } from "@/components/term-picker";
import { Button } from "@/components/ui/button";
import type { TermCard } from "@/lib/data";
import { compareHref } from "@/lib/selection";

const PRESETS: { label: string; ids: string[] }[] = [
  { label: "Últimos 4 governos", ids: ["dilma-1-2", "temer", "bolsonaro", "lula-3"] },
  { label: "Pós-Plano Real, por mandato", ids: ["fhc-1", "fhc-2", "lula-1", "lula-2", "dilma-1", "dilma-2", "temer", "bolsonaro", "lula-3"] },
  { label: "Nova República completa", ids: ["sarney", "collor", "itamar", "fhc-1-2", "lula-1-2", "dilma-1-2", "temer", "bolsonaro", "lula-3"] },
];

export function HomePicker({ cards, max }: { cards: TermCard[]; max: number }) {
  const [selected, setSelected] = useState<string[]>([]);
  const byId = new Map(cards.map((c) => [c.id, c]));

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= max ? s : [...s, id]));

  return (
    <div className="pb-28">
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none">
        {PRESETS.map((p) => (
          <Button key={p.label} asChild variant="secondary" size="sm" className="rounded-full">
            <Link href={compareHref(p.ids)}>{p.label}</Link>
          </Button>
        ))}
      </div>

      <TermPicker cards={cards} selected={selected} onToggle={toggle} max={max} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground">Escolha de 2 a {max} mandatos para comparar.</p>
            ) : (
              <>
                <div className="flex -space-x-2 overflow-hidden">
                  {selected.slice(0, 5).map((id) => {
                    const c = byId.get(id)!;
                    return <PresidentAvatar key={id} name={c.fullName} photo={c.photo} className="size-8 ring-2 ring-background" />;
                  })}
                </div>
                <span className="text-sm whitespace-nowrap">
                  <strong>{selected.length}</strong>
                  <span className="text-muted-foreground">/{max}</span>
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelected([])} aria-label="Limpar seleção">
                  <XIcon />
                </Button>
              </>
            )}
          </div>
          {selected.length >= 2 ? (
            <Button asChild size="lg">
              <Link href={compareHref(selected)}>
                Comparar <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <Button size="lg" disabled>
              Comparar <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
