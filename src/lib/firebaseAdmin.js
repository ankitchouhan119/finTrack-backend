import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const keyPath = path.join(process.cwd(), "serviceAccountKey.json");

if (!fs.existsSync(keyPath)) {
  console.error("serviceAccountKey.json not found in backend root. Exiting.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
