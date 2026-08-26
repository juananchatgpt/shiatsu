# APSE · Gestión de socios

## Estado 2026-08-26

- Aplicación fase 1 construida desde SaaS Factory Postgres.
- PRP activo: `../../PRPs/PRP-001-gestion-socios-apse.md`.
- Implementados: altas, perfil, administración, directorio, eventos, widgets, borradores de
  comunicaciones, recuperación de contraseña, documentos privados e importador WordPress.
- Export inspeccionado: 401 filas; 400 con email; 180 activas, 221 inactivas; 136 alumnos,
  253 profesionales y 12 escuelas. Simulación únicamente.
- `npm run build`, `typecheck`, `lint` y seis pruebas críticas pasan. `npm audit`: cero vulnerabilidades.
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

- Crear/conectar el servicio de Easypanel al repositorio `juananchatgpt/shiatsu`, rama `main`,
  `Dockerfile`, puerto 3000 y las variables del `.env.local`. El DNS resuelve, pero la app no responde.
- Juanan debe abrir la invitación enviada a `jnansanler@gmail.com` y definir su contraseña; el enlace
  dura 24 horas y se puede regenerar con `npm run admin:invite`.
- Acceso WordPress para insertar widgets cuando corresponda.
- Revisar y autorizar expresamente la importación del export WordPress; por ahora solo hay simulación.

## Decisiones

- Auth propia + Postgres directo + SMTP + Easypanel.
- Cuotas informativas: alumno 40 €, profesional/escuela 95 €, seguro opcional +20 €.
- La cuota de escuela de 95 € queda confirmada para esta fase.
- Los documentos privados se almacenan dentro de PostgreSQL como `BYTEA`, con acceso exclusivo del
  propietario/administrador, límite de 5 MB y descarga `no-store`; entran en el backup de PostgreSQL.
- Fase 1 no gestiona pagos ni campañas masivas.
- Importados no conservan hashes de acceso; requieren recuperación de contraseña.
- `legacy_data` conserva metadatos privados salvo credenciales, tokens, nonces e IBAN.

## Operación

- Aplicar esquema: `npm run db:migrate`; verificar: `npm run db:verify`.
- Crear o regenerar primer administrador: `npm run admin:invite -- correo "Nombre"`.
- Inspeccionar export sin escribir: `npm run wp:inspect`; importar solo con autorización mediante
  `npm run wp:import`, que genera un informe ignorado por Git.
- Commits de cierre: `ec01a06`, `bd1284b`, `6ed493b`, `173dbe9`.
