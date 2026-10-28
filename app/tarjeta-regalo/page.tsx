import { requireModule } from "@/core/config";

function GiftCardPage() {
  requireModule("giftcards");
  return (
    <main>
      <h1>Tarjeta de regalo</h1>
    </main>
  );
}

export default GiftCardPage;
