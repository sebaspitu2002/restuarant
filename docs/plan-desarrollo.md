# Plan de desarrollo

Seis fases llevan la plantilla de un repo vacío a demo vendible el 1 de noviembre, tarjetas regalo el 6 y reservas el 13; cada fase termina desplegada y con una etiqueta de versión.

## Calendario

&#91;embedded content: calendario · 6 fases, 26 oct a 16 nov\]

La captación empieza el 2 de noviembre con la demo; tarjetas y reservas se construyen mientras cierras los primeros clientes.

## Convenciones

Una rama por paso, commits pequeños con Conventional Commits y una etiqueta al cerrar cada fase; Vercel te da una URL de preview por rama para probar antes de fusionar.

- **Ramas:** `main` siempre desplegable; `feat/<modulo>-<paso>` para cada paso, fusionada con squash o rebase.
- **Commits:** `tipo(ámbito): descripción` en presente. Tipos: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`. Ámbitos: `core`, `landing`, `countdown`, `giftcards`, `reservations`, `panel`, `db`.
- **Migraciones:** un archivo SQL por cambio en `supabase/migrations/`, en el mismo commit que el código que lo usa. Nunca se edita una migración ya aplicada.
- **Etiquetas:** `v0.1.0` al cerrar la fase 1, `v0.2.0` la fase 2, y así; cada cliente se despliega desde una etiqueta, no desde `main`.
- **Hecho significa:** desplegado en preview, probado a mano con el criterio de la fase y sin errores de `tsc` ni de lint.

## Fase 0: arranque (26 de octubre)

**Objetivo:** un "hola mundo" en Next.js desplegado en Vercel, conectado a Supabase, con calidad de código automatizada.

**Hecho cuando:** la URL de Vercel carga, una consulta de prueba a Supabase responde y un push con errores de tipos falla en CI.

Pasos y commits:

- [x] Crear el proyecto con `**create-next-app**` (TypeScript, Tailwind, App Router, ESLint) → `chore: init next.js app with typescript and tailwind`
- [x] Añadir Prettier, scripts `typecheck` y `lint`, y un workflow de GitHub Actions que los ejecute → `chore: add prettier, typecheck and ci workflow`
- [x] Crear el proyecto de Supabase, instalar la CLI y enlazarlo; carpeta `supabase/` versionada → `chore(db): link supabase project and add migrations folder`
- [ ] Crear `.env.example` con todas las variables (Supabase, Stripe, Resend, `CLIENT_SLUG`, `HMAC_SECRET`) → `chore: add env example`
- [ ] Conectar el repo a Vercel y comprobar el despliegue de `main` y de una rama → `docs: add readme with setup and deploy steps`

## Fase 1: núcleo y configuración (27 de octubre) → v0.1.0

**Objetivo:** cambiar `CLIENT_SLUG` cambia la marca y los módulos activos, y existe un panel con login.

**Hecho cuando:** dos configs de prueba muestran colores y nombre distintos; una ruta de un módulo apagado da 404; un empleado entra al panel con enlace mágico y otro de otro comercio no ve nada.

Pasos y commits:

- [ ] `defineClient` con esquema Zod y carga por `CLIENT_SLUG`; error claro si la config no valida → `feat(core): add client config schema and loader`
- [ ] `isEnabled(modulo)` y helper `requireModule()` que hace `notFound()` → `feat(core): add module flags and route guard`
- [ ] Tema por cliente: variables CSS de color y fuente generadas desde la config → `feat(core): apply client brand theme`
- [ ] Migración `businesses` y `staff` con RLS por `business_id` → `feat(db): add businesses and staff tables with rls`
- [ ] Clientes de Supabase para servidor y navegador → `feat(core): add supabase server and browser clients`
- [ ] Login con enlace mágico, middleware que protege `/panel` y layout del panel con pestañas según módulos activos → `feat(panel): add auth and module-driven panel layout`
- [ ] Utilidades `tokens.ts` (HMAC, firmar y verificar con caducidad) con tests → `feat(core): add hmac token helpers` y `test(core): cover token signing and expiry`

## Fase 2: landing, countdown y demo (28–31 de octubre) → v0.2.0

**Objetivo:** la demo de un restaurante ficticio, desplegada y lista para enseñar en el móvil a los negocios desde el 2 de noviembre.

**Hecho cuando:** la demo carga en menos de 2 segundos en 4G, puntúa 90 o más en Lighthouse móvil, el countdown cambia el CTA al llegar a cero y quitar una sección de la config la hace desaparecer.

Pasos y commits:

- [ ] Compositor de la landing: lee `landing.sections` y renderiza en orden → `feat(landing): add config-driven section composer`
- [ ] Secciones Hero y Oferta → `feat(landing): add hero and offer sections`
- [ ] Secciones Galería/vídeo y Reseñas → `feat(landing): add gallery and reviews sections`
- [ ] Ubicación y horario, FAQ → `feat(landing): add location and faq sections`
- [ ] Pie y páginas legales con plantilla rellenada desde la config → `feat(landing): add legal pages from config`
- [ ] CTA que elige entre reservar, comprar tarjeta o WhatsApp según módulos activos → `feat(landing): add module-aware cta`
- [ ] SEO: metadatos, imagen OG y datos estructurados `LocalBusiness` → `feat(landing): add seo metadata and structured data`
- [ ] Countdown con fecha resuelta en servidor (`Europe/Madrid`) y tic en el cliente → `feat(countdown): add server-resolved countdown component`
- [ ] Comportamientos `onEnd` (`hide`, `changeCta`) → `feat(countdown): support end behaviours`
- [ ] Analítica sin cookies y eventos de clic en CTA → `feat(core): add cookieless analytics and cta events`
- [ ] Config `clients/demo-restaurante.ts` con fotos libres de derechos y despliegue propio → `chore: add demo restaurant client`

## Fase 3: tarjetas regalo (2–6 de noviembre) → v0.3.0

**Objetivo:** un comprador paga, recibe el PDF con QR por email y el comercio canjea saldo parcial desde el móvil, sin posibilidad de doble gasto.

**Hecho cuando:** una compra en modo test de Stripe llega como PDF; reenviar el mismo webhook no crea otra tarjeta; dos canjes simultáneos por el saldo total dejan pasar solo uno; 20 códigos erróneos seguidos desde una IP quedan bloqueados.

Pasos y commits:

- [ ] Migración `gift_cards`, `gift_card_ledger` y `stripe_events` con RLS → `feat(db): add gift card, ledger and stripe events tables`
- [ ] Generador de códigos base32 con `crypto.randomBytes` y hash HMAC → `feat(giftcards): add secure code generation and hashing`
- [ ] Página de compra con importes de la config y validación Zod → `feat(giftcards): add purchase page`
- [ ] Crear sesión de Stripe Checkout con `metadata.module` y tarjeta en `pendiente_pago` → `feat(giftcards): create stripe checkout session`
- [ ] Webhook único: verificar firma, registrar `event_id`, despachar por módulo → `feat(core): add stripe webhook dispatcher with idempotency`
- [ ] Activación de la tarjeta y movimiento de emisión en una transacción → `feat(giftcards): activate card on checkout completed`
- [ ] PDF con marca y QR → `feat(giftcards): generate branded pdf with qr`
- [ ] Email de entrega con el PDF adjunto → `feat(giftcards): send delivery email`
- [ ] Página pública `/g/[code]` con saldo y límite de peticiones → `feat(giftcards): add rate-limited balance page`
- [ ] Función SQL de canje atómico (actualización condicionada + movimiento) → `feat(db): add atomic redeem function`
- [ ] Pestaña del panel: escanear QR, buscar código, canjear importe, historial → `feat(panel): add gift card scan and redeem tab`
- [ ] Tests del canje concurrente y de la idempotencia del webhook → `test(giftcards): cover concurrent redeem and webhook replay`

## Fase 4: reservas (9–13 de noviembre) → v0.4.0

**Objetivo:** un cliente reserva una franja con aforo garantizado, recibe confirmación con enlace para cancelar y el restaurante gestiona el día desde el panel.

**Hecho cuando:** reservar la última plaza desde dos pestañas a la vez deja pasar solo una; el enlace de cancelación caducado o manipulado se rechaza; una franja bloqueada no aparece; el countdown con `closeReservations` cierra el formulario y la API a la vez.

Pasos y commits:

- [ ] Migración `availability_rules`, `blocked_slots` y `reservations` con RLS → `feat(db): add reservation tables`
- [ ] Cálculo de franjas disponibles (reglas − bloqueos − ocupación) → `feat(reservations): compute available slots`
- [ ] Función SQL de reserva atómica que bloquea la franja y comprueba aforo → `feat(db): add atomic reserve function`
- [ ] Formulario `/reservar` con server action, límite de peticiones y campo trampa → `feat(reservations): add booking form`
- [ ] Email de confirmación con enlace firmado y página `/reserva/[token]` para cancelar → `feat(reservations): add confirmation email and signed cancel link`
- [ ] Pestaña del panel: lista por día, alta manual, cancelar, marcar no-show → `feat(panel): add reservations day view`
- [ ] Edición de reglas y bloqueos desde el panel → `feat(panel): manage availability rules and blocked slots`
- [ ] `getRemainingSeats()` expuesto para el countdown y `onEnd: closeReservations` → `feat(countdown): show seats and close reservations on end`
- [ ] Tests de reserva concurrente y de tokens manipulados → `test(reservations): cover concurrent booking and tampered tokens`

## Fase 5: extras bajo demanda (desde el 16 de noviembre) → v0.5.x

**Objetivo:** solo lo que un cliente haya comprado o pedido; cada extra es una versión menor independiente y se activa con un flag en su config.

| Extra                         | Commits                                                                                                                                                          | Hecho cuando                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Señal de reservas para grupos | `feat(reservations): hold slot pending deposit checkout` · `feat(reservations): confirm on deposit webhook` · `feat(reservations): expire unpaid holds via cron` | Una reserva sin pagar libera su plaza a los 15 minutos      |
| Recordatorio 24 h             | `feat(reservations): send reminder with attendance confirmation`                                                                                                 | El email llega la víspera y el botón marca la asistencia    |
| Envío programado de tarjetas  | `feat(giftcards): schedule delivery date via cron`                                                                                                               | Una tarjeta para el 24 de diciembre sale ese día a las 9:00 |
| Resumen diario al dueño       | `feat(panel): send daily sales and redemptions summary`                                                                                                          | El email cuadra con el libro de movimientos del día         |
| Anular y reemitir tarjeta     | `feat(giftcards): void and reissue card`                                                                                                                         | La tarjeta anulada da error y la nueva conserva el saldo    |
| Aviso de entrega tardía       | `feat(countdown): warn when gift card arrives after christmas`                                                                                                   | Pasado el corte, la compra muestra el aviso antes de pagar  |

## Alta de un cliente nuevo

Con la plantilla terminada, dar de alta un cliente debería llevar unas 2 horas más el tiempo de contenido y vídeos; se repite igual para cada uno.

1. Crear `clients/<slug>.ts` con marca, contacto, secciones y módulos → commit `feat(clients): add <slug>`.
2. Insertar la fila en `businesses` y dar de alta al dueño en `staff`.
3. Crear el proyecto de Vercel desde el mismo repo, en la última etiqueta, con `CLIENT_SLUG` y sus variables.
4. Si usa pagos: conectar su cuenta de Stripe, crear el endpoint de webhook y guardar la clave y el secreto como variables.
5. Configurar su dominio en Vercel y el dominio de envío en Resend (SPF y DKIM).
6. Pasar las pruebas: compra test, canje doble, reserva doble, cancelación, countdown a cero con una fecha de prueba.
7. Cambiar Stripe a modo live, hacer una compra real de 1 € y anularla.
8. Enseñar el panel al dueño y a los empleados en 15 minutos.
