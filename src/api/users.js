import express from "express";
import { db, auth } from "../lib/firebaseAdmin.js";
import { verifyTokenOrUid } from "../middleware/auth.js";

const router = express.Router();

// Get user profile (fetch from users collection)
router.get("/profile", verifyTokenOrUid, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    res.json(userDoc.data());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching profile" });
  }
});

// Update profile: body { profile: { name, mobileNumber, photoURL } }
router.post("/profile", verifyTokenOrUid, async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: "Profile data required" });

    await db.collection("users").doc(req.uid).set(profile, { merge: true });
    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating profile" });
  }
});

// Optional: verify token and return uid (handy for frontends)
router.get("/verify", verifyTokenOrUid, (req, res) => {
  res.json({ uid: req.uid });
});

export default router;
