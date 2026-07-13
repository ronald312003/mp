// ============================================================
//  Tipo de cambio USD -> PEN vía Kambista
//  Regla del negocio: se toma el valor de VENTA del dólar de
//  Kambista y se le SUMA el markup (por defecto 0.10).
// ============================================================

const KAMBISTA_API =
  "https://api.kambista.com/v1/exchange/calculates?originCurrency=USD&destinationCurrency=PEN&amount=1&active=S";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Obtiene el tipo de cambio de venta desde Kambista y le suma el markup.
 * @param {object} [opts]
 * @param {number} [opts.markup] cuánto sumar al valor de venta (default 0.10)
 * @param {number} [opts.fallback] valor a usar si Kambista falla (ya con markup incluido)
 * @returns {Promise<{ rate:number, sell:number, markup:number, source:string, fetchedAt:string }>}
 */
export async function getExchangeRate(opts = {}) {
  const markup = opts.markup ?? Number(process.env.EXCHANGE_MARKUP ?? 0.1);
  const fallback = opts.fallback ?? Number(process.env.EXCHANGE_FALLBACK_PEN ?? 3.51);

  try {
    const res = await fetch(KAMBISTA_API, {
      headers: { "user-agent": UA, accept: "application/json" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store"
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    // Estructura observada: { rate, exchange, tc:{ bid, ask }, ... }
    //   bid = compra, ask = venta.
    const sell = Number(data?.tc?.ask ?? data?.exchange ?? data?.rate);
    if (!sell || Number.isNaN(sell)) throw new Error("respuesta sin valor de venta");

    const rate = round2(sell + markup);
    return {
      rate,
      sell: round4(sell),
      markup,
      source: "kambista",
      fetchedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn("[exchange] Kambista no disponible, usando fallback:", err.message);
    return {
      rate: round2(fallback),
      sell: round4(fallback - markup),
      markup,
      source: "fallback",
      fetchedAt: new Date().toISOString()
    };
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
function round4(n) {
  return Math.round(n * 10000) / 10000;
}
