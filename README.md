# Maison Privée

Tienda de **relojes, ropa y perfumes de diseñador** bajo el código del *lujo silencioso*.
La navegación no se organiza por categorías clásicas, sino por **outfits / estilos / temporadas**
(Lujo Silencioso, Elegante, Casual, Oficina, Noche, Verano, Invierno, Deportivo).

- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Base de datos:** Neon (PostgreSQL)
- **Despliegue:** Render (conectado a GitHub)
- **Diseño:** paleta marrón claro + crema, **modo claro/oscuro** con recordatorio de preferencia
- **Precios:** en **USD y PEN** a la vez (tipo de cambio de Kambista, venta + 0.10)
- **Panel admin:** `/admin` para crear, editar y eliminar productos

---

## 1. Cómo funcionan los datos

| Fuente | Qué trae | Estado |
| --- | --- | --- |
| **Jomashop** (GraphQL) | Relojes (Seiko, Citizen, Tissot, Casio) y perfumes (**43 marcas**: Xerjoff, Creed, Tom Ford, Parfums de Marly, Armani, Dior, YSL, Versace…) | ✅ **100% real** (nombre, precio e imagen en vivo) |
| **TheOutnet** (sitemaps) | Ropa y zapatos reales de las 10 marcas permitidas | ✅ Nombre + marca + **imagen reales**; precio estimado (ver nota) |
| **Kambista** (API) | Tipo de cambio USD→PEN | ✅ En vivo |

El catálogo horneado trae **~1200 productos** reales (328 relojes, ~688 perfumes, ~195 prendas/zapatos).

**Jomashop — cómo se scrapea bien:**
- Relojes: por categoría de marca. Se escanean varias páginas (`WATCH_SCAN_PAGES`) y se
  **priorizan los modelos icónicos por nivel** (`HERO_WATCHES`: Tsuyosa, Promaster, PRX, Prospex,
  G-Shock… por encima de líneas amplias como Eco-Drive), para que los buscados siempre aparezcan.
- Perfumes: con el filtro GraphQL `manufacturer:{eq:"<Marca>"}` + categoría *Fragrances*, que
  devuelve **exactamente** las fragancias de cada casa (marcas en `scripts/config.mjs`).
  - Solo **frascos > 2 oz** (se descartan testers/mini/sets; `MIN_PERFUME_OZ`).
  - Las fragancias **icónicas** (Erba Pura, Aventus, Sauvage…) se priorizan (`HERO_FRAGRANCES`).

**IA (`gpt-5.4-mini`):** para cada producto genera, además de la **clasificación** en colecciones
(un Tissot Le Locle → *oficina* + *lujo silencioso*):
- una **descripción** corta y elegante (diseño/origen), y
- una **nota de estilo** que explica cómo **complementarlo con otras categorías** (el "porqué").

En cada ficha, la sección **"Completa el look"** recomienda piezas de **otras categorías** que
combinan (relojes ↔ perfumes ↔ ropa ↔ calzado, por coincidencia de colecciones), muestra una
**imagen de referencia** de cómo quedaría (búsqueda tipo Pinterest, por colección + género) y el
**porqué** redactado por la IA. Todo horneado en `npm run scrape` (cachés en `scripts/.cache/`).
Sin `OPENAI_API_KEY` se usa clasificación por reglas como respaldo.

> **Nota sobre TheOutnet:** el sitio bloquea fichas/API con Akamai + IBM WCS (storeId numérico
> privado): las páginas dan **HTTP 403** y la API interna **500/param oculto**, así que **el precio
> en vivo no es accesible**. Pero los **sitemaps sí son públicos** y listan TODOS los productos
> reales; `scripts/scrape-theoutnet.mjs` los recorre (clothing 1-5 + shoes), toma marca + categoría
> + nombre + partNumber **reales**, obtiene la **imagen real** (del CDN por partNumber y, si no,
> buscándola en la web) y **estima** el precio en rango outlet. Marcas: Saint Laurent, Jimmy Choo,
> Valentino, Dolce & Gabbana, Versace, Ralph Lauren, Ferragamo, Alexander McQueen, Maison Margiela,
> Balmain (según stock real del momento). Puedes ajustar cantidades en `scripts/config.mjs`
> (`OUTNET_PER_BRAND`) y **agregar/editar productos a mano** desde `/admin`.
>
> Se intentó el precio real con **Playwright** (Chrome real, con ventana, calentamiento de cookies,
> simulación humana): Akamai **igual bloquea** las fichas (403). Por eso el precio de ropa/zapatos
> es estimado, y desde `/admin` puedes fijar el **precio real mostrado** de cualquier producto
> (campo "precio de venta mostrado / override").

