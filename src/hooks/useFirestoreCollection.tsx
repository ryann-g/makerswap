import { useState, useEffect } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { formatFirestoreDate } from '../lib/utils';

export function useFirestoreCollection<T>(query: Query | null, operationName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(query, (snapshot) => {
      const formattedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatFirestoreDate(doc.data().createdAt)
      })) as T[];
      
      setData(formattedData);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, operationName);
      } catch {
        // handleFirestoreError throws a user-friendly Error — we catch it here
        // because onSnapshot callbacks are not promise-based and unhandled
        // throws would prevent setLoading(false) from executing.
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [query, operationName]);

  return { data, loading };
}
