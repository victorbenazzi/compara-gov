import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DataPendingNotice({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-xl border border-brand-yellow bg-secondary p-4 text-sm", className)}>
      <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-secondary-foreground" />
      <div className="space-y-1 text-secondary-foreground">
        <p className="font-medium">Os dados ainda não foram coletados nesta versão do site.</p>
        <p>
          Os números vêm só das APIs oficiais — nada é digitado à mão. Rode <code className="font-mono">pnpm data:update</code>{" "}
          ou aguarde a rotina automática do repositório. Veja o estado de cada série em{" "}
          <Link href="/fontes/" className="underline underline-offset-4">
            Fontes
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
