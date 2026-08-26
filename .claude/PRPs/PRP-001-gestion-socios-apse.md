# PRP-001: Gestión de socios de APSE

> **State**: IN PROGRESS
> **Date**: 2026-08-26
> **Project**: 21. Shiatsu — APSE

---

## Objective

Construir una aplicación independiente para la **gestión de socios de APSE** que sea la fuente
única de verdad de las cuentas, perfiles, altas, estados, seguros, directorio público y eventos.
La nueva web WordPress consumirá el directorio y el calendario mediante widgets externos, sin
mantener una segunda copia de esos datos.

## Why

| Problema | Solución |
|---------|----------|
| La gestión actual está repartida entre la web pública, la intranet WordPress y procesos manuales | Centralizar cuentas, perfiles, estados y administración en una aplicación y un Postgres propios |
| Los socios no disponen de un flujo único para mantener sus datos | Área privada donde cada socio modifica toda su información, incluido el correo |
| El directorio actual no funciona de forma fiable | Directorio público alimentado únicamente por socios activos que acepten aparecer |
| Los eventos dependen de la administración de WordPress | Alta por profesionales y escuelas, con moderación antes de su publicación |
| La futura gestión de cuotas necesita una base consistente | Preparar membresías, importes y fechas de aniversario sin implementar cobros todavía |

**Valor de negocio**: APSE podrá administrar el ciclo de vida de sus socios desde un único
sistema, reducir duplicidades y publicar directorio y eventos en la nueva web con datos actuales.

## What

### Alcance de la fase 1

#### Tipos de cuenta y perfiles

- **Alumno**: cuenta propia. No aparece nunca en el directorio.
- **Profesional**: cuenta propia. Puede optar por aparecer o no en el directorio y puede proponer
  eventos.
- **Escuela**: cuenta propia. Puede optar por aparecer o no en el directorio y puede proponer
  eventos.
- **Administrador**: un único perfil de permisos, asignable a varias cuentas. Juanan será el
  primer administrador, creado mediante un proceso seguro sin credenciales versionadas.
- Docente y centro asociado desaparecen como categorías. Un docente se trata como profesional.
- Un alumno no se transforma en profesional: se crea una cuenta profesional nueva.
- Una escuela solo puede darse de alta cuando la persona registradora ya sea un profesional APSE
  aprobado, y cada profesional podrá registrar como máximo una escuela.

#### Cuotas informativas

- Alumno: **40 € anuales**.
- Profesional: **95 € anuales**.
- Seguro opcional para profesional: **+20 € anuales**.
- Escuela: **95 € anuales provisionalmente**, pendiente de revisión antes de activar pagos.
- Seguro opcional para escuela: **+20 € anuales**.
- El seguro es un check en el alta; no es una póliza ni un flujo documental separado.
- Cada alta tendrá su propia fecha de aniversario.
- La fase 1 no controla pagos, impagos ni renovaciones y no integra GoCardless.

> La cuota de escuela se interpreta provisionalmente como 95 € porque la respuesta recibida fue
> “me valen” sobre los importes propuestos. Debe validarse explícitamente antes de la fase 2.

#### Alta y ciclo del socio

- Formularios diferenciados para alumno, profesional y escuela.
- Solo las altas requieren aprobación administrativa.
- Después de aprobada el alta, el socio puede cambiar todos sus datos, incluido el correo, sin
  nueva aprobación.
- Estados iniciales previstos: `pending`, `active`, `inactive`, `suspended` y `rejected`.
- La visibilidad pública es una elección binaria del profesional o escuela. Si no la activa, no se
  publica ningún dato de su perfil.
- DNI/NIE, documentos, estados administrativos y demás información privada nunca se exponen en
  APIs ni widgets públicos.

#### Datos mínimos de alta

- **Alumno**: nombre, apellidos, escuela de procedencia, DNI/NIE, teléfono, correo, contraseña,
  aceptación de privacidad.
- **Profesional**: nombre, apellidos, DNI/NIE, teléfono, correo, contraseña, titulación/documento,
  seguro opcional, consentimiento de directorio y datos públicos del perfil.
- **Escuela**: profesional responsable, nombre, DNI/NIE del responsable, teléfono, correo,
  contraseña, programa formativo, relación de profesionales/docentes, acreditación de dirección,
  seguro opcional, consentimiento de directorio y datos públicos del perfil.
- Las reglas definitivas de formatos, tamaños y conservación documental se fijarán antes de
  implementar la subida de archivos. Como referencia, el sistema antiguo admitía PDF para la
  titulación profesional y ZIP/RAR de hasta 5 MB para la documentación de escuela.

