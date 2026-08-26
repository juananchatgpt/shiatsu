# Despliegue VPS / Easypanel

## Variables obligatorias

`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SALT`, `WIDGET_ALLOWED_ORIGINS` y las variables
`SMTP_*` cuando se activen emails. No copiar valores reales al repositorio.

## Secuencia

1. Crear PostgreSQL exclusivo y configurar copias.
2. Aplicar `npm run db:migrate` desde un entorno con acceso a la base. Las migraciones aplicadas son inmutables; cualquier cambio posterior debe ir en un fichero SQL numerado nuevo.
3. Crear el primer administrador definiendo temporalmente `ADMIN_PASSWORD` y ejecutando `npm run user:create -- correo@dominio.es "Nombre" admin`. Eliminar después la variable de la sesión.
4. Configurar servicio desde GitHub usando `Dockerfile`, puerto 3000.
5. Comprobar `/api/health`, login, permisos y recuperación de contraseña.
6. Probar widgets en WordPress y solo entonces sustituir los plugins/directorios de prueba.

El despliegue y la modificación de WordPress requieren autorización expresa.
