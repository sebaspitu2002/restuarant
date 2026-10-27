import { defineClient } from "@/core/client-schema";

/** Config de prueba: restaurante con reservas, tarjetas y countdown. */
export default defineClient({
  slug: "test-restaurant",
  brand: { name: "Restaurante de Prueba", primary: "#8B1E3F", font: "Fraunces" },
  contact: {
    whatsapp: "+34600000000",
    address: "Calle Mayor 1, 28013 Madrid",
    hours: "Martes a domingo, 13:00–16:00 y 20:00–23:30",
  },
  modules: {
    landing: { sections: ["hero", "offer", "gallery", "reviews", "location", "faq"] },
    reservations: { enabled: true, deposit: { perPerson: 10, minGuests: 8 } },
    giftcards: { enabled: true, amounts: [25, 50, 100], custom: { min: 20, max: 300 } },
    countdown: {
      enabled: true,
      target: { type: "date", at: "2026-12-05T23:59" },
      label: "Reservas de cenas de empresa hasta",
      onEnd: "closeReservations",
    },
  },
});
