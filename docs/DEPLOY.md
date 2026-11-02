# Despliegue VPS / Easypanel

## Variables obligatorias

`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SALT`, `WIDGET_ALLOWED_ORIGINS` y las variables
`SMTP_*` cuando se activen emails. No copiar valores reales al repositorio.

## Correo (SMTP)

- Obligatorias para enviar: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` y `NEXT_PUBLIC_SITE_URL` (los enlaces
  de recuperación y avisos se construyen con ella; sin ella apuntan a `http://localhost:3000`).
- Opcionales: `SMTP_PORT` (587 por defecto), `SMTP_SECURE` (si falta se deduce: `true` solo en 465),
  `SMTP_FROM_EMAIL` (si falta, `SMTP_USER`), `SMTP_FROM_NAME`, `SMTP_REPLY_TO`.
- IONOS: `smtp.ionos.es`, puerto 587, `SMTP_SECURE=false`; la app exige STARTTLS en 587. El From debe
  ser el buzón autenticado o un alias suyo.
- Avisos de altas: además `REGISTRATION_EMAILS_ENABLED=true`, `APSE_SECRETARY_EMAILS` (separados por
  coma) y, opcional, `REGISTRATION_HELP_URL`. Sin `REGISTRATION_EMAILS_ENABLED=true` no se envían.
- Prueba local con las mismas credenciales: `npm run smtp:test -- --verify` (no envía) o
  `npm run smtp:test -- destinatario@dominio.es`. En producción: «¿Olvidaste tu contraseña?» con una
  cuenta propia.

## Secuencia

1. Crear PostgreSQL exclusivo y configurar copias.
2. Aplicar `npm run db:migrate` desde un entorno con acceso a la base. Las migraciones aplicadas son inmutables; cualquier cambio posterior debe ir en un fichero SQL numerado nuevo.
3. Crear el primer administrador con `npm run admin:invite -- correo@dominio.es "Nombre"`. Recibirá un enlace de 24 horas para definir su contraseña.
4. Configurar servicio desde GitHub usando `Dockerfile`, puerto 3000.
5. Comprobar `/api/health`, login, permisos y recuperación de contraseña.
6. Probar widgets en WordPress y solo entonces sustituir los plugins/directorios de prueba.

El despliegue y la modificación de WordPress requieren autorización expresa.
