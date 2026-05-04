import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Read firebase config
const configPath = './firebase-applet-config.json';
const config = JSON.parse(readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkCollections() {
  const collectionsToCheck = ['listings', 'bounties', 'hardware', 'items', 'tasks'];
  
  for (const col of collectionsToCheck) {
    try {
      const q = query(collection(db, col), limit(1));
      const snap = await getDocs(q);
      console.log(`\n--- Collection: ${col} ---`);
      if (snap.empty) {
        console.log(`Collection ${col} is empty or doesn't exist.`);
      } else {
        snap.forEach(doc => {
          console.log(`Document ID: ${doc.id}`);
          console.log(JSON.stringify(doc.data(), null, 2));
        });
      }
    } catch (e: any) {
      console.log(`Error reading ${col}:`, e.message);
    }
  }
}

checkCollections().then(() => process.exit(0));
