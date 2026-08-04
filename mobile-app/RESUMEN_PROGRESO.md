# Resumen del Progreso: Promo Cerca

Este documento es un respaldo del progreso alcanzado en la aplicación móvil `Promo Cerca` hasta la fecha.

## Fases Completadas

### Fase 1: Validaciones y Autenticación
- Se implementaron algoritmos estrictos de Módulo 10 (Cédula) y Módulo 11 (RUC) para Ecuador.
- Se separaron las colecciones de Firestore en `usuarios` y `empresa` para mantener compatibilidad con la web.
- Se conectó el `ProfileScreen` y el `EditProfileModal` con los datos dinámicos del estado global (`zustand`).

### Fase 2: Mapas Dinámicos y Publicación de Promociones
- Se agregó el `MapView` al perfil de las empresas para establecer sus coordenadas arrastrando el mapa.
- Se creó el `CreatePromotionModal` para subir imágenes usando `expo-image-picker` y `Firebase Storage`.
- Se actualizó el `MapScreen` principal para agrupar las promociones por local, utilizando pines con colores dinámicos (`markerColor`) y contadores de promociones.
- Se añadió un bloqueo lógico: una empresa no puede crear promociones si no ha definido su ubicación.

### Fase 3: Flujo del Cliente, Canje y Códigos QR
- Se implementó la pantalla de detalle `PromoDetailScreen` con un "Muro de Autenticación" para invitados y bloqueo para cuentas de empresa.
- Se desarrolló el `useTickets` para guardar el canje en la colección `redemptions` de Firestore con estado `PENDING`.
- Se configuraron las notificaciones push (`expo-notifications`) programadas 24 horas antes del vencimiento del ticket.
- Se construyó el `TicketDetailScreen` que renderiza offline un Código QR (`react-native-qrcode-svg`) con el ID del canje.
- Se habilitó el botón de navegación mediante Deep-Linking (`Linking.openURL`) que redirige nativamente a Google Maps o Waze en iOS y Android.
### Fase 4: Flujo de Empresa (Escaneo)
- Se utilizó `expo-camera` en `CanjeTicketsScreen` para leer el código QR del cliente.
- Se implementó la actualización del estado del ticket en Firestore a `REDEEMED`.

## Próximos Pasos (Pendiente)
- **Fase 5: ... (Por definir)**
