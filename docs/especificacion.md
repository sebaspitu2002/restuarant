# Pack Navidad: especificación técnica

Oct 26, 2026 · @Dstrucktor-d-qlos

## Visión y principios

Un solo repositorio, una plantilla, cuatro módulos (landing, reservas, tarjetas regalo y countdown) que se activan por cliente con un archivo de configuración. Cada cliente es un despliegue independiente del mismo código, con su dominio y su propia cuenta de Stripe.

Principios para no sobreingeniar:

- **Configuración en código, no en un CMS.** El contenido y los módulos de cada cliente viven en un archivo `clients/<cliente>.ts`. Los cambios los haces tú; es parte del servicio.
- **Un despliegue por cliente en vez de multi-tenant.** Cada proyecto de Vercel apunta al mismo repo con otra variable `CLIENT_SLUG`. Aislas pagos, dominios y fallos sin escribir lógica de tenants.
- **Los módulos no se conocen entre sí.** Solo hablan con el núcleo (config, base de datos, pagos, email). La única excepción explícita: el countdown puede leer plazas libres de reservas.
- **Nada de pagos propios.** Stripe Checkout cobra; tú solo reaccionas a sus webhooks.
- **Construir bajo demanda.** Primero la landing y el countdown para la demo; tarjetas y reservas cuando un cliente las compre.

## Stack

Next.js con TypeScript sobre Vercel, Postgres en Supabase y Stripe Checkout: todo un mismo lenguaje, sin servidores que mantener y con planes gratuitos suficientes para empezar.

| Pieza                | Elección                                           | Para qué                                                           |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Framework            | Next.js (App Router) + TypeScript                  | Landing, páginas públicas, panel y API en un solo proyecto         |
| Estilos              | Tailwind CSS                                       | Tematizar por cliente con unas pocas variables de color y fuente   |
| Base de datos        | Supabase (Postgres)                                | Reservas, tarjetas, movimientos; transacciones atómicas            |
| Autenticación        | Supabase Auth (email con enlace mágico)            | Acceso al panel del dueño y los empleados                          |
| Pagos                | Stripe Checkout + webhooks, cuenta del cliente     | Venta de tarjetas y señales de reserva                             |
| Email                | Resend + React Email                               | Entrega de tarjetas, confirmaciones y recordatorios                |
| PDF y QR             | pdf-lib + qrcode                                   | Tarjeta regalo descargable con QR                                  |
| Lector QR            | API BarcodeDetector con html5-qrcode como respaldo | Canje desde el móvil del comercio                                  |
| Tareas programadas   | Vercel Cron                                        | Recordatorios de reserva, envíos programados, resumen diario       |
| Límite de peticiones | Tabla en Postgres o Upstash Ratelimit              | Frenar fuerza bruta en la consulta de saldo                        |
| Validación           | Zod                                                | Validar la config de cada cliente y los formularios                |
| Analítica            | Vercel Analytics o Plausible                       | Sin cookies, así no hace falta banner de consentimiento para medir |

Una base de datos de Supabase compartida por todos los clientes, con columna `business_id` y RLS, basta al principio. Si un cliente crece o lo exige, se le da su propio proyecto cambiando solo variables de entorno.

## Arquitectura y módulos

Cada módulo es una carpeta autocontenida que el núcleo enciende o apaga según la config del cliente; apagar un módulo quita sus rutas, sus secciones de la landing y su pestaña del panel.

&#91;embedded content: arquitectura · 4 módulos, núcleo, 4 servicios\]

Apagar un módulo corta su flecha al núcleo; la única dependencia entre módulos es el countdown leyendo plazas de reservas.

### Estructura del repositorio

