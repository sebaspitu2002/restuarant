import { Fraunces, Inter, Lora, Playfair_Display } from "next/font/google";
import type { BrandFont } from "./client-schema";

// next/font exige las opciones escritas en línea en cada llamada, no en una variable compartida.
// preload: false para no precargar las cuatro familias cuando solo se usa una.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-brand", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-brand", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-brand", preload: false });
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-brand",
  preload: false,
});

/** Clase que define --font-brand para cada fuente admitida en la config. */
export const brandFonts: Record<BrandFont, { variable: string }> = {
  Fraunces: fraunces,
  Inter: inter,
  Lora: lora,
  "Playfair Display": playfairDisplay,
};
