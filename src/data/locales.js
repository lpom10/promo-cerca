import { db } from './config';
import { collection, getDocs } from 'firebase/firestore';

export const getLocales = async () => {
  const snapshot = await getDocs(collection(db, 'promociones'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};