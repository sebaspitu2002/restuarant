import { z } from "zod";

/** Fuentes disponibles; cada una se precarga con next/font, que no admite nombres dinámicos. */
export const FONTS = ["Fraunces", "Inter", "Playfair Display", "Lora"] as const;

export const LANDING_SECTIONS = ["hero", "offer", "gallery", "reviews", "location", "faq"] as const;

/** Secciones que la especificación marca como "Siempre". */
const REQUIRED_SECTIONS = ["hero", "offer", "location"] as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB color");

/** Fecha y hora local en la zona del negocio, sin desfase: "2026-12-05T23:59". */
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Expected local date-time YYYY-MM-DDTHH:mm");

const timeZone = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}, "Unknown IANA time zone");

const landingSchema = z.object({
  sections: z
    .array(z.enum(LANDING_SECTIONS))
    .refine((s) => new Set(s).size === s.length, "Sections must not repeat")
    .refine(
      (s) => REQUIRED_SECTIONS.every((r) => s.includes(r)),
      `Sections must include ${REQUIRED_SECTIONS.join(", ")}`,
    ),
});

const disabled = z.object({ enabled: z.literal(false) });

const reservationsSchema = z.discriminatedUnion("enabled", [
  disabled,
  z.object({
    enabled: z.literal(true),
    deposit: z
      .object({
        perPerson: z.number().positive(),
        minGuests: z.number().int().min(1),
      })
      .optional(),
  }),
]);

const giftcardsSchema = z.discriminatedUnion("enabled", [
  disabled,
  z.object({
    enabled: z.literal(true),
    amounts: z.array(z.number().int().positive()).min(1),
    custom: z
      .object({ min: z.number().int().positive(), max: z.number().int().positive() })
      .refine((c) => c.min < c.max, "custom.min must be lower than custom.max")
      .optional(),
  }),
]);

const countdownSchema = z.discriminatedUnion("enabled", [
  disabled,
  z.object({
    enabled: z.literal(true),
    target: z.discriminatedUnion("type", [
      z.object({ type: z.literal("date"), at: localDateTime }),
      z.object({ type: z.literal("reservationsEvent"), eventId: z.string().min(1) }),
      z.object({ type: z.literal("giftcardCutoff"), at: localDateTime }),
    ]),
    label: z.string().min(1),
    seats: z.boolean().default(false),
    onEnd: z.enum(["hide", "changeCta", "closeReservations", "warnGiftcardDelivery"]),
    placement: z.enum(["hero", "topbar"]).default("hero"),
  }),
]);

export const clientConfigSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be kebab-case"),
    timezone: timeZone.default("Europe/Madrid"),
    brand: z.object({
      name: z.string().min(1),
      primary: hexColor,
      font: z.enum(FONTS),
    }),
    contact: z.object({
      whatsapp: z.string().regex(/^\+[1-9]\d{6,14}$/, "Expected E.164 phone, e.g. +34600000000"),
      address: z.string().min(1),
      hours: z.string().min(1),
    }),
    modules: z.object({
      landing: landingSchema,
      reservations: reservationsSchema.default({ enabled: false }),
      giftcards: giftcardsSchema.default({ enabled: false }),
      countdown: countdownSchema.default({ enabled: false }),
    }),
  })
  .superRefine(({ modules }, ctx) => {
    const { countdown, reservations, giftcards } = modules;
    if (!countdown.enabled) return;

    const needsReservations =
      countdown.onEnd === "closeReservations" ||
      countdown.seats ||
      countdown.target.type === "reservationsEvent";
    if (needsReservations && !reservations.enabled) {
      ctx.addIssue({
        code: "custom",
        path: ["modules", "countdown"],
        message: "This countdown setup requires modules.reservations to be enabled",
      });
    }

    const needsGiftcards =
      countdown.onEnd === "warnGiftcardDelivery" || countdown.target.type === "giftcardCutoff";
    if (needsGiftcards && !giftcards.enabled) {
      ctx.addIssue({
        code: "custom",
        path: ["modules", "countdown"],
        message: "This countdown setup requires modules.giftcards to be enabled",
      });
    }
  });

/** Lo que escribe cada archivo de clients/ (los valores por defecto son opcionales). */
export type ClientConfigInput = z.input<typeof clientConfigSchema>;
/** La config ya validada, con los valores por defecto aplicados. */
export type ClientConfig = z.output<typeof clientConfigSchema>;

/** Solo tipa la config; la validación ocurre al cargarla en core/config.ts. */
export function defineClient(config: ClientConfigInput): ClientConfigInput {
  return config;
}

export type BrandFont = (typeof FONTS)[number];
