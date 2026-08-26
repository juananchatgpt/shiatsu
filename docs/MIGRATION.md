# Migración de usuarios WordPress

1. Mantener el CSV en la raíz con nombre `user-export-*.csv`; está ignorado por Git y Docker.
2. Ejecutar `npm run wp:inspect`. No necesita base de datos y no escribe datos.
3. Revisar conteos y mapeo con APSE.
4. Configurar una base exclusiva, aplicar el esquema y crear copia de seguridad.
5. Ejecutar `npm run wp:import` solo con autorización expresa.
6. Reconciliar conteos SQL por `member_type` y `status` y revisar registros omitidos.

Normalización actual: `Profesor` → profesional; cuenta `um_escuela` → escuela; `approved` → activo;
resto → inactivo. Se excluyen de `legacy_data` hashes, tokens, nonces e IBAN. Los usuarios importados
requieren restablecimiento de contraseña.
