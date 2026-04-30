import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load firebase config for project ID
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));

// Initialize Firebase Admin
try {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
} catch (e) {
  console.error("Firebase Admin initialization failed.", e);
}

const db = getFirestore();
const auth = getAuth();

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
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth Middleware
  const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Listings ---
  app.get("/api/listings", async (req: Request, res: Response) => {
    try {
      let query: any = db.collection(COLLECTIONS.LISTINGS).orderBy("createdAt", "desc");
      if (req.query.userId) {
        query = query.where("sellerId", "==", req.query.userId);
      }
      if (req.query.category) {
        query = query.where("category", "==", req.query.category);
      }
      const snapshot = await query.get();
      const listings = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const listingData = {
        ...req.body,
        sellerId: req.user.uid,
        createdAt: new Date().toISOString(),
        status: "AVAILABLE"
      };
      const docRef = await db.collection(COLLECTIONS.LISTINGS).add(listingData);
      res.status(201).json({ id: docRef.id, ...listingData });
    } catch (error) {
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.LISTINGS).doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Listing not found" });
      if (doc.data()?.sellerId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
      
      await docRef.update(req.body);
      res.json({ id: req.params.id, ...doc.data(), ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.LISTINGS).doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      if (doc.data()?.sellerId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Not the seller" });
      }

      await docRef.delete();
      res.json({ message: "Listing deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  // --- Bounties ---
  app.get("/api/bounties", async (req: Request, res: Response) => {
    try {
      let query: any = db.collection(COLLECTIONS.BOUNTIES).orderBy("createdAt", "desc");
      if (req.query.userId) {
        query = query.where("posterId", "==", req.query.userId);
      }
      const snapshot = await query.get();
      const bounties = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(bounties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bounties" });
    }
  });

  app.post("/api/bounties", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const bountyData = {
        ...req.body,
        posterId: req.user.uid,
        createdAt: new Date().toISOString(),
        status: "OPEN"
      };
      const docRef = await db.collection(COLLECTIONS.BOUNTIES).add(bountyData);
      res.status(201).json({ id: docRef.id, ...bountyData });
    } catch (error) {
      res.status(500).json({ error: "Failed to create bounty" });
    }
  });

  app.patch("/api/bounties/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.BOUNTIES).doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Bounty not found" });
      if (doc.data()?.posterId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
      
      await docRef.update(req.body);
      res.json({ id: req.params.id, ...doc.data(), ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to update bounty" });
    }
  });

  app.delete("/api/bounties/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const docRef = db.collection(COLLECTIONS.BOUNTIES).doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Bounty not found" });
      if (doc.data()?.posterId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });

      await docRef.delete();
      res.json({ message: "Bounty deleted" });
    } catch (error) {
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
      res.status(500).json({ error: "Failed to update user" });
    }
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
