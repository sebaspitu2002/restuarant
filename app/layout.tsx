import type { Metadata } from "next";
import { getClient } from "@/core/config";
import { brandFonts } from "@/core/fonts";
import { brandStyle } from "@/core/theme";
import "./globals.css";

export function generateMetadata(): Metadata {
  const { brand } = getClient();
  return { title: brand.name };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { brand } = getClient();

  return (
    <html
      lang="es"
      className={`${brandFonts[brand.font].variable} h-full antialiased`}
      style={brandStyle(brand)}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
