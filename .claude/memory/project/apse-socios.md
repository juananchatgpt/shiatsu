# APSE · Gestión de socios

## Estado 2026-08-26

- Aplicación fase 1 construida desde SaaS Factory Postgres.
- PRP activo: `../../PRPs/PRP-001-gestion-socios-apse.md`.
- Implementados: altas, perfil, administración, directorio, eventos, widgets, borradores de
  comunicaciones, recuperación de contraseña e importador WordPress.
- Export inspeccionado: 401 filas; 400 con email; 180 activas, 221 inactivas; 136 alumnos,
  253 profesionales y 12 escuelas. Simulación únicamente.
- Build, typecheck y seis pruebas críticas pasan. `npm audit`: cero vulnerabilidades.
- Revisión independiente cerrada: API pública con proyección explícita, migraciones inmutables,
  tokens de recuperación atómicos, auditoría transaccional y reautenticación al cambiar email.
- El export tiene un número de socio duplicado; el importador lo informa y genera reconciliación.
- PostgreSQL `shiatsu` conectado y migraciones `001`/`002` aplicadas el 2026-08-26.
- Primer administrador: Juanan Sanchez (`jnansanler@gmail.com`), activación enviada por SMTP.
- GitHub remoto configurado y rama `main` publicada en `juananchatgpt/shiatsu`.
- SMTP validado tras corregir `SMTP_SECURE=true` para el puerto 465; invitación entregada al servidor.
- El dominio configurado resuelve DNS, pero `/api/health` aún no acepta conexiones: falta o está
  pendiente el servicio de Easypanel.

## Pendiente del cliente/infraestructura

- Acceso WordPress para insertar widgets cuando corresponda.
- Los documentos privados se almacenan dentro de PostgreSQL como `BYTEA`,
  con acceso autenticado y límite de 5 MB por archivo; deben entrar en la copia de seguridad de la BBDD.
- Confirmar cuota definitiva de escuela antes de fase 2.

## Decisiones

- Auth propia + Postgres directo + SMTP + Easypanel.
- Cuotas informativas: alumno 40 €, profesional/escuela 95 €, seguro opcional +20 €.
- Fase 1 no gestiona pagos ni campañas masivas.
- Importados no conservan hashes de acceso; requieren recuperación de contraseña.
- `legacy_data` conserva metadatos privados salvo credenciales, tokens, nonces e IBAN.
