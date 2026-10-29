import type { CSSProperties } from "react";
import type { ClientConfig } from "./client-schema";

/** Luminancia relativa WCAG de un color #RRGGBB. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Blanco o negro, el que más contraste tenga sobre el color dado. */
export function onColor(hex: string): "#ffffff" | "#000000" {
  const l = luminance(hex);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastBlack = (l + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? "#ffffff" : "#000000";
}

/** Variables CSS de la marca, para el atributo style de <html>. */
export function brandStyle(brand: ClientConfig["brand"]): CSSProperties {
  return {
    "--brand-primary": brand.primary,
    "--brand-on-primary": onColor(brand.primary),
  } as CSSProperties;
}
