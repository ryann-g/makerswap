import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps, getApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load firebase config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

  // Initialize Firebase Admin
  let db: any;
  let auth: any;

  const initializeFirebase = async () => {
    try {
      const rootDir = process.cwd();
      const serviceAccountPath = path.resolve(rootDir, "serviceAccountKey.json");
      console.log("Initializing Firebase Admin. CWD:", rootDir);
      
      let app: any;

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        console.log("Service Account Key found for project:", serviceAccount.project_id);
        
        if (getApps().length === 0) {
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: firebaseConfig.projectId || serviceAccount.project_id
          });
        } else {
          app = getApp();
        }
      } else {
        console.warn("serviceAccountKey.json not found, falling back to ADC.");
        if (getApps().length === 0) {
          app = initializeApp({
            projectId: firebaseConfig.projectId,
            credential: applicationDefault(),
          });
        } else {
          app = getApp();
        }
      }
      
      const databaseId = (firebaseConfig.firestoreDatabaseId || "(default)").trim();
      console.log(`Attempting to use database: ${databaseId}`);
      const dbInstance = getFirestore(app, databaseId);
      
      try {
        // Verification call
        await dbInstance.listCollections();
        console.log(`Successfully connected to database: ${databaseId}`);
        db = dbInstance;
      } catch (err: any) {
        console.error(`Error connecting to database ${databaseId}:`, err.message);
        if (databaseId !== "(default)") {
          console.log("Attempting fallback to (default) database...");
          const defaultDb = getFirestore(app, "(default)");
          try {
            await defaultDb.listCollections();
            console.log("Successfully connected to (default) database.");
            db = defaultDb;
          } catch (defaultErr: any) {
            console.error("Default database also inaccessible:", defaultErr.message);
            db = dbInstance;
          }
        } else {
          db = dbInstance;
        }
      }
      
      auth = getAuth(app);
    } catch (e) {
      console.error("Firebase Admin initialization fatal error:", e);
    }
  };

// Helper to normalize timestamps for sorting
const getTimestamp = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (val && typeof val.toMillis === 'function') return val.toMillis();
  return 0;
};

// Collection names
const COLLECTIONS = {
  LISTINGS: "listings",
  BOUNTIES: "bounties",
  USERS: "users",
};

interface AuthRequest extends Request {
  user?: any;
}

async function startServer() {
  await initializeFirebase();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Internal test endpoint to check database access
  app.get("/api/admin/test", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not initialized" });
      const collections = await db.listCollections();
      const listingCount = await db.collection("listings").count().get();
      res.json({
        initialized: true,
        project: firebaseConfig.projectId,
        database: (firebaseConfig.firestoreDatabaseId || "(default)").trim(),
        collections: collections.map((c: any) => c.id),
        listingCount: listingCount.data().count
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Test failed", 
        message: error.message,
        stack: error.stack,
        code: error.code
      });
    }
  });

  // Log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      await db.collection("health").doc("check").get();
      res.json({ status: "ok", database: "connected" });
    } catch (error: any) {
      console.error("Health check failed:", error.message);
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // --- API Routes ---

  // Auth Middleware
  const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No auth header provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Auth token verification failed:", error);
      res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };

  // --- Listings ---
  app.get("/api/listings", async (req: Request, res: Response) => {
    try {
      if (!db) {
        console.error("Firestore DB not initialized");
        return res.status(500).json({ error: "Database not initialized" });
      }

      // FIX: Removed .orderBy() to prevent Composite Index errors
      let query: any = db.collection(COLLECTIONS.LISTINGS);
      
      if (req.query.userId) {
        query = query.where("sellerId", "==", req.query.userId);
      }
      if (req.query.category && req.query.category !== 'ALL') {
        query = query.where("category", "==", req.query.category);
      }

      const snapshot = await query.get();
      console.log(`Fetched ${snapshot.size} listings for query:`, req.query);
      const listings = snapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // FIX: Robust sort in memory
      listings.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
      
      res.json(listings);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ 
        error: "Failed to fetch listings", 
        details: error.message,
        code: error.code
      });
    }
  });

  app.post("/api/listings", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const listingData = {
        ...req.body,
        sellerId: req.user.uid,
        createdAt: Date.now(),
        status: req.body.status || "AVAILABLE"
      };
      
      const docRef = await db.collection(COLLECTIONS.LISTINGS).add(listingData);
      console.log("Listing created:", docRef.id);
      res.status(201).json({ id: docRef.id, ...listingData });
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.LISTINGS).doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) return res.status(404).json({ error: "Listing not found" });
      
      const data = doc.data();
      if (data?.sellerId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Not the owner" });
      }
      
      await docRef.update(req.body);
      res.json({ id: req.params.id, ...data, ...req.body });
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.LISTINGS).doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) return res.status(404).json({ error: "Listing not found" });
      
      const data = doc.data();
      if (data?.sellerId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Not the owner" });
      }

      await docRef.delete();
      res.json({ message: "Listing deleted" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  // --- Bounties ---
  app.get("/api/bounties", async (req: Request, res: Response) => {
    try {
      // FIX: Removed .orderBy() to prevent Composite Index errors
      let query: any = db.collection(COLLECTIONS.BOUNTIES);
      
      if (req.query.userId) {
        query = query.where("posterId", "==", req.query.userId);
      }

      const snapshot = await query.get();
      console.log(`Fetched ${snapshot.size} bounties for query:`, req.query);
      const bounties = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      // FIX: Robust sort in memory
      bounties.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
      
      res.json(bounties);
    } catch (error) {
      console.error("Error fetching bounties:", error);
      res.status(500).json({ error: "Failed to fetch bounties" });
    }
  });

  app.post("/api/bounties", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const bountyData = {
        ...req.body,
        posterId: req.user.uid,
        createdAt: Date.now(),
        status: "OPEN"
      };
      
      const docRef = await db.collection(COLLECTIONS.BOUNTIES).add(bountyData);
      console.log("Bounty created:", docRef.id);
      res.status(201).json({ id: docRef.id, ...bountyData });
    } catch (error) {
      console.error("Error creating bounty:", error);
      res.status(500).json({ error: "Failed to create bounty" });
    }
  });

  app.patch("/api/bounties/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.BOUNTIES).doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) return res.status(404).json({ error: "Bounty not found" });
      
      const data = doc.data();
      if (data?.posterId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Not the owner" });
      }
      
      await docRef.update(req.body);
      res.json({ id: req.params.id, ...data, ...req.body });
    } catch (error) {
      console.error("Error updating bounty:", error);
      res.status(500).json({ error: "Failed to update bounty" });
    }
  });

  app.delete("/api/bounties/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.BOUNTIES).doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) return res.status(404).json({ error: "Bounty not found" });
      
      const data = doc.data();
      if (data?.posterId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Not the owner" });
      }

      await docRef.delete();
      res.json({ message: "Bounty deleted" });
    } catch (error) {
      console.error("Error deleting bounty:", error);
      res.status(500).json({ error: "Failed to delete bounty" });
    }
  });

  // --- Users ---
  app.get("/api/users/:uid", async (req: Request, res: Response) => {
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(req.params.uid).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(doc.data());
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:uid", authenticate, async (req: AuthRequest, res: Response) => {
    if (req.params.uid !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden: Cannot update other users" });
    }
    try {
      await db.collection(COLLECTIONS.USERS).doc(req.params.uid).set(req.body, { merge: true });
      res.json({ message: "User updated" });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Global Error Handler - MUST BE LAST
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message,
      path: req.path
    });
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
