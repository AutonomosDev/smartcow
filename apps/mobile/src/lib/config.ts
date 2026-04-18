import Constants from 'expo-constants';

/**
 * URL base del backend.
 *
 * Precedencia:
 * 1. EXPO_PUBLIC_API_URL (inyectada por EAS Build via eas.json "env" por perfil)
 * 2. expo.extra.apiUrl de app.json (fallback para builds manuales)
 * 3. Dominio de producción como último recurso
 *
 * En desarrollo, EAS inyecta EXPO_PUBLIC_API_URL=http://<IP-LOCAL>:3003.
 * NO usar 'localhost' — el emulador Android no lo resuelve.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'https://smartcow.cl';

// Firebase Auth REST API key — proyecto smartcow-c22fb (activo)
export const FIREBASE_API_KEY = 'AIzaSyBbpjCH2Vu0Tx0etlRxeIp7i5d_JpjiY04';

// Predio activo por defecto cuando el user tiene predios asignados
export const DEFAULT_PREDIO_ID = 11;
