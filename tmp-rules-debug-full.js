import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const rules = readFileSync('firestore.rules', 'utf8');

const ticketBase = {
  usuarioId: 'usuarioTest123',
  empresaId: 'empresaTest',
  promocionId: 'promoOk',
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

(async () => {
  try {
    const env = await initializeTestEnvironment({
      projectId: 'promo-cerca-26495',
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });

    await env.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'promociones', 'promoOk'), {
        empresaId: 'empresaTest',
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
    });

    const auth = env.authenticatedContext('usuarioTest123');
    const db = auth.firestore();
    const ticketRef = doc(db, 'tickets', 'usuarioTest123_promoOk');

    try {
      await assertSucceeds(setDoc(ticketRef, ticketBase));
      console.log('ticket write should succeed');
    } catch (e) {
      console.error('ticket write failed', e);
    }

    await env.cleanup();
  } catch (e) {
    console.error('fatal:', e);
  }
})();
