// Verifies Firebase ID token from Authorization: Bearer <token>
// If token present and valid -> req.uid set
// If no token but uid in body -> uses that (dev fallback). You can remove fallback in prod.

import admin from "../lib/firebaseAdmin.js";

export async function verifyTokenOrUid(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.*)$/);
    if (match && match[1]) {
      const idToken = match[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.uid = decoded.uid;
      return next();
    }

    // fallback: use uid from body/query (only for dev/testing)
    const uid = req.body.uid || req.query.uid;
    if (uid) {
      req.uid = uid;
      return next();
    }

    return res.status(401).json({ error: "Authentication required. Provide ID token or uid." });
  } catch (err) {
    console.error("Auth middleware err:", err);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
