export interface RawFile {
  /** Caminho relativo a data/raw. */
  path: string;
  /** URL exata consultada. */
  url: string;
  sha256: string;
  bytes: number;
}

export interface Manifest {
  $comment: string;
  series: Record<string, { fetchedAt: string; files: RawFile[] }>;
}

export const MANIFEST_COMMENT =
  "Gerado por `pnpm data:fetch`. Cada arquivo em data/raw é a resposta bruta, byte a byte, da URL oficial indicada. O hash SHA-256 permite verificar que nada foi alterado.";
