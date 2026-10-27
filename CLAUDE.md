# Pack Navidad: plantilla de landing + reservas + tarjetas regalo

Plantilla Next.js reutilizable para negocios locales. Un solo repo, un despliegue de Vercel por cliente (variable `CLIENT_SLUG`), módulos activables por config.

## Documentación (léela antes de cada fase)

- `docs/especificacion.md`: funcionalidades, arquitectura, modelo de datos. Es la fuente de verdad del diseño.
- `docs/plan-desarrollo.md`: fases, pasos, criterios de "hecho" y mensaje de commit de cada paso.

## Stack

Next.js (App Router) + TypeScript, Tailwind, Supabase (Postgres + Auth), Stripe Checkout + webhooks, Resend + React Email, pdf-lib + qrcode, Zod, Vercel Cron.

## Estructura

- `clients/<slug>.ts`: config de cada cliente (`defineClient`).
- `core/`: config, db, stripe, email, auth, ratelimit, tokens. Los módulos solo dependen de `core/`.
- `modules/landing|reservations|giftcards|countdown/`: cada módulo autocontenido. Un módulo no importa de otro, salvo `countdown` → `reservations.getRemainingSeats()`.
- `app/`: rutas finas que delegan en los módulos. Toda ruta de módulo empieza con `requireModule("<modulo>")`.
- `supabase/migrations/`: un SQL por cambio.

## Cómo trabajar en este repo

1. Trabaja **un paso del plan a la vez**. Antes de escribir código, resume qué vas a hacer y qué archivos tocarás.
2. Al terminar un paso: ejecuta `npm run typecheck` y `npm run lint`; si fallan, arréglalo antes de seguir.
3. Haz **un commit por paso** con el mensaje exacto que indica `docs/plan-desarrollo.md`, y marca su casilla `[x]` en ese archivo en el mismo commit.
4. No empieces el siguiente paso ni la siguiente fase sin que te lo pida.
5. Al cerrar una fase, comprueba su criterio "Hecho cuando" y dime qué debo probar a mano. La etiqueta de versión (`v0.x.0`) la creo yo.
6. Si algo del plan choca con la especificación o parece un error, pregunta antes de improvisar.

## Reglas que no se rompen

- Nunca guardes códigos de tarjeta regalo en claro: solo su HMAC (`HMAC_SECRET`).
- Las tarjetas se activan y las señales se confirman **solo** en el webhook de Stripe con firma verificada e idempotencia por `stripe_events.event_id`. Nunca por la redirección del navegador.
- Canjes y reservas se hacen con operaciones SQL atómicas (actualización condicionada o bloqueo de fila), nunca leer-y-luego-escribir desde Node.
- Enlaces de cancelación y similares: tokens firmados con caducidad (`core/tokens.ts`), nunca ids a secas.
- Fechas límite en zona `Europe/Madrid`, resueltas en el servidor.
- Toda tabla lleva `business_id` y RLS. Nunca se edita una migración ya aplicada.
- Ningún secreto en el código: todo en variables de entorno y reflejado en `.env.example`.
- Nada de temporizadores falsos: el countdown solo apunta a fechas o plazas reales.

## Fuera de alcance

CMS, panel multi-tenant, app nativa, pagos propios, sistema de plugins. Si una tarea parece pedirlo, pregunta.

## Idioma

Código, nombres y commits en inglés; textos visibles para el usuario final y comentarios de documentación en español.
