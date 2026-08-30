# APSE · Gestión de socios

## Estado 2026-08-29

- Aplicación fase 1 construida desde SaaS Factory Postgres.
- PRP activo: `../../PRPs/PRP-001-gestion-socios-apse.md`.
- Implementados: altas, perfil, administración, directorio, eventos, widgets, borradores de
  comunicaciones, recuperación de contraseña, documentos privados e importador WordPress.
- Export migrado el 2026-08-26: 400 socios creados desde 401 filas, sin enviar correos. Resultado:
  180 activos, 220 inactivos; 136 alumnos, 252 profesionales y 12 escuelas.
- `npm run build`, `typecheck`, `lint` y trece pruebas críticas pasan. `npm audit`: cero vulnerabilidades.
- Revisión independiente cerrada: API pública con proyección explícita, migraciones inmutables,
  tokens de recuperación atómicos, auditoría transaccional y reautenticación al cambiar email.
- Reconciliación: 120 perfiles visibles, 384 números conservados, 16 pendientes, 11 escuelas
  vinculadas y una sin profesional responsable; cero miembros huérfanos y cero claves sensibles.
- Imágenes migradas a PostgreSQL: 181 (149 profesionales, 8 escuelas, 24 alumnos; 7,6 MB), sin
  correos. Tres referencias estaban rotas. Directorio: 88 fotos profesionales y 5 de escuelas;
  alumnos siempre privados. Snapshot: `backup_pre_photo_import_20260826`.
