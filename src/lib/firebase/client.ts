/**
 * src/lib/firebase/client.ts — Firebase Client SDK.
 * Solo para uso en browser (login page).
 * Guard SSR: no inicializa si no hay API key (build time / SSR sin config).
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

let clientAuth: Auth;

if (apiKey) {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  const app: FirebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  clientAuth = getAuth(app);
} else {
  // SSR / build time without config — create stub that throws on use
  clientAuth = {
    currentUser: null,
  } as unknown as Auth;
}

export { clientAuth };
