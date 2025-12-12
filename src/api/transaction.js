import express from "express";
import { db } from "../lib/firebaseAdmin.js";
import { verifyTokenOrUid } from "../middleware/auth.js";
import { Parser } from "json2csv";

const router = express.Router();

// Add transaction
// Body: { transaction: { type, date, amount, tag } }
// Auth: Bearer <idToken> OR body.uid
router.post("/add", verifyTokenOrUid, async (req, res) => {
  try {
    const { transaction } = req.body;
    if (!transaction) return res.status(400).json({ error: "No transaction provided" });

    const ref = await db.collection("users").doc(req.uid).collection("transactions").add(transaction);
    const added = (await ref.get()).data();
    res.json({ id: ref.id, ...added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding transaction" });
  }
});

// Get all transactions
// GET /all?uid=...  OR Authorization: Bearer <idToken>
router.get("/all", verifyTokenOrUid, async (req, res) => {
  try {
    const snapshot = await db.collection("users").doc(req.uid).collection("transactions").get();
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching transactions" });
  }
});

// Delete all transactions (batch)
router.delete("/delete-all", verifyTokenOrUid, async (req, res) => {
  try {
    const colRef = db.collection("users").doc(req.uid).collection("transactions");
    const snapshot = await colRef.get();

    if (snapshot.empty) return res.json({ message: "No transactions to delete" });

    // Batch delete in chunks of 500 (Firestore limit)
    const chunks = [];
    let batch = db.batch();
    let counter = 0;

    for (const docSnap of snapshot.docs) {
      batch.delete(docSnap.ref);
      counter++;
      if (counter === 450) { // commit before 500 to be safe
        chunks.push(batch.commit());
        batch = db.batch();
        counter = 0;
      }
    }
    chunks.push(batch.commit());
    await Promise.all(chunks);

    res.json({ message: "All transactions deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting transactions" });
  }
});

// Import transactions array (body: { transactions: [ {...} ] })
// Use to bulk-add parsed CSV transactions from frontend.
router.post("/import", verifyTokenOrUid, async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0)
      return res.status(400).json({ error: "transactions array required" });

    const colRef = db.collection("users").doc(req.uid).collection("transactions");
    const batchSize = 400;
    let batch = db.batch();
    let counter = 0;
    const created = [];

    for (const tx of transactions) {
      const docRef = colRef.doc();
      batch.set(docRef, tx);
      created.push({ id: docRef.id, ...tx });
      counter++;
      if (counter >= batchSize) {
        await batch.commit();
        batch = db.batch();
        counter = 0;
      }
    }
    if (counter > 0) await batch.commit();

    res.json({ message: "Imported", count: created.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error importing transactions" });
  }
});

// Export transactions as CSV (stream as attachment)
router.get("/export", verifyTokenOrUid, async (req, res) => {
  try {
    const snapshot = await db.collection("users").doc(req.uid).collection("transactions").get();
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!data.length) {
      return res.status(200).json({ message: "No transactions", data: [] });
    }

    const fields = Object.keys(data[0]);
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("transactions.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error exporting CSV" });
  }
});

export default router;
