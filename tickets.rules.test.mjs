// tickets.rules.test.mjs
//
// Prueba automatizada de firestore.rules para la colección /tickets.
// Corre contra el EMULADOR (no toca producción).
//
// CÓMO USARLO:
// 1) Copia este archivo a la raíz de tu proyecto promo-cerca (junto a firestore.rules)
// 2) En una terminal: firebase emulators:start --only firestore
//    (déjala corriendo, no la cierres)
// 3) En OTRA terminal, dentro de la carpeta del proyecto:
//    npm install --save-dev @firebase/rules-unit-testing
//    node tickets.rules.test.mjs
//
// Vas a ver una lista de casos con ✅ (paso como se esperaba) o ❌ (falló, revisar).

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { setDoc, doc, Timestamp } from 'firebase/firestore';

const PROJECT_ID = 'promo-cerca-26495'; // ajusta si tu projectId es otro (ver .firebaserc)

let testEnv;
let results = [];

function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function seedPromocion(context, promoId, data) {
  // Se usa un contexto sin reglas (admin) para insertar datos de referencia,
  // simulando lo que ya existiría en producción.
  await context.withSecurityRulesDisabled(async (adminCtx) => {
    await setDoc(doc(adminCtx.firestore(), 'promociones', promoId), data);
  });
}

