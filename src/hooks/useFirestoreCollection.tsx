import { useState, useEffect } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { formatFirestoreDate } from '../lib/utils';

export function useFirestoreCollection<T>(query: Query | null, operationName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribed = false;
    const unsubscribe = onSnapshot(query, (snapshot) => {
      if (unsubscribed) return;
      const formattedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatFirestoreDate(doc.data().createdAt)
      })) as T[];

      setData(formattedData);
      setLoading(false);
    }, (err) => {
      if (unsubscribed) return;
      try {
        handleFirestoreError(err, OperationType.LIST, operationName);
      } catch (friendlyError) {
        setError(friendlyError instanceof Error ? friendlyError.message : 'An unexpected error occurred');
      }
      setLoading(false);
    });

    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, [query, operationName]);

  return { data, loading, error };
}