### Imágenes reales de producto
Cada producto muestra una **foto real**. Cuando no se puede obtener la imagen de la tienda
de origen (ropa/zapatos), el scraper la **busca en internet** (`lib/image-search.mjs`, vía Bing
Images) y toma la primera imagen real más cercana; el mismo mecanismo se usa en `/admin` cuando
dejas el campo de imagen vacío. Las imágenes se sirven a través de un **proxy propio**
(`/api/img/<id>`), de modo que **al inspeccionar la página el cliente nunca ve la tienda de
origen**.

### Privacidad / datos internos
- El catálogo con los datos internos (precio base, `source`, enlace de compra) vive en
  `data/catalog.json`, **fuera de `public/`**, así que no es descargable desde el navegador.
- Las fichas **no muestran** enlaces a la tienda de origen ni el precio base; los IDs de producto
  son neutrales (`mp-…`) y **no revelan** de dónde sale el producto.
- El enlace de compra (`sourceUrl`) es **solo para ti** en `/admin`; nunca se envía al cliente.

### Regla de precios (markup)
Se aplica a **todos** los productos sobre el precio base de origen:

- base **< $200** → **+ $63**
- base **$200–$800** → interpolación lineal de **+$85** (en 200) a **+$225** (en 800)
- base **> $800** → **+ $225** (no se descarta el producto)

El precio final se muestra con terminación `.99`.

### Tipo de cambio (USD → PEN)
Se toma el **valor de venta del dólar de Kambista** y se le **suma 0.10**.
Ejemplo actual: venta `3.412` + `0.10` = **S/ 3.51 por dólar**. El precio en soles ya se
muestra calculado en toda la web.

---

## 2. Correr en local

```bash
npm install
npm run dev          # http://localhost:3000
```

Sin `DATABASE_URL`, la web usa el catálogo horneado en `data/catalog.json`
(~810 productos ya scrapeados), así que **funciona de inmediato** para previsualizar.
El **panel admin** en modo lectura también funciona; para crear/editar/eliminar necesita `DATABASE_URL`.

### Regenerar el catálogo (scraping real)
```bash
npm run scrape       # scrapea Jomashop + Kambista + IA y reescribe:
                     #   - data/catalog.json
                     #   - db/seed.sql
npm run db:sql       # regenera SOLO db/seed.sql desde data/catalog.json (sin re-scrapear)
npm run exchange     # solo actualiza el tipo de cambio (para un cron)
```

---

## 3. Base de datos en Neon

La BD es necesaria para que el **admin** persista lo que crea/edita/elimina. El sitio también
funciona sin ella (solo lectura, desde `data/catalog.json`).

1. Crea un proyecto en <https://neon.tech> → **Dashboard → SQL Editor**.
2. Pega y ejecuta **`db/schema.sql`** — crea las tablas. **Solo se ejecuta una vez.**
3. Pega y ejecuta **`db/seed.sql`** — carga el catálogo (~810 productos + colecciones + tipo de cambio).
4. Copia el **connection string** (usa el *Pooled connection*, incluye `?sslmode=require`).

**Re-scrape / actualizar el catálogo (sincronización, no destructiva):** cuando vuelvas a
scrapear (`npm run scrape` o `npm run db:sql`) y ejecutes de nuevo **`db/seed.sql`** en Neon,
se **refresca lo scrapeado** (quita lo que ya no existe en el origen, agrega/actualiza lo nuevo)
**sin borrar** los productos que creaste a mano en `/admin` ni los **precios override** que fijaste.
Puedes re-ejecutar `db/seed.sql` cuantas veces quieras.

> Alternativa por consola (aplica schema + seed a Neon):
> ```bash
> # con DATABASE_URL definida en el entorno
> npm run db:push
> ```

---

