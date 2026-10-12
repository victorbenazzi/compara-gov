import Link from "next/link";
import { GithubIcon, Logo } from "@/components/logo";
import { REPO_URL } from "@/lib/site";

const NAV = [
  { href: "/comparar/", label: "Comparar" },
  { href: "/metodologia/", label: "Metodologia" },
  { href: "/fontes/", label: "Fontes" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div aria-hidden className="h-1 bg-gradient-to-r from-brand-green via-brand-yellow to-brand-green" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Página inicial">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:inline-flex"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <GithubIcon />
            <span className="sr-only sm:not-sr-only">Código</span>
          </a>
        </nav>
      </div>
      <nav className="flex border-t text-sm sm:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1 py-2 text-center text-muted-foreground active:bg-accent">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
