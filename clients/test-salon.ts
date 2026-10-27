import { defineClient } from "@/core/client-schema";

/** Config de prueba: peluquería con tarjetas regalo, sin reservas ni countdown. */
export default defineClient({
  slug: "test-salon",
  brand: { name: "Peluquería de Prueba", primary: "#1F5C4A", font: "Inter" },
  contact: {
    whatsapp: "+34611111111",
    address: "Avenida del Puerto 20, 46021 Valencia",
    hours: "Lunes a sábado, 10:00–20:00",
  },
  modules: {
    landing: { sections: ["hero", "offer", "location"] },
    giftcards: { enabled: true, amounts: [30, 60] },
  },
});