async function main() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  await testEnv.clearFirestore();

  const uid = 'usuarioTest123';
  const otroUid = 'usuarioTest456';
  const empresaId = 'empresaTest';
  const promoIdOk = 'promoOk';
  const promoIdAgotada = 'promoAgotada';
  const promoIdInactiva = 'promoInactiva';

  // Datos de referencia: promo real y válida
  await seedPromocion(testEnv, promoIdOk, {
    empresaId,
    titulo: 'Promo válida',
    activa: true,
    estado: 'aprobado',
    descuento: 20,
    precioOriginal: 100,
    precioDescuento: 80,
    ticketsGenerados: 1,
    ticketsMaximos: 10,
    createdAt: Timestamp.now(),
  });

  await seedPromocion(testEnv, promoIdAgotada, {
    empresaId,
    titulo: 'Promo agotada',
    activa: true,
    estado: 'aprobado',
    descuento: 20,
    precioOriginal: 100,
    precioDescuento: 80,
    ticketsGenerados: 10,
    ticketsMaximos: 10,
    createdAt: Timestamp.now(),
  });

  await seedPromocion(testEnv, promoIdInactiva, {
    empresaId,
    titulo: 'Promo inactiva',
    activa: false,
    estado: 'pendiente',
    descuento: 20,
    precioOriginal: 100,
    precioDescuento: 80,
    ticketsGenerados: 0,
    ticketsMaximos: 10,
    createdAt: Timestamp.now(),
  });

  const authedCtx = testEnv.authenticatedContext(uid);
  const db = authedCtx.firestore();

  const ticketBase = {
    usuarioId: uid,
    empresaId,
    promocionId: promoIdOk,
    codigo: 'ABC12345',
    estado: 'generado',
    redeemedAt: null,
    fechaCanjeado: null,
    expiredAt: null,
    canjeadoPor: null,
    createdAt: Timestamp.now(),
    usuarioNombre: 'Test',
    usuarioTelefono: '0999999999',
    promocionTitulo: 'Promo válida',
    empresaNombre: 'Empresa Test',
    descuento: 20,
    precioOriginal: 100,
    precioDescuento: 80,
  };

  // CASO 1: ticket legítimo, todo coincide con la promo real -> debería PERMITIRSE
  await (async () => {
    const ticketId = `${uid}_${promoIdOk}`;
    try {
      await assertSucceeds(setDoc(doc(db, 'tickets', ticketId), ticketBase));
      log('Caso 1: ticket legítimo se crea', true);
    } catch (e) {
      log('Caso 1: ticket legítimo se crea', false, e.message);
    }
  })();

  // CASO 2: descuento inventado (distinto al real de la promo) -> debería RECHAZARSE
  await (async () => {
    const ticketId = `${uid}_fraude1`;
    const data = { ...ticketBase, promocionId: promoIdOk, descuento: 99, precioDescuento: 0.01 };
    try {
      await assertFails(setDoc(doc(db, 'tickets', ticketId), data));
      log('Caso 2: descuento falso es rechazado', true);
    } catch (e) {
      log('Caso 2: descuento falso es rechazado', false, 'LA REGLA LO PERMITIÓ (hueco de fraude financiero abierto)');
    }
  })();

  // CASO 3: crear ticket sobre promo agotada -> debería RECHAZARSE
  await (async () => {
    const ticketId = `${uid}_${promoIdAgotada}`;
    const data = { ...ticketBase, promocionId: promoIdAgotada };
    try {
      await assertFails(setDoc(doc(db, 'tickets', ticketId), data));
      log('Caso 3: ticket sobre promo agotada es rechazado', true);
    } catch (e) {
      log('Caso 3: ticket sobre promo agotada es rechazado', false, 'LA REGLA LO PERMITIÓ (bypass de límite de tickets)');
    }
  })();

  // CASO 4: crear ticket sobre promo inactiva -> debería RECHAZARSE
  await (async () => {
    const ticketId = `${uid}_${promoIdInactiva}`;
    const data = { ...ticketBase, promocionId: promoIdInactiva };
    try {
      await assertFails(setDoc(doc(db, 'tickets', ticketId), data));
      log('Caso 4: ticket sobre promo inactiva es rechazado', true);
    } catch (e) {
      log('Caso 4: ticket sobre promo inactiva es rechazado', false, 'LA REGLA LO PERMITIÓ');
    }
  })();

  // CASO 5: ticket ya creado como "canjeado" desde el inicio (bypass del callable) -> debería RECHAZARSE
  await (async () => {
    const ticketId = `${uid}_fraude2`;
    const data = { ...ticketBase, promocionId: promoIdOk, estado: 'canjeado', fechaCanjeado: Timestamp.now() };
    try {
      await assertFails(setDoc(doc(db, 'tickets', ticketId), data));
      log('Caso 5: crear ticket ya canjeado es rechazado', true);
    } catch (e) {
      log('Caso 5: crear ticket ya canjeado es rechazado', false, 'LA REGLA LO PERMITIÓ (fraude de canje directo)');
    }
  })();

  // CASO 6: crear ticket a nombre de otro usuario -> debería RECHAZARSE
  await (async () => {
    const ticketId = `${otroUid}_${promoIdOk}`;
    const data = { ...ticketBase, promocionId: promoIdOk, usuarioId: otroUid };
    try {
      await assertFails(setDoc(doc(db, 'tickets', ticketId), data));
      log('Caso 6: crear ticket para otro usuario es rechazado', true);
    } catch (e) {
      log('Caso 6: crear ticket para otro usuario es rechazado', false, 'LA REGLA LO PERMITIÓ');
    }
  })();

  // CASO 7: empresaId no coincide con la empresa dueña de la promo -> debería RECHAZARSE
  await (async () => {
    const ticketId = `${uid}_fraude3`;
    const data = { ...ticketBase, promocionId: promoIdOk, empresaId: 'empresaFalsa' };
    try {
      await assertFails(setDoc(doc(db, 'tickets', ticketId), data));
      log('Caso 7: empresaId no coincide es rechazado', true);
    } catch (e) {
      log('Caso 7: empresaId no coincide es rechazado', false, 'LA REGLA LO PERMITIÓ');
    }
  })();

  await testEnv.cleanup();

  const fails = results.filter((r) => !r.ok);
  console.log('\n--- RESUMEN ---');
  console.log(`${results.length - fails.length}/${results.length} casos como se esperaba`);
  if (fails.length) {
    console.log('\nCasos a revisar:');
    fails.forEach((f) => console.log(`- ${f.name}: ${f.detail}`));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('Error ejecutando el test:', e);
  process.exitCode = 1;
});
