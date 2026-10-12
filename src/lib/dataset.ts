import type { MetricResult } from "./metrics";
import type { SeriesId } from "./series";

export interface AnchorCheck {
  date: string;
  min: number;
  max: number;
  reference: string;
  actual: number | null;
  ok: boolean;
}

export interface SourceInfo {
  /** ok = baixada e conferida; rejected = falhou na conferência; missing = ainda não baixada. */
  status: "ok" | "rejected" | "missing";
  fetchedAt: string | null;
  first: string | null;
  last: string | null;
  count: number;
  files: { path: string; url: string; sha256: string }[];
  anchors: AnchorCheck[];
  problem?: string;
}

/** Conteúdo de data/indicators.json, gerado por `pnpm data:build`. */
export interface Dataset {
  $comment: string;
  schemaVersion: 1;
  /** Data da coleta mais recente (null = dados ainda não baixados). */
  generatedAt: string | null;
  /** Mês de referência para mandatos em curso. */
  asOf: string | null;
  sources: Record<SeriesId, SourceInfo>;
  results: Record<string, Record<string, MetricResult>>;
}

export interface PhotoInfo {
  /** Caminho público do arquivo baixado (ex.: /photos/lula.jpg). */
  src: string;
  file: string;
  descriptionUrl: string;
  sourceUrl: string;
  artist: string;
  license: string;
  licenseUrl: string | null;
  sha256: string;
  fetchedAt: string;
}

export type PhotosFile = { $comment: string; photos: Record<string, PhotoInfo> };
