// Formateo de precios + re-export tipado de la conversión USD->PEN.
// Importa desde pricing.mjs con extensión explícita para evitar
// ambigüedad de resolución con otros módulos.
// @ts-ignore — módulo .mjs sin tipos
import { usdToPen as _usdToPen } from "./pricing.mjs";

export const usdToPen: (usd: number, penRate: number) => number = _usdToPen;

/** Formatea un monto USD para mostrar: $1,234.99 */
export function fmtUsd(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formatea un monto PEN para mostrar: S/ 1,234.56 */
export function fmtPen(n: number): string {
  return "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
