// Base URL del backend. En dev usar la IP local de la máquina (no localhost —
// el emulador Android no resuelve localhost del host). En prod: dominio desplegado.
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.213:3003'
  : 'https://smartcow--smartcow-c22fb.us-central1.hosted.app';

// Firebase Auth REST API key — proyecto smartcow-c22fb (activo)
export const FIREBASE_API_KEY = 'AIzaSyBbpjCH2Vu0Tx0etlRxeIp7i5d_JpjiY04';

// Predio activo por defecto cuando el user tiene predios asignados
export const DEFAULT_PREDIO_ID = 11;