- Segundo export de directorio revisado: 414 filas; 400 coinciden exactamente por email con la
  importación principal. Se importaron 4 socios adicionales fiables (2 alumnos y 2 profesionales)
  como inactivos y sin directorio, sin correos. Se excluyeron 5 pre-registros incompletos, 3 cuentas
  de prueba/técnicas, 1 administrador técnico y Barry Davidson (#119), que carece de email.
- Recuento tras el segundo import: 404 socios; 180 activos y 224 inactivos; 138 alumnos, 254
  profesionales y 12 escuelas. Hay 386 números conservados y 18 perfiles sin número.
- Recuento real tras las pruebas del 2026-08-28: 404 socios. Se creó y posteriormente se borró un
  profesional de prueba, por lo que el total volvió al recuento posterior a la importación.
- Migración `004` aplicada: Twitter/X (3), nivel docente (9), escuelas donde imparte (7), año de
  inicio docente (8) y observaciones a notas internas (149). Snapshot:
  `backup_pre_directory_import_20260826`.
- PostgreSQL `shiatsu` conectado y migraciones `001` a `005` aplicadas.
- El directorio público usa ahora tarjetas-resumen y una ficha individual por socio. El listado no
  expone contacto, dirección ni biografía: esos datos se consultan solo al abrir una ficha pública.
- Las fichas públicas se diseñaron a partir de las 11 fichas históricas entregadas. Incluyen portada,
  logotipo/foto, contacto público, ubicación, mapa, idiomas, redes y contenido específico por tipo.
- Se añadieron a escuelas los campos `center_type` e `languages`; se recuperaron 12 emails públicos
  históricos y se limpiaron valores de relleno. Las portadas se guardan como `BYTEA` en
  `membership_cover_images`: 8 importadas, 5 visibles por estado y consentimiento. Snapshot previo:
  `backup_pre_profile_design_20260826`.
- La ficha administrativa permite editar toda la información privada, pública y específica del tipo,
  además de ver/cambiar/eliminar foto y portada. Los socios escuela también gestionan su portada.
- Verificación HTTP local: 120 fichas públicas con respuesta 200, cero fallos; una ficha y portada de
  socio inactivo devuelven 404. La API de listado devuelve únicamente ocho campos de resumen.
- Administración ampliada el 2026-08-27: alta manual de socios sin email, creación de eventos en
  borrador/revisión/publicados, borrado de borradores de comunicación, cambio de contraseña de socios
  y activación/desactivación de administradores.
- El listado administrativo separa `Socios actuales`, `Inactivos` y `Todos`, con recuentos reales.
  La búsqueda, tipo, estado y pestaña se conservan al abrir una ficha y volver al listado.
- El selector de provincias del directorio se alimenta solo de perfiles activos, visibles y con
  provincia; al elegir profesionales o escuelas se recalcula para ese tipo.
- Los filtros del directorio, tanto en la página pública como en el widget, siguen el orden de
  decisión solicitado por el cliente: tipo de perfil primero, nombre después y provincia al final.
  El widget también carga únicamente las provincias que tienen perfiles públicos para el tipo
  seleccionado y descarta cualquier provincia que ya no sea válida.
- El widget del directorio muestra tres fichas por fila en escritorio, dos en tablet y una en móvil.
- La búsqueda pública por nombre o escuela ignora mayúsculas, minúsculas y signos diacríticos
  (tildes, diéresis y `ñ`) tanto en el directorio completo como en el widget.
- Corregido el primer alta posterior a la importación: la numeración continúa la serie histórica
  solo numérica desde 934 y la secuencia queda sincronizada con el máximo existente.
- Las ubicaciones indicadas en el alta se conservan tanto en la parte privada como en la ficha
  pública. Las fechas de renovación se convierten a texto en la consulta para evitar errores 500
  al abrir una ficha recién activada.
- La ficha administrativa permite borrar definitivamente un socio escribiendo `BORRAR`. El borrado
  elimina por cascada cuenta, sesiones, perfil, documentos e imágenes y deja auditoría. No permite
  borrar un socio con una escuela o eventos vinculados: primero hay que reasignarlos. Para conservar
  historial se recomienda usar `Inactivo`.
- Los formularios de eventos muestran en español las validaciones de título, descripción y fechas;
  la descripción indica y exige en el navegador un mínimo de 20 caracteres.
- Cada evento tiene una ficha administrativa completa. Desde ella se revisan y editan organizador,
  contenido, imagen, fechas, modalidad, ubicación, contacto, inscripción, precio, destacado, notas y
  estado; seleccionar `Aprobado` lo publica. Al volver se conserva el filtro del listado.
- El listado público y el widget de eventos muestran la imagen configurada en cada evento en formato
  panorámico y adaptable; si no hay imagen, la tarjeta mantiene el diseño sin reservar hueco.
- Eventos públicos y widget ofrecen dos vistas: lista y calendario mensual con navegación entre
  meses. El calendario abre en el mes del próximo evento, muestra actividades de varios días en cada
  fecha afectada y mantiene los datos privados de moderación fuera del cliente.
- Incidencia 2026-08-28: el único evento desapareció porque se borró su socio organizador de prueba
  y la relación histórica usaba `ON DELETE CASCADE`. La migración `008` cambia la relación a
  `ON DELETE RESTRICT`; la acción administrativa también bloquea el borrado y explica que primero se
  deben reasignar los eventos. El evento eliminado no se recrea sin elegir un organizador válido.
- El resumen administrativo muestra el total de eventos y un acceso `Ver y editar todos`; el filtro
  de pendientes queda separado. La lista vacía explica si no hay eventos o si el filtro no encuentra
  resultados. El administrador puede editar eventos de cualquier estado desde su ficha.
- El alta administrativa de eventos exige asignar un profesional o escuela activo. El formulario lo
  explica y valida el organizador antes de consultar PostgreSQL, mostrando un error claro si falta o
  dejó de estar activo; el resto de validaciones también se devuelve en español dentro del formulario.
- Corregido el error PostgreSQL `42804` del alta administrativa: los UUID de `reviewed_by` dentro de
  expresiones condicionales se convierten explícitamente a `uuid` tanto al crear como al editar. Se
  probaron en una transacción con rollback los estados borrador, pendiente, aprobado y rechazado.
- Juanan confirmó el 2026-08-28 que la creación de eventos desde Administración ya funciona en
  producción tras desplegar el commit `0810a06`.
- Implementado el flujo de altas `Pendiente de revisión -> Pre-registro -> Activo`. Aprobar ya no
  activa ni numera: la activación automática exige perfil obligatorio completo y pago confirmado
  manualmente por Secretaría. La migración `009` se aplicó sin modificar los 180 activos ni los 224
  inactivos existentes.
- La ficha administrativa muestra por separado aprobación, perfil y pago; permite confirmar el pago
  y explica qué condición falta. Un profesional requiere una titulación marcada como válida antes de
  aprobar el alta. El área privada guía al solicitante y valida campos obligatorios por tipo; si pide
  directorio también exige los datos públicos esenciales.
- Preparados los avisos transaccionales de solicitud, decisión y Secretaría, sin contraseñas en los
  mensajes. Permanecen totalmente desactivados mientras `REGISTRATION_EMAILS_ENABLED` no sea `true`.
- Código del nuevo flujo publicado en GitHub con el commit `6876f51` y migración `009` aplicada a
  PostgreSQL. Juanan desplegó después el contenedor y se verificaron en producción `/api/health`,
  registro, directorio, eventos y ambos embeds con respuesta 200; los chunks servidos coinciden con
  el build local.
- Incidencia detectada el 2026-08-30 en `https://alza-t.com/prueba`: `widgets.js` construía el iframe
  con `https://0.0.0.0:80` porque tomaba el origen interno de la petición tras el proxy de Easypanel.
  Se corrigió para obtener siempre el origen público desde `document.currentScript.src` y se añadió
  una prueba de regresión. Los códigos de integración usan un parámetro de versión para evitar la
  copia anterior del script en caché. Tras el despliegue se verificó en la página real de WordPress:
  el iframe apunta a `https://shiatsu.alza-t.com/embed/directorio`, muestra las fichas y no registra
  errores; si un navegador conserva el error anterior necesita una recarga forzada.
- Fuera de esa incidencia, los widgets admiten cualquier web: `widgets.js` y las APIs públicas
  responden con `Access-Control-Allow-Origin: *`, y los embeds no envían `X-Frame-Options` ni una
  política `frame-ancestors`. `WIDGET_ALLOWED_ORIGINS` existe en el entorno de ejemplo pero el código
  no lo aplica; restringir dominios requeriría una adaptación posterior.
- La portada `/` es ahora el login. La cabecera pública no muestra menú y su marca APSE enlaza a
  `https://shiatsu.ochoesferas.com/`; el menú autenticado de socios y administración se conserva.
- Aplicada la guía visual del cliente del 2026-08-30 a altas, directorio, fichas y eventos: tarjetas,
  inputs e imágenes a 8 px; botones a 3 px; acentos `#7BB07C` y `#538A54`; hover negro en eventos;
  etiquetas con 1 px de espaciado; H1 de alta a 40/32/26 px y título del tipo a 36 px. La revisión
  visual confirmó los tamaños responsive y radios tanto en escritorio como en móvil.
- Cambiar una contraseña desde administración cierra las sesiones e invalida recuperaciones abiertas.
  Desactivar un administrador cierra sus sesiones; no se permite desactivar la cuenta propia ni dejar
  el sistema sin un administrador activo.
- Primer administrador: Juanan Sanchez (`jnansanler@gmail.com`), activación enviada por SMTP.
- GitHub remoto configurado y rama `main` publicada en `juananchatgpt/shiatsu`.
- SMTP validado tras corregir `SMTP_SECURE=true` para el puerto 465; invitación entregada al servidor.
- Aplicación desplegada y operativa: `/api/health` y la API del directorio responden correctamente.
- El despliegue de `alzat/shiatsuapp` en `easypanel.alza-t.com` es manual: el push a `main` no lanza
  el build. Si el panel no está autenticado, se puede construir una imagen desde `git archive` por
  SSH y actualizar únicamente la imagen del servicio, conservando su configuración y verificando
  después la web y `/api/health`.
- Actualizado el borrador de presentación al cliente con el flujo de pre-registro, perfil completo,
  pago confirmado, avisos desactivados, alcance de fase 1 y enlaces de revisión. Está guardado en
  `../reference/correo-cliente-estado-fase-1-2026-08-28.md` y no se ha enviado.
- Juanan enviará personalmente el correo de presentación al cliente y avisará después. La aplicación
  y el agente no deben enviarlo ni iniciar comunicaciones por su cuenta.

## Pendiente del cliente/infraestructura

- Juanan debe abrir la invitación enviada a `jnansanler@gmail.com` y definir su contraseña; el enlace
  dura 24 horas y se puede regenerar con `npm run admin:invite`.
- Acceso WordPress para insertar widgets cuando corresponda.
- Resolver desde administración los 16 números de socio pendientes y la escuela sin profesional.
- Para activar los avisos de altas: confirmar emails de Secretaría, revisar textos y aportar la URL
  del PDF/ayuda; después configurar las variables y hacer una prueba controlada con autorización.

## Decisiones

- Auth propia + Postgres directo + SMTP + Easypanel.
- Cuotas informativas: alumno 40 € y profesional/escuela 95 €. El seguro es solo una casilla de
  interés y no tiene precio asociado ni incrementa la cuota en fase 1.
- La cuota de escuela de 95 € queda confirmada para esta fase.
- Los documentos privados se almacenan dentro de PostgreSQL como `BYTEA`, con acceso exclusivo del
  propietario/administrador, límite de 5 MB y descarga `no-store`; entran en el backup de PostgreSQL.
- Las fotos usan `membership_profile_photos`; solo profesionales/escuelas pueden subir nuevas y la
  ruta pública exige socio activo, consentimiento de directorio y tipo profesional/escuela.
- Las portadas usan `membership_cover_images`; son exclusivas de escuelas y aplican las mismas reglas
  de privacidad pública que las fotos.
- Fase 1 solo registra manualmente la confirmación del primer pago; no cobra ni gestiona impagos,
  renovaciones o GoCardless. Las campañas masivas siguen fuera de alcance.
- Las altas manuales administrativas crean una contraseña inicial y no envían ningún correo. Si el
  estado inicial es activo y no se indica número, la aplicación asigna el siguiente número APSE.
- Los eventos creados por administración se vinculan siempre a un profesional o escuela activos y
  las horas se interpretan explícitamente en `Europe/Madrid`.
- Importados no conservan hashes de acceso; requieren recuperación de contraseña.
- Por instrucción expresa, la migración no envía ningún correo; cada socio recuperará su contraseña
  individualmente cuando necesite acceder.
- El segundo importador solo crea socios fiables como `inactive` y sin directorio; excluye
  pre-registros, pruebas, administradores técnicos, contraseñas e IBAN.
- `legacy_data` conserva metadatos privados salvo credenciales, tokens, nonces e IBAN.

## Operación

- Aplicar esquema: `npm run db:migrate`; verificar: `npm run db:verify`.
- Crear o regenerar primer administrador: `npm run admin:invite -- correo "Nombre"`.
- Inspeccionar export sin escribir: `npm run wp:inspect`; importar solo con autorización mediante
  `npm run wp:import`, que genera un informe ignorado por Git.
- Instantánea previa conservada en el esquema PostgreSQL `backup_pre_wp_import_20260826`.
- Commits de cierre: `ec01a06`, `bd1284b`, `6ed493b`, `173dbe9`, `3f0dcfb`, `fe3b475`.
