import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let serviceAccount = null;

// Paths to check, in order:
const localPath = path.join(process.cwd(), "serviceAccountKey.json");
const renderSecretPath = "/etc/secrets/serviceAccountKey.json";

// Check if JSON file exists locally
if (fs.existsSync(localPath)) {
  console.log("Loading serviceAccountKey.json from file...");
  serviceAccount = JSON.parse(fs.readFileSync(localPath, "utf8"));
} 

// 2️⃣ RENDER Secret File support
else if (fs.existsSync(renderSecretPath)) {
  console.log("✅ Using Render Secret File at /etc/secrets/serviceAccountKey.json");
  serviceAccount = JSON.parse(fs.readFileSync(renderSecretPath, "utf8"));
}


// Fallback to environment variable (Render, Production)
// else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//   console.log("Loading service account from environment variable...");
//   try {
//     serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//   } catch (err) {
//     console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON.");
//     process.exit(1);
//   }
// }
// No key found → exit
else {
  console.error("serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT not set.");
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
