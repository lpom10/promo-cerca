# Guía de Estilos - Promo Cerca

## Estructura del Sistema de Diseño

Este proyecto usa un sistema de diseño centralizado para mantener consistencia visual y facilitar el mantenimiento.

### Archivos Principales

- **`src/styles/index.css`** - Variables CSS y utilidades reutilizables
  - Colores, espaciado, tipografía, sombras
  - Clases de utilidad (`.btn`, `.card`, `.grid`, etc.)
  - Animaciones base

- **`src/index.css`** - Estilos globales de la aplicación

- **`src/styles/*.css`** - Estilos específicos de componentes

## Variables CSS Disponibles

### Colores

```css
--color-primary: #06b6d4;        /* Cyan - Color principal */
--color-primary-dark: #0891b2;   /* Cyan oscuro */
--color-primary-light: #cffafe;  /* Cyan claro */

--color-accent: #2563eb;         /* Azul - Color secundario */
--color-success: #10b981;        /* Verde */
--color-warning: #f59e0b;        /* Naranja */
--color-danger: #ef4444;         /* Rojo */

--color-gray-{50-900}:           /* Escala de grises */
```

### Espaciado

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### Tipografía

```css
--font-family: System fonts
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
```

## Clases de Utilidad

### Botones

```html
<button class="btn btn-primary">Primario</button>
<button class="btn btn-secondary">Secundario</button>
```

### Tarjetas

```html
<div class="card">
  Contenido de tarjeta con sombra y bordes redondeados
</div>
```

### Grid/Flex

```html
<div class="grid grid-cols-3">
  <div>Columna 1</div>
  <div>Columna 2</div>
  <div>Columna 3</div>
</div>

<div class="flex flex-between gap-md">
  <span>Izquierda</span>
  <span>Derecha</span>
</div>
```

### Espaciado

```html
<div class="p-lg m-md gap-sm">Contenido</div>
```

### Utilidades de Texto

```html
<p class="text-muted">Texto gris deshabilitado</p>
<p class="text-truncate">Texto muy largo truncado...</p>
```

## Transiciones

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

## Breakpoints (Responsive)

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

## Mejores Prácticas

1. **Usa variables CSS** en lugar de colores hardcodeados
   ```css
   /* ✅ Bien */
   background-color: var(--color-primary);
   
   /* ❌ Evitar */
   background-color: #06b6d4;
   ```

2. **Reutiliza clases de utilidad** antes de crear nuevas
   ```html
   <!-- ✅ Bien -->
   <div class="flex flex-between gap-md p-lg">
   
   <!-- ❌ Evitar -->
   <div style="display: flex; justify-content: space-between; padding: 24px;">
   ```

3. **Mantén el espaciado consistente**
   ```css
   /* Usa múltiplos de 4px */
   gap: var(--spacing-md);    /* 16px */
   padding: var(--spacing-lg); /* 24px */
   ```

4. **Importa estilos en el orden correcto** en main.jsx
   1. Leaflet CSS
   2. Base styles (src/index.css)
   3. Design system variables (src/styles/index.css)
   4. Component-specific styles

## Ejemplos de Uso

### Crear un nuevo componente con estilos

```jsx
// MiComponente.jsx
export default function MiComponente() {
  return (
    <div className="card p-lg">
      <div className="flex flex-between gap-md">
        <h2 className="text-lg">Título</h2>
        <button className="btn btn-primary">Acción</button>
      </div>
      <p className="text-muted text-truncate">
        Descripción que puede ser muy larga...
      </p>
    </div>
  );
}
```

```css
/* MiComponente.css - Solo si necesitas estilos específicos */
.mi-componente-especial {
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.mi-componente-especial:hover {
  box-shadow: var(--shadow-lg);
}
```

## Checklist para Code Review

- [ ] ¿Se usan variables CSS en lugar de valores hardcodeados?
- [ ] ¿Se reutilizan clases de utilidad existentes?
- [ ] ¿El espaciado es múltiplo de 4px?
- [ ] ¿El componente es responsive?
- [ ] ¿Se usan transiciones consistentes?
- [ ] ¿El archivo CSS está bien organizado?

## Próximos Pasos

- Consolidar archivos CSS duplicados (perfil.css, PerfilEmpresaPublica.css)
- Crear componentes reutilizables para formas
- Implementar tema oscuro (dark mode)
- Mejorar Performance de CSS con purging
