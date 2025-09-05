# Guía de Estilos - Proyecto Ganabosques

## Tipografías

### Raleway - Para títulos grandes
- Variable CSS: `--font-heading`
- Clase Tailwind: `font-heading`
- Uso: Títulos principales, headers, y texto destacado

### Plus Jakarta Sans - Para texto general
- Variable CSS: `--font-body`
- Clase Tailwind: `font-body` o `font-sans` (por defecto)
- Uso: Párrafos, texto de cuerpo, elementos de navegación

## Colores

### #FCFFF5 - Color de fondo principal (en lugar del blanco)
- Variable CSS: `--background` o `--foreground-light`
- Clase Tailwind: `bg-custom` o `text-custom-light`
- Uso: Fondos principales, texto sobre fondos oscuros

### #082C14 - Color para fondos oscuros y texto principal
- Variable CSS: `--background-dark` o `--foreground`
- Clase Tailwind: `bg-custom-dark` o `text-custom`
- Uso: Fondos oscuros, texto principal, elementos de contraste

## Ejemplos de uso

### En JSX con clases Tailwind:
```jsx
// Título principal
<h1 className="font-heading text-4xl text-custom">
  Título Principal
</h1>

// Texto de párrafo
<p className="font-body text-custom">
  Este es un párrafo con la tipografía principal.
</p>

// Sección con fondo oscuro
<div className="bg-custom-dark text-custom-light p-8">
  <h2 className="font-heading text-2xl">Título en fondo oscuro</h2>
  <p className="font-body">Texto en fondo oscuro</p>
</div>
```

### En CSS personalizado:
```css
.titulo-principal {
  font-family: var(--font-heading);
  color: var(--foreground);
}

.seccion-oscura {
  background-color: var(--background-dark);
  color: var(--foreground-light);
}
```

## Clases utilitarias disponibles

### Tipografías:
- `.font-heading` - Raleway para títulos
- `.font-body` - Plus Jakarta Sans para texto general

### Colores:
- `.bg-custom` - Fondo principal (#FCFFF5)
- `.bg-custom-dark` - Fondo oscuro (#082C14)
- `.text-custom` - Texto principal (#082C14)
- `.text-custom-light` - Texto claro (#FCFFF5)
