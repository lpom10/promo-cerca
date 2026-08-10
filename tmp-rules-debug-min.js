import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tickets/{ticketId} {
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.usuarioId
        && request.resource.data.promocionId is string
        && request.resource.data.usuarioId is string
        && exists(/databases/$(database)/documents/promociones/$(request.resource.data.promocionId));
    }
    match /promociones/{promoId} {
      allow write: if false;
      allow read: if false;
    }
  }
}`;

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
        activa: true,
        estado: 'aprobado',
        descuento: 20,
        ticketsGenerados: 1,
        ticketsMaximos: 10,
        createdAt: Timestamp.now(),
      });
    });

    const auth = env.authenticatedContext('usuarioTest123');
    const db = auth.firestore();
    const ticketRef = doc(db, 'tickets', 'usuarioTest123_promoOk');
    const data = {
      usuarioId: 'usuarioTest123',
      promocionId: 'promoOk',
    };
    try {
      await assertSucceeds(setDoc(ticketRef, data));
      console.log('minimal rule succeeded');
    } catch (e) {
      console.error('minimal rule failed', e.message);
    }
    await env.cleanup();
  } catch (e) {
    console.error('fatal', e);
  }
})();
