import { dataset } from "@/lib/data";

export const dynamic = "force-static";

/** Todos os indicadores, com os dados de entrada de cada cálculo. */
export function GET() {
  return Response.json(dataset);
}