#### Área privada

- Inicio y cierre de sesión, recuperación de contraseña y cambio seguro de correo/contraseña.
- Edición de todos los datos propios.
- Separación visual entre datos privados y datos que se publicarían en el directorio.
- Activación/desactivación de la presencia pública con previsualización de la ficha.
- Consulta del estado de alta y de los eventos enviados.
- Profesional responsable: acceso a la escuela vinculada sin asumir que comparte su cuenta.

#### Administración

- Listado y ficha de todos los socios, activos e inactivos.
- Filtros por tipo, estado, seguro, visibilidad y fechas.
- Aprobación o rechazo de altas con motivo interno.
- Activación, suspensión y baja/inactivación de socios.
- Gestión de varias cuentas administradoras con un único perfil de permisos.
- Historial de acciones: actor, acción, entidad afectada, fecha y datos relevantes del cambio.
- Estructura para comunicaciones: destinatarios segmentables, plantillas, borradores, lotes y
  registro de entregas, **sin envío masivo en fase 1**.
- La revista anual y las newsletters se diseñarán e implementarán en fase 2.

#### Directorio público y widget

- Publica exclusivamente profesionales y escuelas `active` con visibilidad aceptada.
- Filtros: provincia, tipo (profesional/escuela), nombre y escuela vinculada.
- Ficha/tarjeta pública con campos configurados para publicación; nunca reutilizar directamente
  el registro privado.
- API pública de solo lectura, con validación, paginación y protección contra abuso.
- Widget insertable en WordPress mediante un fragmento HTML estable.
- La aplicación es la fuente única; WordPress no guarda copias editables del directorio.
- Antes de implementar se elegirá entre iframe aislado o script/custom element según la necesidad
  de indexación SEO y compatibilidad real con el WordPress nuevo.

#### Eventos

- Pueden crear eventos los profesionales y escuelas activos.
- Flujo: `draft` → `pending_review` → `approved` o `rejected`; también `cancelled`.
- Solo los eventos aprobados se muestran públicamente.
- Una modificación relevante de un evento aprobado vuelve a `pending_review`.
- Campos propuestos a partir del calendario actual y de un uso general:
  - título y descripción;
  - imagen principal;
  - fecha/hora de inicio y fin, evento de día completo y zona horaria `Europe/Madrid`;
  - modalidad presencial, online o híbrida;
  - recinto, dirección, municipio, provincia, código postal y país;
  - URL de acceso/inscripción y datos públicos de contacto;
  - organizador vinculado al socio creador;
  - evento gratuito o precio, importe y moneda;
  - destacado;
  - notas de moderación privadas;
  - fecha de envío, aprobación, rechazo y administrador revisor.
- Recurrencia, aforo, venta de entradas y eventos exclusivos para socios quedan fuera del alcance
  salvo aprobación posterior.
- Widget público con vista de lista/calendario y ficha de evento.

#### Migración

- Se importarán socios activos e inactivos con toda la información disponible en la exportación
  del WordPress actual.
- La migración no se diseña contra suposiciones: primero se inspeccionará el fichero/export real.
- Se preparará un mapeo reproducible, informe de errores y reconciliación de conteos por tipo y
  estado.
- Las contraseñas solo se reutilizarán si el formato exportado es compatible y seguro; de lo
  contrario se obligará a restablecerlas.
- No se migran eventos ni contenidos WordPress en este PRP.

#### Fuera de alcance — fase 2

- GoCardless, cobro anual, mandatos, webhooks, impagos y renovaciones.
- Envío de revista anual y newsletters.
- Automatizaciones de comunicación.
- Transformación de alumno en profesional.
- Venta o reserva de plazas para eventos.

### Success Criteria — Definition of Done

- [ ] Alumno, profesional y escuela pueden solicitar el alta con validaciones de servidor y reciben
      un estado `pending` sin quedar activos automáticamente.
- [ ] Un administrador puede aprobar/rechazar altas y gestionar socios activos e inactivos.
- [ ] Se pueden crear varias cuentas administradoras, todas con el mismo perfil de permisos.
- [ ] El primer administrador se crea sin contraseñas en Git, documentación o scripts.
- [ ] Cada socio puede iniciar sesión, recuperar su contraseña y modificar todos sus datos.
- [ ] Cambiar el correo mantiene la seguridad de la cuenta y evita duplicados.
- [ ] Solo profesionales y escuelas activos pueden crear eventos.
- [ ] Ningún evento se publica sin aprobación administrativa.
- [ ] Un cambio relevante en un evento aprobado lo retira de publicación hasta nueva aprobación.
- [ ] Los alumnos nunca aparecen en el directorio.
- [ ] Profesionales y escuelas solo aparecen si están activos y han activado expresamente su
      visibilidad pública.
