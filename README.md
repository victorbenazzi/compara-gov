# ComparaGov

Compare lado a lado os governos dos presidentes do Brasil, no estilo "comparar smartphones", com **dados históricos oficiais, verificáveis e auditáveis**.

- Até **10 mandatos** ao mesmo tempo, de Sarney (1985) ao mandato atual.
- Cada mandato separado (ex.: Lula 1º, 2º e 3º) ou o **governo completo** (ex.: FHC 1995–2002).
- **Mobile first**, tema claro verde e amarelo, minimalista, com [shadcn/ui](https://ui.shadcn.com) e [Next.js](https://nextjs.org).
- Fotos dos presidentes vindas da **Wikipédia / Wikimedia Commons**, com autoria e licença.
- Site 100% estático: pode ser hospedado em qualquer lugar (Vercel, GitHub Pages, Netlify…).

## Indicadores

| Grupo | Indicador | Fonte |
|---|---|---|
| Inflação | IPCA acumulado no mandato; IPCA médio ao ano | IBGE, via Banco Central (SGS 433) |
| Atividade | Crescimento médio e acumulado do PIB | IBGE, via Banco Central (SGS 7326) |
| Emprego e renda | Desemprego ao fim e variação | IBGE – PNAD Contínua (SIDRA 6381) |
| Emprego e renda | Ganho real e valor do salário mínimo | Banco Central (SGS 1619) + IPCA |
| Juros e câmbio | Selic ao fim e média | Banco Central (SGS 4189) |
| Juros e câmbio | Dólar ao fim e variação | Banco Central (SGS 3696) |
| Contas públicas | Dívida líquida (DLSP) e bruta (DBGG), em % do PIB | Banco Central (SGS 4513 e 13762) |
| Setor externo | Reservas internacionais | Banco Central (SGS 3546) |

As regras de cálculo (quais meses e anos contam para cada mandato, como tratar posses no meio do mês, interinidades, mandatos em curso etc.) estão na página **/metodologia** do site e em [`src/lib/period.ts`](src/lib/period.ts) e [`src/lib/metrics.ts`](src/lib/metrics.ts).

## Como os dados são auditáveis

```
APIs oficiais ──► data/raw/ (respostas brutas + SHA-256) ──► data/indicators.json ──► site
   (BCB, IBGE)        pnpm data:fetch                         pnpm data:build
```

1. **Nada é digitado à mão.** `pnpm data:fetch` baixa as séries das APIs do Banco Central (SGS) e do IBGE (SIDRA) e grava cada resposta, byte a byte, em `data/raw/`, com a URL consultada e o hash SHA-256 em `data/raw/manifest.json`.
2. **Conferência automática.** Cada série é checada contra valores de referência amplamente divulgados ("âncoras", em [`src/lib/series.ts`](src/lib/series.ts)). Se não bater, a série é rejeitada e aparece como tal no site — isso pega código de série errado, mudança de unidade ou resposta corrompida.
3. **Recálculo offline.** `pnpm data:build` recalcula tudo a partir de `data/raw/`, sem internet. `pnpm data:verify` (roda no CI) garante que os números publicados batem com esse recálculo.
4. **No site,** toque em qualquer valor para ver a fórmula, os valores de entrada e o link para a consulta exata na API oficial.
5. **Histórico público.** A action [`Atualizar dados`](.github/workflows/update-data.yml) roda toda semana; o log mostra cada URL consultada e o commit mostra exatamente o que mudou.

## Rodando localmente

Requisitos: Node 22+ e pnpm 10+.

```bash
pnpm install
pnpm data:update   # baixa séries e fotos das fontes oficiais e recalcula (requer internet)
pnpm dev           # http://localhost:3000
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `pnpm data:fetch [série…]` | Baixa as séries oficiais para `data/raw/` |
| `pnpm data:photos` | Baixa as fotos da Wikipédia para `public/photos/` e os créditos para `data/photos.json` |
| `pnpm data:build` | Recalcula `data/indicators.json` a partir de `data/raw/` (offline) |
| `pnpm data:verify` | Confere se os arquivos versionados batem com o recálculo |
| `pnpm test` | Testes das regras de atribuição e das fórmulas |
| `pnpm build` | Gera o site estático em `out/` |

Para publicar em um subcaminho (ex.: GitHub Pages), defina `NEXT_PUBLIC_BASE_PATH=/compara-gov` no build. Há uma action manual em [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Estrutura

```
data/
  presidents.json      cadastro curado: pessoas, mandatos, datas, partidos, vices
  raw/                 respostas brutas das APIs + manifest.json (gerado)
  series/              séries normalizadas (gerado)
  indicators.json      todos os indicadores, com os dados de entrada (gerado)
  photos.json          créditos das fotos (gerado)
scripts/               pipeline de dados (fetch-series, fetch-photos, build-data)
src/lib/               regras e cálculos compartilhados por pipeline e site
src/app/               páginas (Next.js App Router, export estático)
src/components/        componentes (shadcn/ui + Radix)
```

## Contribuindo

Correções e novos indicadores são bem-vindos. Para um novo indicador:

1. Adicione a série em `src/lib/series.ts`, com pelo menos uma âncora verificável.
2. Declare o indicador em `src/lib/indicators.ts` (os métodos de cálculo já existentes cobrem a maioria dos casos).
3. Rode `pnpm data:fetch <série> && pnpm data:build && pnpm test`.

Para corrigir datas, partidos ou vices, edite `data/presidents.json` citando a fonte no PR.

## Neutralidade

Indicadores econômicos refletem também o cenário internacional, a herança recebida e decisões de outros Poderes. O site descreve o que aconteceu durante cada mandato, com as mesmas regras para todos; não atribui causas nem mede sozinho a qualidade de um governo.

## Licença

Código sob [MIT](LICENSE). Dados do Banco Central e do IBGE são públicos. Cada foto mantém a licença indicada no Wikimedia Commons.
