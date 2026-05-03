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
      handleFirestoreError(error, OperationType.LIST, operationName);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [query, operationName]);

  return { data, loading };
}
