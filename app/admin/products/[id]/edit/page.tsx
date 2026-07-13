import { notFound } from "next/navigation";
import AdminBar from "@/components/AdminBar";
import ProductForm from "@/components/ProductForm";
import { getCatalog } from "@/lib/data";
import { updateProductAction } from "../../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar producto · Admin" };

export default async function EditProduct({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const { products } = await getCatalog();
  const product = products.find((p) => p.id === params.id);
  if (!product) notFound();

  const action = updateProductAction.bind(null, product.id);

  return (
    <div>
      <AdminBar />
      <div className="container-shell max-w-3xl py-8">
        <h1 className="mb-2 font-serif text-3xl text-content">Editar producto</h1>
        <p className="mb-6 text-sm text-muted">{product.brand} — {product.name}</p>
        <ProductForm
          action={action}
          defaults={product}
          submitLabel="Guardar cambios"
          error={searchParams.error}
        />
      </div>
    </div>
  );
}
