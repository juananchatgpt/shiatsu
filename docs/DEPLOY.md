# Despliegue VPS / Easypanel

## Variables obligatorias

`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SALT`, `WIDGET_ALLOWED_ORIGINS` y las variables
`SMTP_*` cuando se activen emails. No copiar valores reales al repositorio.

## Secuencia

1. Crear PostgreSQL exclusivo y configurar copias.
2. Aplicar `npm run db:apply` desde un entorno con acceso a la base.
3. Crear primer administrador con `npm run user:create`.
4. Configurar servicio desde GitHub usando `Dockerfile`, puerto 3000.
5. Comprobar `/api/health`, login, permisos y recuperación de contraseña.
6. Probar widgets en WordPress y solo entonces sustituir los plugins/directorios de prueba.

El despliegue y la modificación de WordPress requieren autorización expresa.
