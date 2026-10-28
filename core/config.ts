import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { clients } from "@/clients";
import { clientConfigSchema, type ClientConfig } from "./client-schema";

let cached: ClientConfig | undefined;

/** Config del cliente de este despliegue, elegida por CLIENT_SLUG y validada una sola vez. */
export function getClient(): ClientConfig {
  if (cached) return cached;

  const available = Object.keys(clients).join(", ");
  const slug = process.env.CLIENT_SLUG;
  if (!slug) {
    throw new Error(`CLIENT_SLUG is not set. Available clients: ${available}`);
  }

  const raw = clients[slug];
  if (!raw) {
    throw new Error(`Unknown CLIENT_SLUG "${slug}". Available clients: ${available}`);
  }

  const result = clientConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid config in clients/${slug}.ts:\n${z.prettifyError(result.error)}`);
  }
  if (result.data.slug !== slug) {
    throw new Error(
      `clients/${slug}.ts declares slug "${result.data.slug}"; it must match its key in clients/index.ts`,
    );
  }

  cached = result.data;
  return cached;
}

export type ModuleName = Exclude<keyof ClientConfig["modules"], "landing">;

export function isEnabled(module: ModuleName): boolean {
  return getClient().modules[module].enabled;
}

/** Hace 404 si el módulo está apagado. Primera línea de toda página de un módulo. */
export function requireModule(module: ModuleName): void {
  if (!isEnabled(module)) {
    notFound();
  }
}