## 4. Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo y define **las mismas** en Render:

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `DATABASE_URL` | Connection string de Neon (Pooled, con `sslmode=require`) | `postgresql://user:pass@ep-xxx-pooler.../neondb?sslmode=require` |
| `EXCHANGE_MARKUP` | Cuánto se suma al valor de venta del dólar | `0.10` |
| `EXCHANGE_FALLBACK_PEN` | Tipo de cambio de respaldo si Kambista no responde | `3.51` |
| `ADMIN_PASSWORD` | Contraseña para entrar a `/admin` | `una-clave-fuerte` |
| `ADMIN_SESSION_SECRET` | Cadena larga y aleatoria para firmar la sesión | (ver abajo) |
| `OPENAI_API_KEY` | (Opcional) clasificación IA de productos en `/admin` | `sk-...` |
| `OPENAI_MODEL` | Modelo de IA | `gpt-5.4-mini` |
| `REVALIDATE_TOKEN` | (Opcional) protege `/api/exchange?persist=1` | `otra-clave` |

Genera un `ADMIN_SESSION_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

En la web **solo se usan variables de entorno**: tú pones el valor en Render.

---

## 5. Panel de administrador

- Entra a **`/admin`** → te pedirá la contraseña (`ADMIN_PASSWORD`).
- Desde ahí puedes **crear, editar y eliminar** productos: marca, nombre, tipo
  (reloj/perfume/ropa/calzado), género, precio base, imagen (cualquier URL) y descripción.
- El **precio de venta** (con el markup) se calcula solo, pero puedes fijar un
  **precio mostrado (override)** — ese será el que vea el cliente (USD + soles).
- Si dejas la **imagen** vacía, se busca sola en la web; si dejas las **colecciones** vacías,
  la **IA las asigna** automáticamente.
- La sesión se guarda en una cookie firmada (HMAC) por 7 días. Para salir: botón **Salir**.
- ⚠️ Crear/editar/eliminar requiere `DATABASE_URL` (Neon). Sin base de datos, el panel es solo lectura.

---

## 6. Subir a GitHub

Desde la carpeta del proyecto (`d:\pryperson\1`):

```bash
git init
git add .
git commit -m "Maison Privée: tienda de lujo silencioso (Next.js + Neon)"
git branch -M main

# crea el repo en github.com/new (por ejemplo: maison-privee) y luego:
git remote add origin https://github.com/TU_USUARIO/maison-privee.git
git push -u origin main
```

> Con GitHub CLI en un paso:
> ```bash
> gh repo create maison-privee --public --source . --remote origin --push
> ```

---

## 7. Desplegar en Render

**Opción A — Blueprint (recomendada, usa `render.yaml`):**
1. En <https://dashboard.render.com> → **New +** → **Blueprint**.
2. Conecta tu repo de GitHub. Render detecta `render.yaml` y crea el **Web Service**.
3. En **Environment**, completa las variables marcadas `sync:false`
   (`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).
4. **Apply / Deploy**.

**Opción B — Manual:**
1. **New +** → **Web Service** → conecta el repo.
2. Configura:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:render`
   - **Environment:** Node
3. Agrega las variables de entorno del punto 4.
4. **Create Web Service**.

`start:render` aplica automáticamente `db/schema.sql` + `db/seed.sql` antes de
levantar Next, por lo que no requiere Render Shell. La sincronización conserva
productos creados en `/admin` y precios override. Render asigna el puerto por
`PORT`; `next start` lo respeta automáticamente.

### Tipo de cambio automático (opcional)
Para refrescar el dólar a diario sin re-desplegar, crea en Render un **Cron Job**
con Start Command `npm run exchange` (y `DATABASE_URL`), o descomenta el bloque `cron`
en `render.yaml`. También puedes llamar manualmente a `/api/exchange?persist=1`.

---

## 8. Estructura

```
app/                     Rutas públicas + /admin (login, panel, crear/editar)
                         + /api/exchange + /api/img/[id] (proxy de imágenes)
components/              Header, Footer, ProductCard, CollectionCard, PriceTag,
                         ThemeToggle, AdminBar, ProductForm
lib/                     data (Neon/JSON), db, auth (sesión admin), admin-db (CRUD),
                         exchange, pricing (reglas), image-search, format, types
middleware.ts            Protege /admin
db/                      schema.sql (tablas) + seed.sql (datos generados)
scripts/                 scrapers Jomashop/TheOutnet, build-seed, update-exchange, db-apply
data/catalog.json        Catálogo horneado — INTERNO (fuera de public/, no descargable)
render.yaml              Blueprint de despliegue en Render
```
#   m p  
 #   m p  
 
