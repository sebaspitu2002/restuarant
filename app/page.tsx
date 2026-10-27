import { getClient } from "@/core/config";

export default function Home() {
  const { brand } = getClient();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <h1 className="text-4xl font-semibold">{brand.name}</h1>
    </main>
  );
}