```
/clients
  restaurante-lola.ts      config de cada cliente
/core
  config.ts                carga y valida la config (Zod), isEnabled()
  db.ts  stripe.ts  email.ts  auth.ts  ratelimit.ts  tokens.ts
/modules
  /landing                 secciones de la landing
  /reservations            componentes, server actions, consultas, emails
  /giftcards               compra, PDF, canje, emails
  /countdown               componente y resolución de la fecha límite
/app
  page.tsx                 compone la landing según la config
  /reservar                → reservations
  /tarjeta-regalo          → giftcards (compra)
  /g/[code]                → giftcards (consulta de saldo)
  /reserva/[token]         → reservations (cancelar o confirmar)
  /panel                   pestañas de los módulos activos
  /api/webhooks/stripe     despacha por metadata.module
  /api/cron                recordatorios, envíos programados, resumen
```

### Config de un cliente

```ts
export default defineClient({
  slug: "restaurante-lola",
  brand: { name: "Restaurante Lola", primary: "#8B1E3F", font: "Fraunces" },
  contact: { whatsapp: "+34600000000", address: "…", hours: "…" },
  modules: {
    landing: { sections: ["hero", "menu", "gallery", "reviews", "location", "faq"] },
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
```

### El contrato de un módulo

Cada módulo exporta un objeto pequeño; el núcleo solo consulta lo que necesita:

- **sections**: bloques que puede aportar a la landing (por ejemplo el CTA de reservar).
- **panelTab**: la pestaña del panel, si tiene.
- **onStripeEvent**: el manejador de sus pagos. El webhook único lee `metadata.module` y lo despacha.
- **cron**: tareas programadas, si tiene.

Las rutas de un módulo empiezan con `if (!isEnabled("giftcards")) notFound()`. No hace falta un sistema de plugins: un `if` y un objeto bastan.

## Módulo Landing

La landing es una lista de secciones ordenadas en la config; cada cliente elige cuáles y en qué orden, y los demás módulos añaden sus llamadas a la acción.

| Sección             | Contenido                                               | Siempre / opcional |
| ------------------- | ------------------------------------------------------- | ------------------ |
| Hero                | Titular de campaña, imagen o vídeo corto, CTA principal | Siempre            |
| Oferta              | Menú navideño, packs o servicios con precio             | Siempre            |
| Galería / vídeo     | Fotos y los Reels editados del pack                     | Opcional           |
| Reseñas             | 3 a 5 opiniones reales de Google, con enlace            | Opcional           |
| Ubicación y horario | Mapa, dirección, horarios especiales de diciembre       | Siempre            |
| FAQ                 | Alergias, grupos, pagos, cancelaciones                  | Opcional           |
| Pie legal           | Aviso legal, privacidad, cookies (LSSI y RGPD)          | Siempre            |

Transversal a todas las landings:

- **CTA según módulos activos:** reservar, comprar tarjeta o, si no hay ninguno, WhatsApp con mensaje prellenado.
- **SEO local:** metadatos, imagen para compartir, datos estructurados `Restaurant` o `LocalBusiness`.
- **Rendimiento:** generación estática; solo reservas, tarjetas y countdown se hidratan en el cliente.
- **Medición:** clics en cada CTA como evento, para enseñar resultados al cliente al final de la campaña.

## Módulo Reservas

El núcleo del módulo es el control de aforo por franja con descuento atómico; la señal con Stripe y los recordatorios son extras que se activan por config.

| Funcionalidad            | Detalle                                                                                         | Nivel |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ----- |
| Reglas de disponibilidad | Días, franjas (por ejemplo 13:30 y 21:00) y aforo por franja, en tabla editable desde el panel  | Base  |
| Fechas bloqueadas        | Cerrar un día o una franja concreta                                                             | Base  |
| Formulario               | Fecha, franja, personas, nombre, email, teléfono, notas (alergias)                              | Base  |
| Reserva atómica          | Inserción y comprobación de aforo en una transacción con bloqueo de la franja                   | Base  |
| Confirmación             | Email con enlace firmado para cancelar                                                          | Base  |
| Panel                    | Lista por día, alta manual (reservas por teléfono), cancelar, marcar no-show                    | Base  |
| Señal para grupos        | Desde N personas, pago con Stripe Checkout; la plaza queda retenida 15 minutos hasta el webhook | Extra |
| Recordatorio 24 h        | Email con botón de confirmar asistencia (Vercel Cron)                                           | Extra |
| Eventos especiales       | Nochevieja o menú de empresa: fecha única, precio fijo, aforo propio                            | Extra |
| Lista de espera          | Si una franja está llena; aviso al liberarse una plaza                                          | Extra |

