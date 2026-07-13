// ============================================================
//  Autenticación de administrador (sin dependencias externas).
//  Cookie de sesión firmada con HMAC-SHA256 usando ADMIN_SESSION_SECRET.
//  Funciona tanto en runtime Node como en Edge (middleware).
// ============================================================

export const SESSION_COOKIE = "mp_admin";
const SESSION_DAYS = 7;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "maison-privee-dev-secret";
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Crea el valor de cookie de sesión (exp.firma). */
export async function createSessionValue(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const sig = await hmac(`admin:${exp}`);
  return `${exp}.${sig}`;
}

/** Valida un valor de cookie de sesión. */
export async function isValidSession(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(`admin:${exp}`);
  return safeEqual(sig, expected);
}

/** Verifica la contraseña de administrador contra ADMIN_PASSWORD. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export const cookieMaxAge = SESSION_DAYS * 86400;
