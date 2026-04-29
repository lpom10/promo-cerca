# Plan de Implementación — Promo Cerca: App 100% Funcional

## Diagnóstico del Estado Actual

La aplicación tiene una arquitectura sólida (React + Firebase + Leaflet + React Router). Muchas funcionalidades están parcialmente implementadas pero falta completar varios flujos críticos y hay oportunidades grandes de mejora de diseño.

---

## 🔴 Problemas Críticos (Bugs que rompen flujos)

| # | Problema | Archivo |
|---|----------|---------|
| 1 | `ProtectedRoute` redirige a `/login-tipo` pero esa ruta **no existe** en el router | `App.jsx`, `ProtectedRoute.jsx` |
| 2 | Login muestra "← Cambiar tipo de usuario" que lleva a `/login-tipo` (ruta inexistente) | `Login.jsx` |
| 3 | Categoría `grestaurantes` (typo) en Registro vs `restaurantes` en `categorias.js` | `Registro.jsx` |
| 4 | `AdminDashboard` usa `prompt()` nativo del navegador para motivo de rechazo — bloqueado en muchos navegadores | `AdminDashboard.jsx` |
| 5 | Tabs de Admin "Suscripciones" y "Estadísticas" muestran solo `<p>` placeholder | `AdminDashboard.jsx` |
| 6 | Tab "Mis Favoritas" en ClienteDashboard no implementado — solo texto placeholder | `ClienteDashboard.jsx` |
| 7 | Botón "❤️ Guardar" en `ListarPromociones` no tiene funcionalidad (ningún handler) | `ListarPromociones.jsx` |
| 8 | `Locales.jsx` hace un link a `/PerfilEmpresas` que no existe como ruta en el router | `Locales.jsx`, `App.jsx` |
| 9 | `index.html` tiene título `react-firebase-app` en lugar de "Promo Cerca" | `index.html` |
| 10 | `TextField.jsx` (homepage) no muestra la sección Hero con overlay correcto — `hero-overlay` no tiene estilos | `TextField.jsx` |

---

## 🟡 Funcionalidades Incompletas

| # | Funcionalidad | Estado | Acción |
|---|--------------|--------|--------|
| 1 | Admin → Tab Estadísticas | Placeholder | Implementar stats reales de Firestore |
| 2 | Admin → Tab Suscripciones | Placeholder | Listar todas las suscripciones activas |
| 3 | Admin → Rechazar empresa | `prompt()` nativo | Reemplazar con modal propio |
| 4 | Cliente → Favoritas | Placeholder | Guardar/mostrar favoritos en Firestore |
| 5 | GestorSuscripcion → Pago | `window.confirm()` y `alert()` nativos | Reemplazar con UI propia |
| 6 | Navbar → Botón logout visible | No hay opción desde mobile | Integrar en menú hamburguesa |
| 7 | `EmpresaDashboard` → `window.location.reload()` para guardar | Mala UX | Actualizar contexto sin recargar |
| 8 | Homepage hero | Falta `hero-overlay` CSS + stats section visible | Completar estilos |
| 9 | Ruta `/empresa/gestionar-promociones` en navbar pero no existe como Route | `App.jsx` | Agregar ruta o redirigir al dashboard |

---

## 🟢 Mejoras de Diseño y UX

| # | Mejora |
|---|--------|
| 1 | Dashboard de empresa: sidebar de navegación izquierdo en lugar de tabs horizontales |
| 2 | Loading states: spinner animado en lugar de texto "Cargando..." |
| 3 | Toast notifications: reemplazar `alert()` con notificaciones elegantes |
| 4 | AdminDashboard: modal propio para motivo de rechazo |
| 5 | Formularios: mostrar contraseña toggle (ojo) |
| 6 | Página 404 amigable |
| 7 | Meta tags SEO en `index.html` |
| 8 | Navbar: indicador visual de usuario autenticado (avatar/nombre) |
| 9 | Google Fonts (Inter) en lugar de Segoe UI |
| 10 | Sección de estadísticas Admin con tarjetas de métricas reales |

---

## Cambios Propuestos