- [ ] Desactivar la visibilidad elimina toda la ficha de los resultados públicos.
- [ ] Los widgets de directorio y eventos funcionan dentro del WordPress nuevo en escritorio y
      móvil, sin heredar ni romper estilos del tema.
- [ ] DNI/NIE, documentos, correo de acceso, estados internos y notas administrativas no aparecen
      en respuestas públicas.
- [ ] La estructura de comunicaciones admite borradores, segmentos y lotes, pero no permite
      ejecutar envíos masivos en fase 1.
- [ ] La importación se valida contra el export real y reconcilia el total de socios activos e
      inactivos, con informe de filas omitidas o erróneas.
- [ ] Hay control de acceso en listado, ficha y acciones de escritura; conocer una URL no permite
      saltarse los permisos.
- [ ] Las operaciones críticas dejan auditoría.
- [ ] `npm run typecheck` finaliza correctamente.
- [ ] Las pruebas automatizadas de reglas críticas y permisos finalizan correctamente.
- [ ] `npm run build` finaliza correctamente.
- [ ] La aplicación se valida en navegador en escritorio y móvil.
- [ ] No se despliega ni se toca producción sin aprobación expresa.

### Expected Behavior

1. Una persona elige alumno, profesional o escuela y completa su alta.
2. La aplicación valida los datos, guarda la solicitud pendiente y avisa al administrador.
3. El administrador revisa y aprueba o rechaza el alta.
4. Tras la aprobación, el socio gestiona su información y, si corresponde, decide si aparece en
   el directorio.
5. Profesionales y escuelas activos pueden enviar eventos a revisión.
6. El administrador aprueba el evento y este aparece automáticamente en la API y widget públicos.
7. WordPress muestra directorio y eventos sin administrar sus datos.

### Restricciones de ejecución

#### Siempre

- Postgres propio y directo, autenticación propia y SMTP.
- Una sola definición de permisos aplicada a listados, fichas y acciones.
- Validación Zod en entradas y validación equivalente en base de datos cuando proceda.
- Fechas de negocio interpretadas en `Europe/Madrid`.
- Separación entre datos privados y representación pública.
- Copias de seguridad incluidas en el plan de despliegue.

#### Preguntar antes

- Crear el repositorio remoto de GitHub.
- Desplegar o cambiar WordPress/producción.
- Ejecutar la importación definitiva.
- Enviar correos reales.
- Elegir y fijar el método definitivo de almacenamiento de documentos.
- Activar cuotas, seguros cobrables o GoCardless.

#### Nunca

- Versionar credenciales, `.env`, documentos privados o exportaciones reales de socios.
- Dar de alta automáticamente como activo a un solicitante.
- Publicar alumnos o socios que no hayan aceptado aparecer.
- Mantener WordPress y la aplicación como dos fuentes editables del mismo dato.
- Mezclar datos de otros clientes.
- Inventar campos o valores durante la migración.

---

## Context

### References

- `Prompt.docx` — encargo inicial.
- `ReunionMarila.m4a` — archivo de referencia; el usuario confirma que no cambia el proyecto y no
  debe procesarse.
- `DATOS.txt` — contiene credenciales en texto plano; no debe entrar al repositorio y las
  credenciales deben trasladarse a `.env.local` y rotarse.
- <https://shiatsu-apse.es/hazte-socio-de-apse/> — tipos y cuotas del sistema anterior.
- <https://directorio.shiatsu-apse.es/registro-de-estudiantes/> — campos de alumno.
- <https://directorio.shiatsu-apse.es/registro-de-profesionales/> — campos y titulación.
- <https://directorio.shiatsu-apse.es/registro-de-escuelas/> — documentación y regla de registro.
- <https://shiatsu-apse.es/eventos/> — campos y vistas del calendario anterior.
- <https://shiatsu.ochoesferas.com/> — diseño de la nueva web.
- <https://shiatsu.ochoesferas.com/directorios/> — ubicación prevista del widget de directorio.
- <https://shiatsu.ochoesferas.com/eventos/> — ubicación prevista del widget de eventos.

### Stack

