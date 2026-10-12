import Link from "next/link";
import { dataset } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { REPO_URL } from "@/lib/site";
import { asset } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-3">
        <div className="space-y-2">
          <p className="font-medium text-foreground">Projeto open source</p>
          <p>
            Código sob licença MIT. Dados de domínio público do Banco Central e do IBGE. Fotos do Wikimedia Commons, com
            autoria e licença em <Link href="/fontes/#fotos" className="underline underline-offset-4">Fontes</Link>.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">Dados</p>
          <p>
            {dataset.generatedAt
              ? `Coletados das fontes oficiais em ${formatDateTime(dataset.generatedAt)}.`
              : "Ainda não coletados das fontes oficiais."}
          </p>
          <p>
            <a href={asset("/dados/indicadores.json")} className="underline underline-offset-4">
              Baixar todos os indicadores (JSON)
            </a>
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">Encontrou um erro?</p>
          <p>
            Todo número pode ser conferido e recalculado.{" "}
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Abra uma issue
            </a>{" "}
            com a fonte.
          </p>
        </div>
      </div>
    </footer>
  );
}
