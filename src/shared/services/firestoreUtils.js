import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { logError } from '../../shared/utils/errorHandler';

export const toDocumentWithId = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
});

export const toDocumentsWithId = (snapshot) => snapshot.docs.map(toDocumentWithId);

export const buildQuery = ({ collectionName, constraints = [], pageSize = null, lastDoc = null }) => {
  const normalizedConstraints = [...constraints];

  if (lastDoc) {
    normalizedConstraints.push(startAfter(lastDoc));
  }

  if (pageSize) {
    normalizedConstraints.push(limit(pageSize));
  }

  return query(collection(db, collectionName), ...normalizedConstraints);
};

export const fetchCollection = async ({ collectionName, constraints = [], pageSize = null, lastDoc = null }) => {
  const q = buildQuery({ collectionName, constraints, pageSize, lastDoc });
  const snapshot = await getDocs(q);
  return toDocumentsWithId(snapshot);
};

export const fetchDocById = async (collectionName, id) => {
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? toDocumentWithId(snapshot) : null;
};

export const fetchDocsByField = async (collectionName, field, value) => {
  const snapshot = await getDocs(query(collection(db, collectionName), where(field, '==', value)));
  return toDocumentsWithId(snapshot);
};

export const subscribeToCollection = ({ collectionName, constraints = [], pageSize = null, onChange, onError }) => {
  const q = buildQuery({ collectionName, constraints, pageSize });
  return onSnapshot(q, (snapshot) => {
    onChange?.(toDocumentsWithId(snapshot));
  }, (error) => {
    logError(error, { accion: 'subscribeToCollection', collectionName });
    onError?.(error);
  });
};

export const formatTimestamp = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  return value instanceof Date ? value : new Date(value);
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
