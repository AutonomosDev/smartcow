// Base URL del backend. En dev usar la IP local de la máquina (no localhost —
// el emulador Android no resuelve localhost del host). En prod: dominio desplegado.
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3003' // ⚠️ AG: cambiar por IP local de la máquina de dev
  : 'https://smartcow-c22fb.web.app';

// Firebase Auth REST API key (público — mismo que NEXT_PUBLIC_FIREBASE_API_KEY)
export const FIREBASE_API_KEY = 'AIzaSyAFzRl-sa9drslWp5btfq0A-Ujbgpvd0uU';

// Predio activo por defecto cuando el user tiene predios asignados
export const DEFAULT_PREDIO_ID = 11;
