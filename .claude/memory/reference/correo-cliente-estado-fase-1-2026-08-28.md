# Borrador de correo al cliente · Estado fase 1

> Preparado el 2026-08-28. Es solo un borrador: no se ha enviado ningún correo.

**Asunto:** Aplicación de gestión de APSE lista para revisión

Hola,

Ya está operativa la primera versión de la nueva aplicación de gestión de APSE y está lista para
que la revisemos.

Se ha preparado lo siguiente:

- Área privada para socios, con cuenta propia y edición de sus datos.
- Gestión diferenciada de alumnos, profesionales y escuelas.
- Panel de administración para consultar, crear, editar, activar, desactivar o eliminar socios.
- Directorio público de profesionales y escuelas, con buscador y fichas individuales.
- Gestión de eventos: profesionales y escuelas pueden proponerlos y APSE los revisa, corrige y
  aprueba antes de publicarlos.
- Calendario/listado público de eventos con imagen e información de inscripción.
- Widgets para insertar el directorio y los eventos en la nueva web de WordPress.
- Gestión de varios administradores y borradores de comunicaciones.
- Recuperación de contraseña y almacenamiento privado de documentos e imágenes.

También se han incorporado validaciones para evitar errores y proteger los datos:

- Las altas de nuevos socios deben ser aprobadas por administración.
- Solo los socios activos pueden aparecer públicamente.
- Los alumnos nunca aparecen en el directorio.
- Profesionales y escuelas deciden si quieren aparecer en el directorio.
- Solo profesionales y escuelas activos pueden crear eventos.
- Ningún evento aparece públicamente hasta que un administrador lo aprueba.
- Las escuelas deben estar vinculadas a un profesional responsable.
- Se controlan emails, contraseñas, fechas, campos obligatorios y duplicidades.
- No se puede desactivar el último administrador ni borrar accidentalmente un socio sin confirmación.
- La información privada no se muestra en el directorio público.

La información de la web anterior ya se ha migrado. Actualmente hay 404 socios en la aplicación,
con sus estados, tipos, números disponibles e imágenes recuperadas. No se ha enviado ningún correo
durante la migración. Cada socio podrá establecer su acceso mediante la recuperación de contraseña
cuando sea necesario.

En esta fase el seguro queda como una casilla para indicar interés, sin precio adicional. La gestión
de pagos con GoCardless, las newsletters y los envíos masivos se dejan para la fase 2.

Para cerrar esta primera fase necesitamos revisar juntos:

1. Los textos, cuotas y campos de los formularios.
2. Los socios importados que tengan datos incompletos o un estado que corregir.
3. El diseño final de las fichas, el directorio y los eventos.
4. La integración de los widgets en la nueva web de WordPress.

Puedes revisar la aplicación aquí:

- Administración: https://shiatsu.alza-t.com/admin/socios
- Directorio público: https://shiatsu.alza-t.com/directorio
- Eventos: https://shiatsu.alza-t.com/eventos

Cuando la hayas revisado, vemos los ajustes necesarios antes de dar por cerrada la fase 1.

Un saludo,

Juanan
