# Migración de usuarios WordPress

1. Mantener el CSV en `docs/` con nombre `user-export-*.csv`; está ignorado por Git y Docker.
2. Ejecutar `npm run wp:inspect`. No necesita base de datos y no escribe datos.
3. Revisar conteos y mapeo con APSE.
4. Configurar una base exclusiva, aplicar el esquema y crear copia de seguridad.
5. Ejecutar `npm run wp:import` solo con autorización expresa.
6. Reconciliar conteos SQL por `member_type` y `status` y revisar registros omitidos.

Normalización actual: `Profesor` → profesional; cuenta `um_escuela` → escuela; `approved` → activo;
resto → inactivo. Se excluyen de `legacy_data` hashes, tokens, nonces e IBAN. Los usuarios importados
requieren restablecimiento de contraseña.

## Ejecución del 26-08-2026

- Se creó la instantánea previa `backup_pre_wp_import_20260826` dentro de PostgreSQL.
- Se importaron 400 socios en una única transacción, sin enviar ningún correo.
- Resultado: 180 activos y 220 inactivos; 136 alumnos, 252 profesionales y 12 escuelas.
  La diferencia respecto a las 401 filas del CSV es el registro sin email, que no podía crear cuenta.
- Directorio público inicial: 120 socios activos con consentimiento.
- 384 números de socio conservados y 16 pendientes: 15 ausentes en origen y uno eliminado por
  duplicidad.
- 11 escuelas vinculadas a su profesional responsable; una queda pendiente de revisión manual.
- Los 400 socios requieren restablecer la contraseña individualmente. La importación no inició
  recuperaciones ni notificaciones.
- Reconciliación: cero usuarios miembro huérfanos y cero claves sensibles de WordPress en
  `legacy_data`.
