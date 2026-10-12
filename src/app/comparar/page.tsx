import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare-view";
import { DataPendingNotice } from "@/components/data-pending-notice";
import { hasData, slimResults, termCards } from "@/lib/data";

export const metadata: Metadata = {
  title: "Comparar",
  description: "Comparação lado a lado de mandatos presidenciais com dados oficiais.",
};

export default function ComparePage() {
  return (
    <>
      {!hasData && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <DataPendingNotice />
        </div>
      )}
      <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">Carregando…</p>}>
        <CompareView cards={termCards} results={slimResults()} />
      </Suspense>
    </>
  );
}
