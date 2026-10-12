import type { Metadata } from "next";
import Link from "next/link";
import { FORMULAS, GROUPS, INDICATORS } from "@/lib/indicators";
import { REPO_URL } from "@/lib/site";
import { SERIES, seriesSourceLabel } from "@/lib/series";

export const metadata: Metadata = {
  title: "Metodologia",
  description: "Como os indicadores de cada mandato são calculados.",
};

export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-8 text-[15px] leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Metodologia</h1>
        <p className="text-muted-foreground">
          O objetivo é que qualquer pessoa consiga reproduzir cada número do site. Por isso as regras são fixas, iguais
          para todos os mandatos, e o código que aplica essas regras é aberto.
        </p>
      </header>

      <Section title="1. De onde vêm os dados">
        <p>
          Todas as séries são baixadas diretamente das APIs públicas do Banco Central (Sistema Gerenciador de Séries
          Temporais – SGS) e do IBGE (SIDRA). As respostas brutas são guardadas no repositório, byte a byte, com o
          hash SHA-256 de cada arquivo. Nenhum valor é digitado à mão.
        </p>
        <p>
          Depois de baixar, o pipeline confere cada série contra valores de referência amplamente divulgados
          (&quot;âncoras&quot;). Se algum não bater — por exemplo, por código de série errado ou mudança de unidade —
          a série é rejeitada e os indicadores que dependem dela aparecem como indisponíveis.
        </p>
      </Section>

      <Section title="2. Quais meses e anos contam para cada mandato">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Datas:</strong> usamos o exercício efetivo do cargo, incluindo interinidades. Ex.: Itamar Franco a
            partir de 02/10/1992 e Michel Temer a partir de 12/05/2016.
          </li>
          <li>
            <strong>Dados mensais:</strong> um mês pertence a quem estava no cargo no dia 1º daquele mês. Para posses em
            1º de janeiro, janeiro já conta para o novo governo; para posses no meio do mês, conta a partir do primeiro
            mês completo.
          </li>
          <li>
            <strong>Dados anuais (PIB):</strong> o ano pertence a quem governou mais da metade dos dias dele. Ex.: 2016
            conta para Temer; 1992, para Collor.
          </li>
          <li>
            <strong>Valor herdado:</strong> variações (dívida, desemprego, dólar, reservas, salário mínimo) comparam o
            último mês do mandato com o mês imediatamente anterior ao primeiro mês atribuído.
          </li>
          <li>
            <strong>Mandato em curso:</strong> usa os dados publicados até a coleta mais recente e aparece marcado com
            asterisco (parcial).
          </li>
          <li>
            <strong>Governo completo:</strong> mandatos consecutivos da mesma pessoa podem ser comparados juntos (ex.:
            FHC 1995–2002); os cálculos são feitos sobre o período inteiro, não pela média dos mandatos.
          </li>
          <li>
            <strong>Antes do Plano Real:</strong> séries em moeda corrente (dólar, salário mínimo) só são usadas a partir
            de julho de 1994, por causa das trocas de moeda.
          </li>
        </ul>
      </Section>

      <Section title="3. Indicadores">
        {GROUPS.map((g) => (
          <div key={g.id} className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-primary uppercase">{g.label}</h3>
            <ul className="divide-y rounded-xl border bg-card">
              {INDICATORS.filter((i) => i.group === g.id).map((i) => {
                const s = SERIES[i.method.series];
                return (
                  <li key={i.id} className="space-y-1 p-4">
                    <p className="font-medium">{i.label}</p>
                    <p className="text-sm text-muted-foreground">{i.description}</p>
                    <p className="font-mono text-xs">{FORMULAS[i.method.kind]}</p>
                    <p className="text-xs text-muted-foreground">
                      {seriesSourceLabel(s)}
                      {i.method.kind === "realChange" && ` + ${seriesSourceLabel(SERIES[i.method.deflator])}`}
                      {i.better && ` · destaque para o ${i.better === "lower" ? "menor" : "maior"} valor`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="4. Limites e neutralidade">
        <p>
          Indicadores econômicos são afetados pelo cenário internacional, por decisões de governos anteriores, pelo
          Congresso, pelo Banco Central e por choques como pandemias e crises financeiras. Eles descrevem o que aconteceu
          durante cada mandato — não atribuem causa nem medem sozinhos a qualidade de um governo.
        </p>
        <p>
          O destaque de &quot;melhor valor&quot; é opcional e só existe para indicadores em que a direção desejável é
          consensual (ex.: menos inflação, mais crescimento). Juros e câmbio não recebem destaque.
        </p>
      </Section>

      <Section title="5. Como auditar">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Toque em qualquer valor na comparação para ver a fórmula, os valores usados e o link da consulta oficial.</li>
          <li>
            Clone o{" "}
            <a href={REPO_URL} className="text-primary underline underline-offset-4">
              repositório
            </a>{" "}
            e rode <code className="font-mono text-sm">pnpm data:verify</code>: os indicadores são recalculados a partir
            dos arquivos brutos e comparados com os publicados.
          </li>
          <li>
            Rode <code className="font-mono text-sm">pnpm data:update</code> para baixar tudo de novo das fontes oficiais.
          </li>
          <li>
            Veja hashes, âncoras e status de cada série em <Link href="/fontes/" className="text-primary underline underline-offset-4">Fontes</Link>.
          </li>
        </ol>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
