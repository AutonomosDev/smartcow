// Base URL del backend. En dev apunta al Next dev server local (auth() bypass
// con DEV_SESSION). En prod: dominio desplegado.
// `smartcow_mob` levanta Next dev en :3003 y exporta EXPO_PUBLIC_DEV_HOST con
// la IP LAN detectada en ese momento.
const DEV_HOST = process.env.EXPO_PUBLIC_DEV_HOST || '192.168.1.212';
export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:3003`
  : 'https://smartcow.cl';

// Firebase Auth REST API key — proyecto smartcow-c22fb (activo)
export const FIREBASE_API_KEY = 'AIzaSyBbpjCH2Vu0Tx0etlRxeIp7i5d_JpjiY04';

// Predio activo por defecto cuando el user tiene predios asignados
export const DEFAULT_PREDIO_ID = 11;
