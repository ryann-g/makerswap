import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// To run this script:
// 1. npm install firebase-admin
// 2. Place your serviceAccountKey.json in the root directory
// 3. node scratch/migrate.js

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

// Initialize Admin SDK
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Configuration: Adjust these if you ever have database drift
const SOURCE_COLLECTION = 'products'; // e.g., The wrong collection name
const TARGET_COLLECTION = 'listings'; // The correct collection name

const FIELD_MAPPINGS = {
  // 'wrong_field_name': 'correct_field_name'
  'item_name': 'title',
  'desc': 'description',
  'cost': 'price',
  'image': 'imageUrl'
};

async function migrate() {
  console.log(`Migrating from ${SOURCE_COLLECTION} to ${TARGET_COLLECTION}...`);
  const snapshot = await db.collection(SOURCE_COLLECTION).get();
  
  if (snapshot.empty) {
    console.log(`No documents found in ${SOURCE_COLLECTION}.`);
    return;
  }

  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    const oldData = doc.data();
    const newData = { ...oldData };

    // Rename fields based on mapping
    for (const [oldField, newField] of Object.entries(FIELD_MAPPINGS)) {
      if (newData[oldField] !== undefined) {
        newData[newField] = newData[oldField];
        delete newData[oldField];
      }
    }

    // Set the document in the correct collection
    const targetRef = db.collection(TARGET_COLLECTION).doc(doc.id);
    batch.set(targetRef, newData);
  });

  await batch.commit();
  console.log(`Migration complete. Successfully aligned database with codebase.`);
}

migrate().catch(console.error);
