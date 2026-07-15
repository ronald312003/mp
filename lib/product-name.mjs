/**
 * Quita metadatos comerciales del nombre público. En relojería la referencia
 * queda en sourceId/sourceUrl para emparejar medios oficiales, no en la ficha.
 */
export function cleanProductName(value = "", type = "") {
  let name = String(value)
    .trim()
    .replace(/\s+(?:fragrances?\s+)?\d{10,14}\s*$/i, "")
    .replace(/\s+fragrances?\s*$/i, "");
  if (type === "watch") {
    name = name.replace(/\s+[A-Z0-9][A-Z0-9.-]{2,}[A-Z0-9]\s*$/i, (token) =>
      /[a-z]/i.test(token) && /\d/.test(token) ? "" : token
    );
  }
  return name
    .replace(/\s{2,}/g, " ")
    .trim();
}