Reglas de seguridad:

- El enlace de cancelación es un token firmado con HMAC (id de reserva + caducidad), nunca el id a secas.
- Las reservas con señal se crean como `pendiente_pago` y caducan solas si el webhook no llega; así no bloquean aforo.
- Límite de peticiones en el formulario y un campo trampa oculto contra bots, sin captcha.
- Garantía con tarjeta guardada (SetupIntent) queda fuera del MVP: más casos legales y de soporte que valor en un primer mes.

## Módulo Tarjetas regalo

Una tarjeta solo existe si su código está activo en la base de datos con saldo; el PDF y el QR son punteros, y el canje se decide siempre en el servidor con una actualización atómica.

| Funcionalidad        | Detalle                                                                                   | Nivel |
| -------------------- | ----------------------------------------------------------------------------------------- | ----- |
| Página de compra     | Importes fijos + importe libre con mínimo y máximo, destinatario, mensaje, fecha de envío | Base  |
| Pago                 | Stripe Checkout con `metadata.module = giftcards`; 3D Secure por defecto                  | Base  |
| Activación           | Solo en el webhook verificado; idempotente por id de evento                               | Base  |
| Código               | 16 caracteres base32 de `crypto.randomBytes`; se guarda el HMAC, no el código             | Base  |
| Entrega              | PDF con marca y QR + email; envío programado para el día elegido                          | Base  |
| Consulta de saldo    | `/g/[code]` muestra saldo y caducidad; límite de peticiones por IP                        | Base  |
| Canje en el panel    | Escanear QR o teclear código, ver saldo, descontar un importe parcial                     | Base  |
| Libro de movimientos | Emisión, canje, anulación; el saldo se deriva, no se edita                                | Base  |
| Empleados            | Cuenta por persona; cada canje guarda quién lo hizo                                       | Base  |
| Resumen diario       | Email al dueño con ventas y canjes del día                                                | Extra |
| Anular y reemitir    | Por pérdida o email equivocado; reenvío solo al email del comprador                       | Extra |
| Tarjetas físicas     | Códigos pregenerados inactivos que se activan al venderse en el local                     | Extra |

Ciclo de vida: `pendiente_pago → activa → parcialmente_usada → agotada`, con salidas a `caducada` o `anulada`.

Antisfraude, resumido:

- Límite de importe por compra y retraso de unas horas en la entrega de importes altos.
- Nunca se devuelve efectivo por el saldo; consta en las condiciones de compra.
- Bloqueo temporal tras varios códigos erróneos desde la misma IP.
- La caducidad y las condiciones las fija el comercio con su gestor; el sistema solo las hace configurables.

## Módulo Countdown

El countdown solo cuenta hacia fechas o plazas reales, y al llegar a cero cambia de verdad lo que se puede hacer en la página; es el módulo más pequeño y el más vistoso en la demo.

| Opción de config | Valores                                                                                                           | Ejemplo                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `target.type`    | `date` fija, `reservationsEvent` (cierre de un evento), `giftcardCutoff` (último día de entrega antes de Navidad) | Cenas de empresa hasta el 5 de diciembre |
| `label`          | Texto junto al contador                                                                                           | "Recibe tu tarjeta antes de Nochebuena"  |
| `seats`          | Mostrar plazas libres leídas de reservas                                                                          | "Quedan 8 plazas para Nochevieja"        |
| `onEnd`          | `hide`, `changeCta`, `closeReservations`, `warnGiftcardDelivery`                                                  | El botón pasa a "Lista de espera"        |
| `placement`      | Junto al CTA del hero o barra superior discreta                                                                   | Junto al CTA                             |