| Capa | Tecnología |
|------|------------|
| Aplicación | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | PostgreSQL directo con `DATABASE_URL` y `pg` |
| Autenticación | `users` + `sessions`, bcryptjs, cookie `httpOnly` |
| Validación | Zod + restricciones SQL |
| Correo | SMTP con nodemailer; solo mensajes operativos en fase 1 |
| Archivos | Privados; mecanismo por validar antes de implementación |
| Integración pública | API de solo lectura + widgets HTML para WordPress |
| Despliegue | GitHub → VPS/Easypanel, Docker Next standalone |

### Arquitectura propuesta — Feature-First

```text
src/
├── app/
├── features/
│   ├── auth/
│   ├── memberships/
│   ├── students/
│   ├── professionals/
│   ├── schools/
│   ├── directory/
│   ├── events/
│   ├── admin/
│   ├── communications/
│   ├── audit/
│   └── imports/
├── lib/
└── widgets/
db/
├── schema.sql
└── migrations/
```

### Modelo de datos conceptual

```text
users ──1:1/1:N── memberships ──1:1── student_profiles
                           ├────1:1── professional_profiles
                           └────1:1── school_profiles

professional_profiles ──0:1── school_profiles (responsable; máximo una escuela)
memberships ──1:N── membership_documents
memberships ──1:N── events
users ──1:N── sessions
users ──1:N── audit_log

events ── estado editorial + copia pública aprobada
public_directory_entries ── proyección pública, no tabla privada expuesta
communication_drafts ── segments ── batches ── deliveries (sin envío masivo en fase 1)
```

La forma SQL definitiva se decide al entrar en la fase de datos. Los importes y estados que pueden
cambiar con el negocio se almacenarán como configuración/datos, no como reglas dispersas en código.

---

## Decisiones a validar

1. Cuota base definitiva de escuela antes de implementar la fase 2.
2. Campos públicos exactos de las fichas de profesional y escuela.
3. Catálogo de provincias y relación buscable entre escuela y profesional.
4. Formatos, tamaño máximo, conservación y almacenamiento de documentos privados.
5. Si el cambio de correo exige confirmar la dirección nueva antes de sustituir la anterior.
6. Método del widget: iframe o script/custom element, tras probarlo en el WordPress real y decidir
   el requisito SEO.
7. Campos definitivos de eventos y si se incorporan recurrencia, aforo o eventos privados.
8. Formato real de la exportación WordPress y estrategia de contraseñas.
9. Dominio/subdominio final de la aplicación y URLs públicas de widgets.
10. Proveedor SMTP y límites reales antes de activar mensajes operativos.

---

## Blueprint (Assembly Line)

> Solo se definen fases. Las subtareas se generan al entrar en cada fase con su contexto real.

### Phase 1: Inicialización segura y contrato técnico
**Objective**: crear el proyecto desde SaaS Factory Postgres preservando los archivos de referencia,
inicializar su silo de memoria y definir configuración, amenazas y límites de datos.
**Validation**: plantilla Postgres reconocible, secretos fuera de Git, proyecto base compilable y
decisiones bloqueantes de datos documentadas.

### Phase 2: Modelo de datos, autenticación y permisos
**Objective**: implementar el esquema, sesiones, roles, estados, auditoría y reglas de autorización.
**Validation**: migraciones idempotentes y pruebas que demuestren aislamiento entre socio,
administrador y superficie pública.

### Phase 3: Altas, perfiles y área privada
**Objective**: completar los tres flujos de alta, aprobación y mantenimiento de datos.
**Validation**: los tres perfiles recorren su happy path y los casos de rechazo/duplicidad quedan
cubiertos sin publicar datos privados.

### Phase 4: Administración
**Objective**: gestionar altas y el ciclo de vida de socios activos e inactivos, con auditoría.
**Validation**: un administrador puede operar todos los estados y otro usuario no puede acceder ni
forzar acciones por URL.

### Phase 5: Directorio y widget WordPress
**Objective**: crear la proyección pública, buscador y widget integrado con el diseño nuevo.
**Validation**: solo aparecen profesionales/escuelas activos con consentimiento, los filtros son
correctos y el widget funciona en escritorio/móvil dentro del WordPress real.

### Phase 6: Eventos y widget de calendario
**Objective**: implementar creación, moderación, publicación y calendario público.
**Validation**: ningún evento pendiente se filtra públicamente y las modificaciones relevantes
obligan a una nueva aprobación.

### Phase 7: Estructura de comunicaciones
**Objective**: dejar preparados borradores, segmentos, lotes y trazabilidad sin ejecutar campañas.
**Validation**: no existe una acción pública/administrativa capaz de enviar una campaña masiva en
fase 1; los mensajes operativos sí quedan separados.

