# GUÍA DE IMPLEMENTACIÓN - FASE 1 ✅

## 📋 Resumen de Cambios Realizados

### 1. **AuthContext Actualizado** ✅
- Ahora detecta automáticamente el `userType` (admin, cliente, empresa)
- Guarda `userStatus` (pendiente, aprobado, rechazado)
- Mantiene `userDetails` con todos los datos del usuario

### 2. **Nuevos Componentes Creados**

#### a) **LoginTypeSelector.jsx** ✅
- Pantalla para elegir el tipo de usuario antes de login
- Ruta: `/login-tipo`
- Tres opciones: Cliente, Empresa, Admin

#### b) **Login.jsx (Actualizado)** ✅
- Login con tipo específico desde parámetro `?tipo=`
- Validaciones según tipo de usuario:
  - **Cliente**: Sin restricciones
  - **Empresa**: Debe estar aprobada (estado = "aprobado")
  - **Admin**: Debe tener permisos (puedeAprobar = true)
- Google login solo para clientes

#### c) **Registro.jsx (Actualizado)** ✅
- Empresas se crean con estado **"pendiente"**
- Clientes se crean con estado **"aprobado"**
- Mensaje diferenciado según tipo

#### d) **ClienteDashboard.jsx** ✅
- Dashboard para clientes
- Ruta protegida: `/cliente/dashboard`

#### e) **EmpresaDashboard.jsx** ✅
- Dashboard para empresas
- Ruta protegida: `/empresa/dashboard`
- Muestra estado de aprobación

#### f) **AdminDashboard.jsx** ✅
- Dashboard para administradores
- Ruta protegida: `/admin/dashboard`
- Panel para aprobar/rechazar solicitudes
- Pestañas: Solicitudes, Empresas, Suscripciones, Estadísticas

#### g) **ProtectedRoute.jsx** ✅
- Componente para proteger rutas
- Valida tipo de usuario
- Valida estado (ej: empresas aprobadas)

### 3. **Estilos Agregados** ✅
- `styles/LoginTypeSelector.css`: Estilos para selector de tipo
- `styles/dashboard.css`: Estilos para todos los dashboards

### 4. **App.jsx Actualizado** ✅
- Nuevas rutas:
  - `/login-tipo` - Selector de tipo de login
  - `/cliente/dashboard` - Dashboard del cliente
  - `/empresa/dashboard` - Dashboard de empresa
  - `/admin/dashboard` - Dashboard de admin
- Navbar actualizado para mostrar dashboard según tipo
- Rutas protegidas implementadas

---

## 🚀 PRÓXIMOS PASOS

### IMPORTANTE: Crear Admin en Firestore

Debes crear manualmente un documento admin en Firestore:

1. Ve a **Firebase Console** → **Firestore Database**
2. Crea una colección llamada **`usuarios`** (si no existe)
3. Crea un documento nuevo con:
   - **Document ID**: (UID del admin - puedes generar uno o usar un email)
   - **Campos**:
     ```json
     {
       "nombre": "Administrador",
       "email": "admin@promocerca.com",
       "password": "contraseña_hash_aqui",
       "tipo": "admin",
       "telefono": "09999999999",
       "puedeAprobar": true,
       "createdAt": <timestamp_actual>,
       "estado": "aprobado"
     }
     ```

**Nota**: El email y contraseña deben coincidir con un usuario creado en **Firebase Authentication**.

### Crear Usuario Admin en Firebase Auth

1. Ve a **Firebase Console** → **Authentication**
2. Click en "Crear usuario"
3. Ingresa:
   - Email: `admin@promocerca.com`
   - Contraseña: Una contraseña segura

### Copiar el UID

1. En Authentication, copia el **UID** del usuario admin
2. Úsalo como **Document ID** en Firestore

---

## 📁 Estructura de Datos en Firestore

```
usuarios/
├── uid_admin/
│   ├── nombre: "Administrador"
│   ├── email: "admin@promocerca.com"
│   ├── tipo: "admin"
│   ├── puedeAprobar: true
│   ├── estado: "aprobado"
│   └── createdAt: timestamp
│
├── uid_cliente/
│   ├── nombre: "Juan Pérez"
│   ├── email: "cliente@email.com"
│   ├── tipo: "cliente"
│   ├── telefono: "09991234567"
│   ├── estado: "aprobado"
│   └── createdAt: timestamp
│
└── uid_empresa/
    ├── nombre: "Miguel García"
    ├── email: "empresa@email.com"
    ├── tipo: "empresa"
    ├── negocio: "Restaurante XYZ"
    ├── categoria: "restaurantes"
    ├── direccion: "Av. Principal 123"
    ├── ruc: "1234567890-001"
    ├── telefono: "09991234567"
    ├── estado: "pendiente"
    ├── createdAt: timestamp
    └── motivoRechazo: "" (solo si rechazado)
```

---

## 🔐 Firestore Security Rules (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer su propio documento
    match /usuarios/{userId} {
      allow read: if request.auth.uid == userId;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == userId || 
                              get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }

    // Solicitudes solo para admins
    match /solicitudes/{document=**} {
      allow read, write: if get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }

    // Suscripciones
    match /suscripciones/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

---

## ✅ Flujo de Usuarios Implementado

### Cliente
1. Se registra en `/registro?tipo=cliente`
2. Se crea con estado **"aprobado"**
3. Puede loguearse inmediatamente
4. Accede a `/cliente/dashboard`

### Empresa
1. Se registra en `/registro?tipo=empresa`
2. Se crea con estado **"pendiente"**
3. **NO puede loguearse** hasta ser aprobada
4. Admin ve solicitud en `/admin/dashboard`
5. Admin aprueba/rechaza la solicitud
6. Empresa recibe notificación (próxima fase)
7. Una vez aprobada, puede acceder a `/empresa/dashboard`

### Admin
1. Debe crear manualmente en Firestore
2. Crea usuario en Firebase Auth
3. Puede loguearse en `/login?tipo=admin`
4. Accede a `/admin/dashboard`
5. Panel para gestionar empresas y suscripciones

---

## 🔍 Cómo Probar

### 1. Crear un Admin
- Sigue las instrucciones de "Crear Admin en Firestore"

### 2. Registrar un Cliente
- Ve a `/registro?tipo=cliente`
- Completa el formulario
- Login automático

### 3. Registrar una Empresa
- Ve a `/registro?tipo=empresa`
- Completa el formulario
- Intenta loguearse → Debe mostrar: "Tu solicitud aún está pendiente"
- Como admin, aprueba desde `/admin/dashboard`
- Ahora la empresa puede loguearse

### 4. Probar Admin Dashboard
- Loguéate como admin
- Ve a `/admin/dashboard`
- Debes ver solicitudes pendientes

---

## 📌 NOTAS IMPORTANTES

1. **El selector de tipo es obligatorio** antes de login
2. **Google login solo para clientes**
3. **Empresas no pueden loguearse** si no están aprobadas
4. **El admin debe crearse manualmente** en Firestore
5. **Los estilos están listos** pero puedes personalizarlos
6. **Las rutas están protegidas** automáticamente

---

## 🎯 FASE 1 COMPLETADA

✅ Estructura de datos
✅ AuthContext con roles
✅ Login por tipo de usuario
✅ Registro con estados
✅ Dashboards básicos
✅ Rutas protegidas
✅ Sistema de aprobación básico

### Próximas Fases:
- FASE 2: Sistema de suscripción/pagos
- FASE 3: Crear/editar promociones
- FASE 4: Sistema de notificaciones
- FASE 5: Estadísticas y análisis
