# Integración de widgets en WordPress

## Directorio

```html
<script async src="https://DOMINIO-APP/api/widgets.js" data-apse-widget="directory"></script>
```

## Eventos

```html
<script async src="https://DOMINIO-APP/api/widgets.js" data-apse-widget="events"></script>
```

El script crea un `iframe`, por lo que los estilos de WordPress y del widget quedan aislados. Las
URLs directas son `/embed/directorio` y `/embed/eventos`. Antes de producción hay que sustituir el
dominio, probar el bloque HTML de WordPress y confirmar la altura final en móvil.
