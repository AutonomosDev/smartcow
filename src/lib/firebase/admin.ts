/**
 * src/lib/firebase/admin.ts — Firebase Admin SDK singleton.
 * Server-only. Usado para verificar session cookies e ID tokens.
 *
 * En Cloud Run usa applicationDefault() (identidad de servicio).
 * En otros entornos usa credenciales explícitas via env vars.
 */
import "server-only";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const isCloudRun = !!process.env.K_SERVICE;

  const credential =
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    !isCloudRun
      ? admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "smartcow-prod",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        })
      : admin.credential.applicationDefault();

  admin.initializeApp({
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = admin.auth();
