# APSE · Gestión de socios

## Estado 2026-08-26

- Aplicación fase 1 construida desde SaaS Factory Postgres.
- PRP activo: `../../PRPs/PRP-001-gestion-socios-apse.md`.
- Implementados: altas, perfil, administración, directorio, eventos, widgets, borradores de
  comunicaciones, recuperación de contraseña, documentos privados e importador WordPress.
- Export migrado el 2026-08-26: 400 socios creados desde 401 filas, sin enviar correos. Resultado:
  180 activos, 220 inactivos; 136 alumnos, 252 profesionales y 12 escuelas.
- `npm run build`, `typecheck`, `lint` y seis pruebas críticas pasan. `npm audit`: cero vulnerabilidades.
- Revisión independiente cerrada: API pública con proyección explícita, migraciones inmutables,
  tokens de recuperación atómicos, auditoría transaccional y reautenticación al cambiar email.
- Reconciliación: 120 perfiles visibles, 384 números conservados, 16 pendientes, 11 escuelas
  vinculadas y una sin profesional responsable; cero miembros huérfanos y cero claves sensibles.
- PostgreSQL `shiatsu` conectado y migraciones `001`/`002` aplicadas el 2026-08-26.
- Primer administrador: Juanan Sanchez (`jnansanler@gmail.com`), activación enviada por SMTP.
- GitHub remoto configurado y rama `main` publicada en `juananchatgpt/shiatsu`.
- SMTP validado tras corregir `SMTP_SECURE=true` para el puerto 465; invitación entregada al servidor.
- Aplicación desplegada y operativa: `/api/health` y la API del directorio responden correctamente.

## Pendiente del cliente/infraestructura

- Juanan debe abrir la invitación enviada a `jnansanler@gmail.com` y definir su contraseña; el enlace
  dura 24 horas y se puede regenerar con `npm run admin:invite`.
- Acceso WordPress para insertar widgets cuando corresponda.
- Resolver desde administración los 16 números de socio pendientes y la escuela sin profesional.

## Decisiones

- Auth propia + Postgres directo + SMTP + Easypanel.
- Cuotas informativas: alumno 40 €, profesional/escuela 95 €, seguro opcional +20 €.
- La cuota de escuela de 95 € queda confirmada para esta fase.
- Los documentos privados se almacenan dentro de PostgreSQL como `BYTEA`, con acceso exclusivo del
  propietario/administrador, límite de 5 MB y descarga `no-store`; entran en el backup de PostgreSQL.
- Fase 1 no gestiona pagos ni campañas masivas.
- Importados no conservan hashes de acceso; requieren recuperación de contraseña.
- Por instrucción expresa, la migración no envía ningún correo; cada socio recuperará su contraseña
  individualmente cuando necesite acceder.
- `legacy_data` conserva metadatos privados salvo credenciales, tokens, nonces e IBAN.

## Operación

- Aplicar esquema: `npm run db:migrate`; verificar: `npm run db:verify`.
- Crear o regenerar primer administrador: `npm run admin:invite -- correo "Nombre"`.
- Inspeccionar export sin escribir: `npm run wp:inspect`; importar solo con autorización mediante
  `npm run wp:import`, que genera un informe ignorado por Git.
- Instantánea previa conservada en el esquema PostgreSQL `backup_pre_wp_import_20260826`.
- Commits de cierre: `ec01a06`, `bd1284b`, `6ed493b`, `173dbe9`.