### Phase 8: Migración desde WordPress
**Objective**: importar socios activos e inactivos desde el export real de forma reproducible.
**Validation**: conteos reconciliados, errores informados, contraseñas tratadas de forma segura y
ejecución definitiva autorizada expresamente.

### Phase 9: Seguridad, QA y preparación de despliegue
**Objective**: verificar el sistema completo y dejar preparado GitHub→VPS/Easypanel.
**Validation**:
- [x] `npm run typecheck` pasa.
- [x] Pruebas automatizadas críticas pasan.
- [x] `npm run build` finaliza correctamente.
- [x] QA en navegador de escritorio y móvil.
- [x] Permisos y APIs públicas revisados.
- [ ] Copia de seguridad y restauración documentadas/probadas.
- [ ] Success Criteria satisfechos.
- [ ] Deploy ejecutado únicamente con autorización expresa.

---

## Learnings (Self-Shielding)

> Esta sección crecerá con los errores y hallazgos durante la implementación.

### 2026-08-26: `useSearchParams` bloquea el prerender sin Suspense
- **Error**: el build falló al prerenderizar la página de restablecimiento.
- **Fix**: leer `searchParams` en el Server Component y pasar el token a un formulario cliente.
- **Apply to**: páginas públicas con parámetros que no necesitan navegación reactiva en cliente.

### 2026-08-26: scripts `tsx` del proyecto se transforman como CommonJS
- **Error**: el importador falló por usar `await` en el nivel superior.
- **Fix**: envolver los scripts en `async function main()` y capturar el error al final.
- **Apply to**: scripts CLI de migración, importación y mantenimiento.

### 2026-08-26: una migración aplicada debe ser inmutable
- **Error evitado**: reaplicar un `schema.sql` con `CREATE IF NOT EXISTS` no evoluciona columnas y puede registrar un checksum engañoso.
- **Fix**: migraciones SQL numeradas; si cambia el checksum de una aplicada, el proceso falla y exige crear otra.
- **Apply to**: todos los cambios de esquema después de `001_initial.sql`.

### 2026-08-26: la proyección pública no puede devolver filas internas
- **Riesgo**: `SELECT e.*` contenía estado, moderación e identificadores internos.
- **Fix**: mapper explícito probado que solo devuelve el contrato público.
- **Apply to**: cualquier API o widget público nuevo.

### 2026-08-26: documentos pequeños dentro de PostgreSQL
- **Decisión**: APSE prevé pocos PDF/imágenes; se almacenan como `BYTEA` con límite de 5 MB.
- **Seguridad**: descarga autenticada, autorización por propietario/administrador y respuesta `no-store`.
- **Operación**: los documentos quedan incluidos en la copia y restauración de PostgreSQL.

---

## Gotchas

- [ ] El directorio existente está averiado; no tomar su comportamiento como contrato correcto.
- [ ] El directorio y los eventos de la nueva web contienen datos de prueba/plugins WordPress; no
      convertirlos en una segunda fuente de verdad.
- [ ] La carpeta de destino ya contiene archivos, por lo que `nuevo-proyecto.ps1` no puede ejecutarse
      directamente mientras no esté vacía. La inicialización debe preservarlos explícitamente.
- [ ] `DATOS.txt` contiene credenciales y debe quedar fuera de Git antes de inicializarlo.
- [ ] Cambiar el email sin confirmación puede permitir errores de escritura o apropiación de cuenta;
      validar la decisión antes de implementar.
- [ ] Aprobación de alta y estado de socio son conceptos diferentes.
- [ ] Filtrar un listado no sustituye el permiso en ficha y escritura.
- [ ] Un evento aprobado editado no puede seguir publicando silenciosamente datos no moderados.
- [ ] La fecha de aniversario es individual y no debe derivarse en UTC con `toISOString()`.
- [ ] La futura fase GoCardless requerirá idempotencia y verificación de webhooks; no anticipar su
      comportamiento sin revisar la API oficial vigente al implementarla.

## Anti-Patterns

- DO NOT crear patrones nuevos cuando la SaaS Factory ya proporcione uno válido.
- DO NOT ignorar errores TypeScript.
- DO NOT hardcodear cuotas, estados, provincias o reglas modificables del negocio.
- DO NOT omitir validación Zod en entradas del usuario.
- DO NOT exponer directamente tablas privadas desde endpoints públicos.
- DO NOT confiar en la interfaz para autorizar acciones.
- DO NOT importar datos antes de inspeccionar y reconciliar el export real.
- DO NOT implementar ni simular pagos o campañas en la fase 1.

---

*PRP aprobado el 2026-08-26. Implementación en curso.*
