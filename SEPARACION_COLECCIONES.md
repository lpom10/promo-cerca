# SEPARACIÓN DE COLECCIONES - GUÍA DE MIGRACIÓN ✅

## ✅ Cambios Realizados

Se han actualizado todos los componentes para usar colecciones separadas:

### Estructura Nueva de Firestore:

```
/usuarios
  ├── uid_cliente_1/
  │   ├── nombre: "Juan Pérez"
  │   ├── email: "cliente@email.com"
  │   ├── telefono: "09991234567"
  │   ├── estado: "aprobado"
  │   └── createdAt: timestamp
  │
  └── uid_cliente_2/
      └── ...

/empresa
  ├── uid_empresa_1/
  │   ├── nombre: "Miguel García"
  │   ├── email: "empresa@email.com"
  │   ├── negocio: "Pizzería XYZ"
  │   ├── categoria: "restaurantes"
  │   ├── direccion: "Av. Principal 123"
  │   ├── ruc: "1234567890-001"
  │   ├── telefono: "09991234567"
  │   ├── estado: "pendiente" o "aprobado" o "rechazado"
  │   ├── motivoRechazo: "" (si rechazado)
  │   └── createdAt: timestamp
  │
  └── uid_empresa_2/
      └── ...

/admin
  ├── uid_admin/
  │   ├── nombre: "Administrador"
  │   ├── email: "admin@test.com"
  │   ├── puedeAprobar: true
  │   ├── estado: "aprobado"
  │   └── createdAt: timestamp
  │
  └── ...

/promociones
  └── (igual que antes, no cambió)

/suscripciones
  └── (igual que antes, no cambió)
```

---

## 📝 Cambios en Código

### 1. **AuthContext.jsx** ✅
- Ahora busca en `usuarios` para clientes
- Busca en `empresa` para empresas
- Busca en `admin` para administradores

### 2. **Login.jsx** ✅
- Valida en la colección correcta según tipo
- Google login sigue guardando en `usuarios` (correcto)

### 3. **Registro.jsx** ✅
- Clientes se guardan en colección `usuarios`
- Empresas se guardan en colección `empresa`

### 4. **AdminDashboard.jsx** ✅
- Lee solicitudes de colección `empresa`
- Aprueba/rechaza en colección `empresa`

---

## 🚀 Cómo Migrar Datos Existentes (OPCIONAL)

Si tienes datos antiguos en la colección `usuarios` que necesitas migrar:

### OPCIÓN A: Migración Manual en Firebase Console

1. **Abre Firestore Console**
   - https://console.firebase.google.com

2. **Para cada CLIENTE en `usuarios`:**
   - Copia el documento
   - Crea nuevo documento en `usuarios` con el mismo UID
   - Pega los datos

3. **Para cada EMPRESA en `usuarios`:**
   - Copia el documento
   - Crea nuevo documento en `empresa` con el mismo UID
   - Pega los datos (menos el campo `tipo`)
   - Elimina de `usuarios`

4. **Para ADMIN:**
   - Crea documento en `admin` con UID
   - Agrega campos: `puedeAprobar: true`

### OPCIÓN B: Script de Migración (Node.js)

```javascript
// script-migracion.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrarDatos() {
  try {
    // Obtener todos los documentos de usuarios
    const snapshot = await db.collection('usuarios').get();
    
    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const uid = doc.id;
      
      // Determinar tipo y colección destino
      if (data.tipo === 'empresa') {
        // Migrar a colección empresa
        await db.collection('empresa').doc(uid).set({
          nombre: data.nombre,
          email: data.email,
          negocio: data.negocio,
          categoria: data.categoria,
          direccion: data.direccion,
          ruc: data.ruc,
          telefono: data.telefono,
          estado: data.estado || 'pendiente',
          motivoRechazo: data.motivoRechazo || '',
          createdAt: data.createdAt,
        });
        console.log(`✅ Empresa ${uid} migrada`);
      } else if (data.tipo === 'cliente') {
        // Ya está en usuarios, solo limpiar
        await db.collection('usuarios').doc(uid).update({
          // Eliminar campo tipo si existe
          tipo: admin.firestore.FieldValue.delete()
        });
        console.log(`✅ Cliente ${uid} limpiado`);
      } else if (data.tipo === 'admin') {
        // Migrar a colección admin
        await db.collection('admin').doc(uid).set({
          nombre: data.nombre,
          email: data.email,
          puedeAprobar: data.puedeAprobar || true,
          estado: 'aprobado',
          createdAt: data.createdAt,
        });
        // Eliminar de usuarios
        await db.collection('usuarios').doc(uid).delete();
        console.log(`✅ Admin ${uid} migrado`);
      }
    });
    
    console.log('✅ Migración completada');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

migrarDatos();
```

