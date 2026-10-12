import { asset, cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => p.length > 2 || p === p.toUpperCase());
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

/** Foto da Wikipédia (baixada pelo pipeline) ou iniciais, quando ainda não há foto. */
export function PresidentAvatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-green to-brand-yellow ring-1 ring-border",
        className,
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- site estático, imagem já redimensionada pelo Commons
        <img src={asset(photo)} alt={`Foto de ${name}`} loading="lazy" className="size-full object-cover object-top" />
      ) : (
        <span aria-hidden className="flex size-full items-center justify-center font-semibold text-white">
          {initials(name)}
        </span>
      )}
    </div>
  );
}
