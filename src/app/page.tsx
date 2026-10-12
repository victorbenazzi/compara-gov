import { ShieldCheckIcon, ScaleIcon, DatabaseIcon } from "lucide-react";
import { DataPendingNotice } from "@/components/data-pending-notice";
import { HomePicker } from "@/components/home-picker";
import { hasData, termCards } from "@/lib/data";
import { MAX_COMPARE } from "@/lib/selection";

const PILLARS = [
  { icon: DatabaseIcon, title: "Fontes oficiais", text: "Banco Central (SGS) e IBGE (SIDRA), baixados direto das APIs públicas." },
  { icon: ShieldCheckIcon, title: "Auditável", text: "Cada número mostra a fórmula, os valores usados e o link da consulta original." },
  { icon: ScaleIcon, title: "Regras iguais para todos", text: "Os mesmos critérios de período e cálculo valem para todos os mandatos." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-8 sm:py-14">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <span className="size-1.5 rounded-full bg-primary" /> Dados abertos · código aberto
        </p>
        <h1 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          Compare os governos do Brasil, <span className="text-primary">lado a lado</span>.
        </h1>
        <p className="mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Escolha até {MAX_COMPARE} mandatos e veja inflação, PIB, emprego, juros, câmbio e contas públicas com dados
          históricos oficiais que você mesmo pode conferir.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-xl border bg-card p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!hasData && <DataPendingNotice className="mb-6" />}

      <section aria-labelledby="escolha">
        <h2 id="escolha" className="mb-4 text-lg font-semibold">
          Escolha os mandatos
        </h2>
        <HomePicker cards={termCards} max={MAX_COMPARE} />
      </section>
    </div>
  );
}
