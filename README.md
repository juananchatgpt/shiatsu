# APSE · Gestión de socios

Aplicación independiente para gestionar socios, directorio y eventos de la Asociación de
Profesionales de Shiatsu de España. WordPress consume la información pública mediante widgets;
PostgreSQL es la única fuente de verdad.

## Stack

- Next.js 16 + React 19 + TypeScript + Tailwind.
- PostgreSQL directo (`pg`, SQL plano).
- Autenticación propia con bcryptjs, sesiones y cookie `httpOnly`.
- SMTP con nodemailer para mensajes operativos.
- Docker standalone para GitHub → VPS/Easypanel.

## Arranque local

```powershell
Copy-Item .env.local.example .env.local
# Rellenar DATABASE_URL y, cuando proceda, SMTP_*
npm install
npm run db:apply
npm run user:create -- admin@dominio.es "contraseña-segura" "Nombre" admin
npm run dev
```

El primer usuario que se cree sin indicar rol será administrador. No existen contraseñas por
defecto.

## Verificación

```powershell
npm run wp:inspect  # simulación del export, no escribe
npm test
npm run typecheck
npm run build
npm audit
```

La importación real requiere aprobación explícita y una base preparada:

```powershell
npm run wp:import
```

## Widgets WordPress

```html
<script async
  src="https://gestion.shiatsu-apse.es/api/widgets.js"
  data-apse-widget="directory"></script>
```

Para eventos, usar `data-apse-widget="events"`. La URL definitiva se sustituirá al desplegar.

## Estado

La aplicación y el importador están construidos. Faltan credenciales/infraestructura real,
decisión de almacenamiento documental, prueba de migración contra PostgreSQL y conexión con el
WordPress nuevo. Véase `.claude/PRPs/PRP-001-gestion-socios-apse.md`.
