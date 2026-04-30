import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OperationType, FirestoreErrorInfo, Listing, Bounty, UserProfile, Category, ListingStatus, BountyStatus } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function processDocData<T>(doc: any): T {
  const data = doc.data();
  let createdAt = Date.now();
  
  if (data.createdAt) {
    if (typeof data.createdAt.toMillis === 'function') {
      createdAt = data.createdAt.toMillis();
    } else if (typeof data.createdAt === 'number') {
      createdAt = data.createdAt;
    } else if (data.createdAt && typeof data.createdAt === 'object' && 'seconds' in data.createdAt) {
      createdAt = data.createdAt.seconds * 1000;
    } else {
      try {
        const d = new Date(data.createdAt);
        if (!isNaN(d.getTime())) {
          createdAt = d.getTime();
        }
      } catch (e) {}
    }
  }

  return { 
    id: doc.id, 
    ...data, 
    createdAt,
    price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
    budget: typeof data.budget === 'number' ? data.budget : Number(data.budget) || 0
  } as T;
}

// User Profile
export async function createUserProfile(uid: string, profile: Partial<UserProfile>) {
  if (!db) return;
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), {
      ...profile,
      uid,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Listings
export async function createListing(listing: Omit<Listing, 'id' | 'createdAt' | 'status'>) {
  if (!db) return;
  const path = 'listings';
  try {
    const docRef = await addDoc(collection(db, 'listings'), {
      ...listing,
      status: ListingStatus.AVAILABLE,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getListings(category?: Category): Promise<Listing[]> {
  if (!db) return [];
  const path = 'listings';
  try {
    let q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    if (category) {
      q = query(q, where('category', '==', category));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processDocData<Listing>(doc));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  if (!db) return [];
  const path = 'listings';
  try {
    const q = query(collection(db, 'listings'), where('sellerId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processDocData<Listing>(doc));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function updateListingStatus(listingId: string, status: ListingStatus) {
  if (!db) return;
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListing(listingId: string) {
  if (!db) return;
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bounties
export async function createBounty(bounty: Omit<Bounty, 'id' | 'createdAt' | 'status'>) {
  if (!db) return;
  const path = 'bounties';
  try {
    const docRef = await addDoc(collection(db, 'bounties'), {
      ...bounty,
      status: BountyStatus.OPEN,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getBounties(): Promise<Bounty[]> {
  if (!db) return [];
  const path = 'bounties';
  try {
    const q = query(collection(db, 'bounties'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processDocData<Bounty>(doc));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getUserBounties(userId: string): Promise<Bounty[]> {
  if (!db) return [];
  const path = 'bounties';
  try {
    const q = query(collection(db, 'bounties'), where('posterId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processDocData<Bounty>(doc));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function updateBountyStatus(bountyId: string, status: BountyStatus) {
  if (!db) return;
  const path = `bounties/${bountyId}`;
  try {
    await updateDoc(doc(db, 'bounties', bountyId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBounty(bountyId: string) {
  if (!db) return;
  const path = `bounties/${bountyId}`;
  try {
    await deleteDoc(doc(db, 'bounties', bountyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
