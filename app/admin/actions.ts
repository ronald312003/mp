"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  SESSION_COOKIE,
  createSessionValue,
  isValidSession,
  verifyPassword,
  cookieMaxAge
} from "@/lib/auth";
import { createProduct, updateProduct, deleteProduct, type ProductInput } from "@/lib/admin-db";
import { invalidateCatalog } from "@/lib/data";
import type { Gender, ProductType } from "@/lib/types";

const COLLECTION_SLUGS = [
  "lujo-silencioso",
  "elegante",
  "casual",
  "oficina",
  "noche",
  "verano",
  "invierno",
  "deportivo"
];

async function assertAdmin() {
  const value = cookies().get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(value))) {
    throw new Error("No autorizado");
  }
}

function parseForm(form: FormData): ProductInput {
  const collections = COLLECTION_SLUGS.filter((s) => form.get(`col_${s}`) === "on");
  const base = Number(form.get("basePriceUsd"));
  const overrideRaw = String(form.get("priceOverrideUsd") ?? "").trim();
  const override = overrideRaw ? Number(overrideRaw) : NaN;
  return {
    name: String(form.get("name") ?? "").trim(),
    brand: String(form.get("brand") ?? "").trim(),
    type: (String(form.get("type") ?? "watch") as ProductType),
    gender: (String(form.get("gender") ?? "unisex") as Gender),
    description: (String(form.get("description") ?? "").trim() || null),
    imageUrl: String(form.get("imageUrl") ?? "").trim(),
    sourceUrl: (String(form.get("sourceUrl") ?? "").trim() || null),
    basePriceUsd: Number.isFinite(base) ? base : 0,
    priceOverrideUsd: Number.isFinite(override) && override > 0 ? override : null,
    collections
  };
}

function validate(input: ProductInput): string | null {
  if (!input.name) return "El nombre es obligatorio.";
  if (!input.brand) return "La marca es obligatoria.";
  if (!(input.basePriceUsd > 0)) return "El precio base debe ser mayor a 0.";
  // La imagen es opcional: si falta, se busca automáticamente al guardar.
  return null;
}

function refresh() {
  invalidateCatalog();
  revalidatePath("/");
  revalidatePath("/tienda");
  revalidatePath("/admin");
}

// ---------- AUTH ----------
export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin") || "/admin";
  if (!verifyPassword(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  cookies().set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieMaxAge
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---------- CRUD ----------
export async function createProductAction(formData: FormData) {
  await assertAdmin();
  const input = parseForm(formData);
  const err = validate(input);
  if (err) redirect(`/admin/products/new?error=${encodeURIComponent(err)}`);
  await createProduct(input);
  refresh();
  redirect("/admin?ok=creado");
}

export async function updateProductAction(id: string, formData: FormData) {
  await assertAdmin();
  const input = parseForm(formData);
  const err = validate(input);
  if (err) redirect(`/admin/products/${id}/edit?error=${encodeURIComponent(err)}`);
  await updateProduct(id, input);
  refresh();
  redirect("/admin?ok=actualizado");
}

export async function deleteProductAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteProduct(id);
    refresh();
  }
  redirect("/admin?ok=eliminado");
}
