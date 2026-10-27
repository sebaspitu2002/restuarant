import type { ClientConfigInput } from "@/core/client-schema";
import testRestaurant from "./test-restaurant";
import testSalon from "./test-salon";

/** Registro de clientes; la clave es el valor de CLIENT_SLUG. */
export const clients: Record<string, ClientConfigInput> = {
  "test-restaurant": testRestaurant,
  "test-salon": testSalon,
};
