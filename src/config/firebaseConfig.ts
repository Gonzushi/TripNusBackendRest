import admin from "firebase-admin";

// Initialize Firebase Admin with service account
// You need to set FIREBASE_SERVICE_ACCOUNT as a JSON string in your environment variables
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