Para usar este script:
1. Descarga `serviceAccountKey.json` de Firebase
2. Instala: `npm install firebase-admin`
3. Ejecuta: `node script-migracion.js`

---

## 🔐 Actualizar Firestore Security Rules

Reemplaza tus reglas con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Colección USUARIOS (clientes)
    match /usuarios/{userId} {
      allow read: if request.auth.uid == userId;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == userId;
    }

    // Colección EMPRESA
    match /empresa/{empresaId} {
      allow read: if true; // Admin puede leer
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == empresaId || 
                       isAdmin(request.auth.uid);
      allow delete: if isAdmin(request.auth.uid);
    }

    // Colección ADMIN
    match /admin/{adminId} {
      allow read: if isAdmin(request.auth.uid);
      allow create, update, delete: if false; // Solo crear manualmente
    }

    // Colección PROMOCIONES
    match /promociones/{promoId} {
      allow read: if true; // Todos pueden ver
      allow create, update: if isEmpresa(request.auth.uid) &&
                               resource.data.empresaId == request.auth.uid;
      allow delete: if isEmpresa(request.auth.uid) &&
                       resource.data.empresaId == request.auth.uid;
    }

    // Colección SUSCRIPCIONES
    match /suscripciones/{subId} {
      allow read, create, update: if isEmpresa(request.auth.uid) &&
                                     resource.data.empresaId == request.auth.uid ||
                                     isAdmin(request.auth.uid);
    }

    // Funciones auxiliares
    function isAdmin(uid) {
      return exists(/databases/$(database)/documents/admin/$(uid));
    }

    function isEmpresa(uid) {
      return exists(/databases/$(database)/documents/empresa/$(uid));
    }

    function isCliente(uid) {
      return exists(/databases/$(database)/documents/usuarios/$(uid));
    }
  }
}
```

---

## ✅ Crear Admin Correctamente

### Paso 1: Firebase Authentication
1. Ve a **Firebase Console** → **Authentication**
2. Click en **"Crear usuario"**
3. Email: `admin@test.com`
4. Contraseña: `Admin123456`
5. Click en el usuario creado
6. **Copiar el UID** (ej: `AbCdEf123456789...`)

### Paso 2: Firestore
1. Ve a **Firestore Database**
2. Click en **"Crear colección"** → Nombre: `admin`
3. Click en **"Agregar documento"**
   - Document ID: **Pega el UID del admin**
4. Agrega los campos:

```json
{
  "nombre": "Administrador",
  "email": "admin@test.com",
  "puedeAprobar": true,
  "estado": "aprobado",
  "createdAt": (timestamp actual - click en "Server timestamp")
}
```

---

## 🧪 Cómo Probar Después de la Migración

### 1. Registrar un CLIENTE
```
URL: /registro?tipo=cliente
Datos: nombre, email, contraseña
Resultado: Se guarda en colección "usuarios" ✅
```

### 2. Registrar una EMPRESA
```
URL: /registro?tipo=empresa
Datos: nombre, email, negocio, categoría, RUC, dirección
Resultado: Se guarda en colección "empresa" con estado "pendiente" ✅
```

### 3. Login ADMIN
```
URL: /login?tipo=admin
Email: admin@test.com
Contraseña: Admin123456
Resultado: Acceso a /admin/dashboard ✅
```

### 4. Admin aprueba EMPRESA
```
1. Ir a /admin/dashboard
2. Ver solicitudes pendientes de colección "empresa"
3. Click en "Aprobar"
4. La empresa puede loguearse ✅
```

### 5. Empresa crea PROMOCIÓN
```
1. Dashboard → Suscripción (contratar plan)
2. Dashboard → Mis Promociones
3. Crear promoción ✅
```

---

## 🔍 Verificar en Firestore Console

Para confirmar que funciona:

1. Abre https://console.firebase.google.com
2. Ve a **Firestore Database**
3. Verifica las colecciones:
   - ✅ `usuarios` - solo clientes
   - ✅ `empresa` - solo empresas
   - ✅ `admin` - solo admins
   - ✅ `promociones` - promociones
   - ✅ `suscripciones` - suscripciones

---

## 📝 Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `AuthContext.jsx` | Lee de colección correcta |
| `Login.jsx` | Valida en colección correcta |
| `Registro.jsx` | Guarda en colección correcta |
| `AdminDashboard.jsx` | Lee de `empresa` |
| `GestorPromociones.jsx` | Sin cambios (funciona igual) |
| `GestorSuscripcion.jsx` | Sin cambios (funciona igual) |

---

## ✨ Listo

Todas las nuevas cuentas se guardarán en las colecciones correctas:
- ✅ Clientes → `usuarios`
- ✅ Empresas → `empresa`
- ✅ Admins → `admin`

Si tienes datos antiguos que migrar, sigue las instrucciones de migración arriba. 🚀
