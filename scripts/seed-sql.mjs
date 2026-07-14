// ============================================================
//  Generador de SQL de datos (sincronización, NO destructivo).
//
//  Se puede ejecutar en Neon las veces que quieras: refresca los
//  productos SCRAPEADOS (borra los que ya no vienen, inserta/actualiza
//  los nuevos) SIN tocar:
//    - los productos que agregaste a mano en /admin (source = 'admin')
//    - los precios "override" que fijaste a mano (price_override_usd)
//  Requiere haber ejecutado antes db/schema.sql (crea las tablas).
// ============================================================

const sqlStr = (v) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
const sqlNum = (v) => (v === null || v === undefined ? "NULL" : Number(v));
const sqlArr = (a) =>
  a && a.length ? `ARRAY[${a.map(sqlStr).join(", ")}]::text[]` : "NULL";

export function buildSeedSql(catalog) {
  const L = [];
  const ids = catalog.products.map((p) => sqlStr(p.id)).join(", ");

  L.push("-- ============================================================");
  L.push("-- Maison Privée — datos (generado automáticamente)");
  L.push(`-- Generado: ${catalog.generatedAt}`);
  L.push(`-- Productos scrapeados: ${catalog.products.length}`);
  L.push("-- Sincroniza el catálogo SIN borrar lo que creaste en /admin.");
  L.push("-- Ejecutar DESPUÉS de db/schema.sql. Se puede re-ejecutar cuando quieras.");
  L.push("-- ============================================================");
  L.push("");
  L.push("BEGIN;");
  L.push("");

  // Ajustes / tipo de cambio (upsert)
  L.push("-- Ajustes / tipo de cambio");
  const settings = {
    generated_at: catalog.generatedAt,
    exchange_rate: String(catalog.exchange.rate),
    exchange_sell: String(catalog.exchange.sell),
    exchange_markup: String(catalog.exchange.markup),
    exchange_source: catalog.exchange.source,
    exchange_fetched_at: catalog.exchange.fetchedAt
  };
  for (const [k, v] of Object.entries(settings)) {
    L.push(
      `INSERT INTO settings(key, value) VALUES (${sqlStr(k)}, ${sqlStr(v)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`
    );
  }
  L.push("");

  // Colecciones (upsert)
  L.push("-- Colecciones (outfits / estilos / temporadas)");
  catalog.collections.forEach((c, i) => {
    L.push(
      `INSERT INTO collections(slug, title, subtitle, description, kind, hero_image, sort_order) VALUES (` +
        `${sqlStr(c.slug)}, ${sqlStr(c.title)}, ${sqlStr(c.subtitle)}, ${sqlStr(c.description)}, ` +
        `${sqlStr(c.kind)}, ${sqlStr(c.heroImage)}, ${i + 1}) ` +
        `ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, ` +
        `description=EXCLUDED.description, kind=EXCLUDED.kind, hero_image=EXCLUDED.hero_image, sort_order=EXCLUDED.sort_order;`
    );
  });
  L.push("");

  // 1) Eliminar productos SCRAPEADOS que ya no vienen en esta tanda
  //    (no toca los del admin). El cascade limpia sus colecciones.
  L.push("-- 1) Quitar productos scrapeados que ya no existen en el origen");
  L.push(
    `DELETE FROM products WHERE source <> 'admin' AND id <> ALL(ARRAY[${ids}]::text[]);`
  );
  L.push("");

  // 2) Upsert de los productos scrapeados. En conflicto se ACTUALIZA todo
  //    MENOS price_override_usd (se respeta el precio manual del admin).
  L.push("-- 2) Insertar / actualizar productos scrapeados (conserva el override manual)");
  for (const p of catalog.products) {
    L.push(
      `INSERT INTO products(id, source, source_id, name, brand, type, gender, description, image_url, images, source_url, base_price_usd, final_price_usd, styling_note, inspiration_image, reco_ids, reco_note, reco_context, reco_ids_w, reco_note_w, reco_context_w) VALUES (` +
        `${sqlStr(p.id)}, ${sqlStr(p.source)}, ${sqlStr(p.sourceId)}, ${sqlStr(p.name)}, ${sqlStr(p.brand)}, ` +
        `${sqlStr(p.type)}, ${sqlStr(p.gender)}, ${sqlStr(p.description)}, ${sqlStr(p.imageUrl)}, ${sqlArr(p.images)}, ${sqlStr(p.sourceUrl)}, ` +
        `${sqlNum(p.basePriceUsd)}, ${sqlNum(p.finalPriceUsd)}, ${sqlStr(p.stylingNote)}, ${sqlStr(p.inspirationImage)}, ` +
        `${sqlArr(p.recoIds)}, ${sqlStr(p.recoNote)}, ${sqlStr(p.recoContext)}, ` +
        `${sqlArr(p.recoIdsW)}, ${sqlStr(p.recoNoteW)}, ${sqlStr(p.recoContextW)}) ` +
        `ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, brand=EXCLUDED.brand, type=EXCLUDED.type, ` +
        `gender=EXCLUDED.gender, description=EXCLUDED.description, image_url=EXCLUDED.image_url, images=EXCLUDED.images, ` +
        `source_url=EXCLUDED.source_url, base_price_usd=EXCLUDED.base_price_usd, ` +
        `final_price_usd=EXCLUDED.final_price_usd, styling_note=EXCLUDED.styling_note, inspiration_image=EXCLUDED.inspiration_image, ` +
        `reco_ids=EXCLUDED.reco_ids, reco_note=EXCLUDED.reco_note, reco_context=EXCLUDED.reco_context, ` +
        `reco_ids_w=EXCLUDED.reco_ids_w, reco_note_w=EXCLUDED.reco_note_w, reco_context_w=EXCLUDED.reco_context_w;`
    );
  }
  L.push("");

  // 3) Refrescar las colecciones de los productos scrapeados
  L.push("-- 3) Refrescar relación producto <-> colección (solo scrapeados)");
  L.push(
    `DELETE FROM product_collections pc USING products p WHERE pc.product_id = p.id AND p.source <> 'admin';`
  );
  for (const p of catalog.products) {
    for (const slug of p.collections) {
      L.push(
        `INSERT INTO product_collections(product_id, collection_slug) VALUES (${sqlStr(p.id)}, ${sqlStr(slug)}) ON CONFLICT DO NOTHING;`
      );
    }
  }
  L.push("");
  L.push("COMMIT;");
  L.push("");
  return L.join("\n");
}
