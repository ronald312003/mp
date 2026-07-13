// ============================================================
//  Reglas de margen de Maison Privée (compartidas app + scraper)
//  .mjs para poder importarlas tanto desde Node (scripts) como
//  desde el runtime de Next mediante lib/pricing.ts (re-export).
// ============================================================

/**
 * Calcula el sobreprecio (markup) en USD que se suma al precio base,
 * según la regla del negocio:
 *
 *   - base < 200            -> +63 fijo
 *   - 200 <= base <= 800    -> interpolación lineal de 85 (en 200) a 225 (en 800)
 *                              "mientras más se acerca a 800, más cerca de ~225"
 *   - base > 800            -> +225 (se mantiene el máximo; NO se filtra el producto)
 *
 * @param {number} baseUsd precio base en dólares
 * @returns {number} sobreprecio en dólares
 */
export function surchargeUsd(baseUsd) {
  const p = Number(baseUsd) || 0;
  if (p <= 0) return 0;
  if (p < 200) return 63;
  if (p <= 800) {
    // 85 en 200  ->  225 en 800  (lineal)
    const t = (p - 200) / (800 - 200); // 0..1
    return 85 + t * (225 - 85);
  }
  return 225;
}

/**
 * Precio final de venta en USD (base + markup), redondeado a .99 para
 * dar aspecto de tienda.
 * @param {number} baseUsd
 * @returns {number}
 */
export function finalPriceUsd(baseUsd) {
  const raw = (Number(baseUsd) || 0) + surchargeUsd(baseUsd);
  if (raw <= 0) return 0;
  // redondeo a entero y terminación .99 elegante (p. ej. 213 -> 212.99)
  return Math.round(raw) - 0.01;
}

/**
 * Convierte USD a PEN usando el tipo de cambio (venta Kambista + markup).
 * @param {number} usd
 * @param {number} penRate soles por dólar
 * @returns {number} monto en soles, 2 decimales
 */
export function usdToPen(usd, penRate) {
  const v = (Number(usd) || 0) * (Number(penRate) || 0);
  return Math.round(v * 100) / 100;
}