### 1. Correcciones Críticas de Routing

#### [MODIFY] App.jsx
- Eliminar la ruta `/empresa/gestionar-promociones` del navbar (ya está dentro del dashboard)
- Agregar redirect `/login-tipo` → `/login`
- Agregar ruta `/PerfilEmpresas` que renderice un componente de perfil público

#### [MODIFY] ProtectedRoute.jsx
- Cambiar redirect a `/login` en lugar de `/login-tipo`

#### [MODIFY] Login.jsx
- Eliminar link "← Cambiar tipo de usuario" o redirigir a `/login`

---

### 2. Fix de Categorías y Typos

#### [MODIFY] Registro.jsx
- Corregir `grestaurantes` → `restaurantes` para coincidir con `categorias.js`

---

### 3. Sistema de Toast Notifications

#### [NEW] src/components/Toast.jsx + src/styles/toast.css
- Componente de notificaciones flotantes que reemplaza todos los `alert()` y `window.confirm()`

---

### 4. AdminDashboard — Modal de Rechazo + Tabs Completos

#### [MODIFY] AdminDashboard.jsx
- Reemplazar `prompt()` con modal propio de motivo de rechazo
- Tab "Suscripciones": listar todas las suscripciones activas de Firestore
- Tab "Estadísticas": tarjetas con contadores (total empresas, clientes, promociones activas, suscripciones)

---

### 5. ClienteDashboard — Favoritos funcionales

#### [MODIFY] ClienteDashboard.jsx
- Tab "Favoritas": guardar promo ID en Firestore (`usuarios/{uid}/favoritos`)
- Mostrar lista de promociones guardadas con opción de eliminar

#### [MODIFY] ListarPromociones.jsx
- Conectar botón "❤️ Guardar" con Firestore, solo si está logueado

---

### 6. Perfil Público de Empresa

#### [NEW] src/components/PerfilPublicoEmpresa.jsx
- Página pública que muestra info del negocio + sus promociones activas
- Accesible en `/empresa/:id`

---

### 7. UX Mejorada — Dialogs y Loading

#### [MODIFY] GestorSuscripcion.jsx
- Reemplazar `window.confirm` y `alert` con Toast notifications

#### [MODIFY] GestorPromociones.jsx
- Reemplazar `window.confirm` con modal de confirmación

#### [MODIFY] EmpresaDashboard.jsx
- Reemplazar `window.location.reload()` con actualización de contexto

---

### 8. Homepage y HTML base

#### [MODIFY] index.html
- Título: "Promo Cerca — Descubre promociones locales"
- Meta description y og tags

#### [MODIFY] src/index.css
- Agregar `.hero-overlay` estilos
- Google Fonts (Inter) via CSS import

---

### 9. Navbar: Avatar de usuario

#### [MODIFY] App.jsx
- Mostrar nombre/avatar del usuario autenticado en navbar
- Incluir botón de logout en navbar (actualmente solo dentro de cada dashboard)

---

## Orden de Implementación

1. **Fase 1 — Bugs críticos** (routing, categoría typo, `/login-tipo`)
2. **Fase 2 — Toast notifications** (reemplaza todos los alert/confirm nativos)
3. **Fase 3 — Admin Dashboard** completo (modal rechazo + tabs funcionales)
4. **Fase 4 — Cliente Dashboard** (favoritos)
5. **Fase 5 — Navbar mejorado** (avatar, logout, `/empresa/gestionar` fix)
6. **Fase 6 — Homepage y SEO** (meta tags, overlay, Google Fonts)
7. **Fase 7 — Perfil Público Empresa**
8. **Fase 8 — UX polish** (loading spinners, contraseña toggle)

## Plan de Verificación

- Arrancar con `npm run dev` y verificar que no hay errores en consola
- Probar flujo completo: Registro Empresa → Login → Dashboard → Crear Promoción → Ver en Mapa
- Probar flujo cliente: Registro → Login → Ver Promociones → Guardar Favorita → Obtener Ticket
- Probar flujo admin: Login admin → Ver solicitudes → Aprobar/Rechazar → Ver estadísticas
