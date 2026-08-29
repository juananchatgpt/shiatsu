# Proceso de registro indicado por el cliente · 2026-08-29

El cliente describe el siguiente flujo histórico:

1. El solicitante crea su propia contraseña y presenta la solicitud.
2. Solicitante y Secretaría reciben avisos; el perfil queda `pendiente de revisión`.
3. Secretaría revisa los datos y, en profesionales, también el PDF aportado.
4. Al aprobar, el solicitante recibe bienvenida, acceso a la intranet y ayuda para completar el
   perfil; Secretaría recibe confirmación. El estado pasa a `aprobado` o `pre-registro`.
5. El socio completa los campos obligatorios, fotos, redes y preferencia de directorio.
6. La cuota se abona durante el pre-registro y Secretaría confirma manualmente el pago.
7. Al activarse se asigna el número de socio. Profesionales y escuelas solo aparecen en el
   directorio si lo eligen; la opción por defecto es no aparecer. Alumnos nunca son públicos.
8. Un rechazo cambia el estado a `rechazado` y genera su aviso transaccional.

## Diferencias con la aplicación actual

- Actualmente `pending -> active` es un único paso administrativo: falta el estado intermedio de
  aprobado/pre-registro.
- La activación actual asigna inmediatamente el número de socio.
- No existe confirmación manual de pago ni sus campos de auditoría.
- El perfil se puede editar, pero no se exige que todos los campos propios del tipo estén completos.
- Las altas, aprobaciones y rechazos no generan todavía los avisos transaccionales descritos.
- La contraseña elegida por el solicitante y la privacidad del directorio ya coinciden con el flujo.

## Decisión aplicada

El mensaje afirma primero que Secretaría activa el perfil cuando confirma el pago, pero después dice
que completar el perfil lo vuelve activo. El 2026-08-29 se adopta la regla más segura: activar solo
cuando concurran `pago confirmado` y `perfil completo`; Secretaría confirma el pago y el sistema
asigna el número una sola vez cuando se cumplen ambas condiciones.

El flujo se aplica a alumnos, profesionales y escuelas. Falta obtener destinatario(s) de Secretaría,
validar textos de correo y aportar el PDF/enlace de ayuda. Los avisos están detrás de
`REGISTRATION_EMAILS_ENABLED=false`; no se enviará ningún correo real sin activación expresa.