Implementación:

- La fecha límite se resuelve en el servidor en zona `Europe/Madrid` y llega al componente ya calculada; el navegador solo hace el tic de cada segundo.
- El efecto de `onEnd` se aplica también en el servidor: aunque alguien cambie el reloj del ordenador, la ruta de reservas ya rechaza la franja cerrada.
- Sin temporizadores que se reinician por visitante: la urgencia falsa es una práctica comercial engañosa en la UE y quema la confianza del cliente.

## Modelo de datos

Ocho tablas cubren los cuatro módulos; todas llevan `business_id` y políticas RLS para que un comercio nunca vea datos de otro.

| Tabla                | Campos clave                                                                                             | Módulo                            |
| -------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `businesses`         | id, slug, nombre, zona horaria                                                                           | Núcleo                            |
| `staff`              | user\_id, business\_id, rol (`owner`, `staff`)                                                           | Núcleo                            |
| `stripe_events`      | event\_id único, procesado\_en                                                                           | Núcleo (idempotencia de webhooks) |
| `availability_rules` | día de la semana, hora, aforo, evento\_id opcional                                                       | Reservas                          |
| `blocked_slots`      | fecha, hora opcional, motivo                                                                             | Reservas                          |
| `reservations`       | fecha, hora, personas, contacto, estado, señal, checkout\_session\_id, expira\_en                        | Reservas                          |
| `gift_cards`         | code\_hash único, importe inicial, saldo, estado, comprador, destinatario, envío\_programado, caduca\_en | Tarjetas                          |
| `gift_card_ledger`   | gift\_card\_id, tipo (`emision`, `canje`, `anulacion`), importe, staff\_id, creado\_en                   | Tarjetas                          |

El countdown no necesita tabla: lee la config y, si muestra plazas, consulta `availability_rules` y `reservations`. El saldo de `gift_cards` se actualiza en la misma transacción que la fila del libro, que es la fuente de verdad para auditar.

## Packs y hoja de ruta

El pack Básico es landing + countdown + WhatsApp; el Completo suma tarjetas regalo o reservas según el negocio, así que solo hace falta tener lista la base para empezar a vender el 2 de noviembre.

| Pack                        | Módulos                                 | Encaja con                                          |
| --------------------------- | --------------------------------------- | --------------------------------------------------- |
| Básico (250 €)              | Landing, countdown, CTA a WhatsApp      | Tiendas, peluquerías, cualquier negocio sin sistema |
| Completo (450 €) – tarjetas | Básico + tarjetas regalo                | Peluquerías, estética, tiendas, gimnasios           |
| Completo (450 €) – reservas | Básico + reservas con señal para grupos | Restaurantes y cenas de empresa                     |
| Extra a medida              | El otro módulo, a partir de 150 €       | Restaurantes que quieren las dos cosas              |

Orden de construcción:

1. **Hasta el 1 de noviembre:** núcleo (config, Supabase, auth), landing con 6 secciones, countdown y la demo de un restaurante ficticio desplegada.
2. **Semana del 2 de noviembre:** tarjetas regalo base (compra, webhook, PDF, email, canje en el panel), mientras haces la captación.
3. **Semana del 9 de noviembre:** reservas base (reglas, formulario atómico, confirmación, panel).
4. **Según lo que vendas:** señal de reservas, recordatorios, envío programado, resumen diario.

Qué no construir este mes: un CMS, un panel multi-tenant, una app nativa, pagos propios ni un sistema de plugins. Cada cosa de esa lista te comería una semana sin que ningún cliente la note.

Antes de cada entrega:

- [ ] Probar el pago completo en modo test de Stripe y repetir el webhook para comprobar la idempotencia.
- [ ] Lanzar dos canjes simultáneos de la misma tarjeta y verificar que solo uno pasa.
- [ ] Reservar la última plaza desde dos pestañas a la vez.
- [ ] Revisar textos legales y condiciones con el cliente.

Fases, objetivos y commits: Plan de desarrollo
