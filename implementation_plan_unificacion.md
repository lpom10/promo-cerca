# Plan de Unificación: Web vs Móvil

He revisado la estructura y rutas de tu proyecto web (`promo-cerca/src`) y las he comparado con tu aplicación móvil (`mobile-app`). Hay varias diferencias arquitectónicas y funcionales clave. El objetivo de este plan es unificar ambas plataformas para que ofrezcan la misma experiencia.

## Funcionalidades Faltantes en Móvil (Presentes en Web)

1. **Navegación Pública (Sin Login)**
   - **Web:** Permite a usuarios no registrados ver el Inicio (Home), Mapa, Lista de Locales y el Perfil Público de las Empresas.
   - **Móvil:** Actualmente, obliga al usuario a iniciar sesión (`RootNavigator` bloquea el acceso si `!isAuth`) antes de poder ver cualquier cosa.

2. **Roles de Usuario (Cliente, Empresa, Admin)**
   - **Web:** El `AuthContext` busca en Firestore (`usuarios`, `empresa`, `admin`) para determinar el rol del usuario y mostrar diferentes paneles (Dashboards).
   - **Móvil:** El `useAuthStore` solo guarda la sesión de Firebase (`user: User | null`), asumiendo implícitamente que todos los usuarios son "Clientes". No discrimina entre roles.

3. **Flujo de Empresa (Business App)**
   - **Web:** Tiene rutas protegidas exclusivas para empresas: `EmpresaDashboard`, `GestorPromociones` (crear/editar promos) y `CanjeTickets` (para validar tickets de clientes).
   - **Móvil:** No existe ninguna de estas pantallas. La app móvil actualmente es 100% enfocada al cliente.

4. **Pantallas Públicas de Negocios**
   - **Web:** Tiene `LocalesPage` (para listar empresas) y `PerfilEmpresaPublica` (para ver los detalles y promos de una empresa específica).
   - **Móvil:** Tiene una carpeta `negocios` vacía. Falta implementar la lista de locales y el perfil de la empresa.

5. **Datos Reales (Integración Firebase)**
   - **Web:** Conecta con Firestore para obtener datos (según se ve en su contexto y estructura).
   - **Móvil:** Las pantallas de `HomeScreen`, `TicketsScreen` y `FavoritesScreen` están usando **datos falsos (dummy data)** (ej. `const favorites = [...]`).

## Funcionalidades Sobrantes o Diferentes en Móvil

1. **Pestañas (Tabs) Dedicadas para Favoritos y Tickets**
   - **Móvil:** Tiene "Favoritos" y "Tickets" como pestañas principales (Bottom Tabs).
   - **Web:** No tiene rutas de nivel superior llamadas `FavoritosPage` o `MisTicketsPage`; es probable que en la web todo esto esté agrupado dentro del `ClienteDashboard`. Si queremos que sean exactamente iguales, el móvil debería agrupar esto en un "Dashboard de Cliente" o, por el contrario, separar estas vistas en la web.

## User Review Required

> [!WARNING]  
> Para que el móvil sea exactamente igual que la web, necesitamos cambiar drásticamente la navegación del móvil (permitir acceso sin login) y agregar todo el flujo para las Empresas. 

## Open Questions

1. **Navegación Pública:** ¿Estás de acuerdo en que modifique el `RootNavigator` del móvil para que se pueda usar la app (Home, Mapa, Locales) sin iniciar sesión, igual que en la web?
2. **Rol de Empresa:** ¿Quieres que la *misma* app móvil sirva tanto para Clientes como para Empresas (dependiendo de con qué cuenta inicien sesión), o preferirías mantener esta app móvil solo para clientes y dejar la gestión de empresas solo para la web?
3. **Favoritos y Tickets:** ¿Mantenemos las pestañas (Tabs) de Favoritos y Tickets en la app móvil, o prefieres que lo agrupemos en un solo "Perfil/Dashboard" para que sea idéntico a la web?

## Proposed Changes (Fase 1: Autenticación y Navegación Pública)

Si apruebas el plan, el primer paso será:

### [MODIFY] `mobile-app/src/app/store/useAuthStore.ts`
- Actualizar para consultar Firestore (`usuarios`, `empresa`, `admin`) y almacenar el `userType`, replicando la lógica de `AuthContext.jsx` de la web.

### [MODIFY] `mobile-app/src/app/navigation/RootNavigator.tsx`
- Eliminar el bloqueo estricto de login. 
- Crear un flujo donde el `TabNavigator` es público, y ciertas acciones (como "Mis Tickets" o "Favoritos") exijan estar logueado como cliente.

### [NEW] `mobile-app/src/features/negocios/screens/LocalesScreen.tsx`
- Crear la pantalla para listar los comercios.

### [NEW] `mobile-app/src/features/negocios/screens/EmpresaPublicaScreen.tsx`
- Crear la pantalla de perfil público de la empresa.
