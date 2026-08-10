import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tickets/{ticketId} {
      allow create: if request.auth != null;
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

    const auth = env.authenticatedContext('usuarioTest123');
    const db = auth.firestore();
    const ticketRef = doc(db, 'tickets', 't1');
    try {
      await assertSucceeds(setDoc(ticketRef, { usuarioId: 'usuarioTest123' }));
      console.log('auth worked');
    } catch (e) {
      console.error('assertSucceeds failed:', e.message);
    }
    await env.cleanup();
  } catch (e) {
    console.error('fatal:', e);
  }
})();
