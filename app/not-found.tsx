import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">Página no encontrada</h1>
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </main>
  );
}
