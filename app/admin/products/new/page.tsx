import AdminBar from "@/components/AdminBar";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo producto · Admin" };

export default function NewProduct({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <AdminBar />
      <div className="container-shell max-w-3xl py-8">
        <h1 className="mb-6 font-serif text-3xl text-content">Nuevo producto</h1>
        <ProductForm action={createProductAction} submitLabel="Crear producto" error={searchParams.error} />
      </div>
    </div>
  );
}
