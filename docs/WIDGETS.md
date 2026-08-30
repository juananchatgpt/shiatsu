# Integración de widgets en WordPress

## Directorio

```html
<script async src="https://shiatsu.alza-t.com/api/widgets.js?v=20260830" data-apse-widget="directory"></script>
```

## Eventos

```html
<script async src="https://shiatsu.alza-t.com/api/widgets.js?v=20260830" data-apse-widget="events"></script>
```

El script crea un `iframe`, por lo que los estilos de WordPress y del widget quedan aislados. Las
URLs directas son `https://shiatsu.alza-t.com/embed/directorio` y
`https://shiatsu.alza-t.com/embed/eventos`. El parámetro de versión evita reutilizar una copia
antigua del script después de una actualización.
