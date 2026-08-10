# CHANGES

- [x] Backend `crearTicketCallable` ahora calcula `descuento`, `precioOriginal`, `precioDescuento`, `fechaHoraExpiracion`, `empresaNombre` y `promocionTitulo` solo desde Firestore `promociones`.
- [x] Cliente `crearTicket` ya no envía datos financieros/fecha de `promocionData` al callable.
- [x] Cliente de empresa usa `crearSuscripcionPendienteCallable` para crear pagos pendientes.
- [x] Cliente publica usa `registrarVisualizacionCallable` para incrementar `visualizaciones` en lugar de un update directo.
- [x] Firestore `pagos` crea solo si `planId`, `precio`, `monto` coinciden con un conjunto fijo de planes permitidos.
- [x] Firestore `promociones` ya no permite cambiar `visualizaciones` desde actualizaciones cliente, solo admin o callable seguro.
- [x] Añadido `SECURITY_TODO.md` con instrucciones exactas de `git-filter-repo` para limpiar `.env` del historial.
