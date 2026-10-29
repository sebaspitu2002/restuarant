import { getClient } from "@/core/config";

// Provisional: la Fase 2 la sustituye por la landing compuesta desde la config.
export default function Home() {
  const { brand } = getClient();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-brand-soft p-8">
      <h1 className="text-4xl font-semibold">{brand.name}</h1>
      <a href="#" className="rounded-full bg-brand px-6 py-3 text-on-brand">
        Reservar
      </a>
    </main>
  );
}
