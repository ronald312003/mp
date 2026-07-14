import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Los scripts Node no reciben automáticamente las variables que Next.js carga
// desde .env.local. Node >=20.12 ofrece un cargador nativo que no sobrescribe
// variables ya exportadas en el proceso.
if (typeof process.loadEnvFile === "function") {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    process.loadEnvFile(resolve(root, ".env.local"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
