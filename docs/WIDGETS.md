# Integración de widgets en WordPress

## Directorio

```html
<script async src="https://areaprivada.shiatsu-apse.es/api/widgets.js?v=20260830" data-apse-widget="directory"></script>
```

## Eventos

```html
<script async src="https://areaprivada.shiatsu-apse.es/api/widgets.js?v=20260830" data-apse-widget="events"></script>
```

El script crea un `iframe`, por lo que los estilos de WordPress y del widget quedan aislados. Las
URLs directas son `https://areaprivada.shiatsu-apse.es/embed/directorio` y
`https://areaprivada.shiatsu-apse.es/embed/eventos`. El parámetro de versión evita reutilizar una copia
antigua del script después de una actualización.
