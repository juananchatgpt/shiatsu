# APSE · Gestión de socios

## Estado 2026-08-26

- Aplicación fase 1 construida desde SaaS Factory Postgres.
- PRP activo: `../../PRPs/PRP-001-gestion-socios-apse.md`.
- Implementados: altas, perfil, administración, directorio, eventos, widgets, borradores de
  comunicaciones, recuperación de contraseña e importador WordPress.
- Export inspeccionado: 401 filas; 400 con email; 180 activas, 221 inactivas; 136 alumnos,
  253 profesionales y 12 escuelas. Simulación únicamente.
- Build, typecheck y cinco pruebas de reglas críticos pasan. `npm audit`: cero vulnerabilidades.

## Pendiente del cliente/infraestructura

- `DATABASE_URL` de un Postgres exclusivo.
- Credenciales SMTP y remitente.
- Email/nombre/contraseña para crear el primer administrador (por CLI, nunca en memoria).
- Dominio final de la app y acceso WordPress para insertar widgets.
- Decisión de almacenamiento de documentos privados.
- Confirmar cuota definitiva de escuela antes de fase 2.

## Decisiones

- Auth propia + Postgres directo + SMTP + Easypanel.
- Cuotas informativas: alumno 40 €, profesional/escuela 95 €, seguro opcional +20 €.
- Fase 1 no gestiona pagos ni campañas masivas.
- Importados no conservan hashes de acceso; requieren recuperación de contraseña.
- `legacy_data` conserva metadatos privados salvo credenciales, tokens, nonces e IBAN.
