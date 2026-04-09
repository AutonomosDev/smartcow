/**
 * client.ts — Cliente HTTP para AgroApp.
 *
 * AgroApp (Angular 5 + Apache Tomcat 6.0.45) usa GET con query params.
 * Patrón real (verificado en campo 2026-04-09):
 *   GET http://agroapp.cl:8080/AgroAppWebV18/{Servlet}
 *       ?usuario={user}&clave={pass}&service={action}&jsonFiltros={JSON}
 *
 * Credenciales: GCP Secret Manager → env vars
 *   AGROAPP_USER / AGROAPP_PASSWORD
 *
 * Ticket: AUT-124
 */

const BACKEND_URL = "http://agroapp.cl:8080/AgroAppWebV18/";

/** Retorna las credenciales desde env vars (resueltas vía GCP Secret Manager en Cloud Run). */
function getCredentials(): { usuario: string; clave: string } {
  const usuario = process.env.AGROAPP_USER;
  const clave = process.env.AGROAPP_PASSWORD;
  if (!usuario || !clave) {
    throw new Error(
      "Missing AgroApp credentials. Set AGROAPP_USER and AGROAPP_PASSWORD env vars " +
        "(resolved from GCP Secret Manager in Cloud Run)."
    );
  }
  return { usuario, clave };
}

export interface AgroAppSession {
  usuario: string;
  clave: string;
}

/** Singleton de sesión activa. */
let activeSession: AgroAppSession | null = null;

/** Obtiene (o crea) la sesión AgroApp. Sin estado de browser — solo credenciales. */
export async function getSession(): Promise<AgroAppSession> {
  if (activeSession) return activeSession;
  return createSession();
}

function createSession(): AgroAppSession {
  const { usuario, clave } = getCredentials();
  activeSession = { usuario, clave };
  return activeSession;
}

/** Limpia la sesión activa. */
export async function destroySession(): Promise<void> {
  activeSession = null;
}

/**
 * Ejecuta una llamada GET al servlet de AgroApp.
 *
 * Formato real AgroApp:
 *   GET /AgroAppWebV18/{Servlet}?usuario=X&clave=Y&service=Z&jsonFiltros={...}
 *
 * El parámetro `servicio` (nombre interno) se mapea a `service` en la URL.
 * Los filtros se pasan como JSON string en `jsonFiltros`.
 */
export async function servletPost<T>(
  session: AgroAppSession,
  servlet: string,
  servicio: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const url = new URL(`${BACKEND_URL}${servlet}`);
  url.searchParams.set("usuario", session.usuario);
  url.searchParams.set("clave", session.clave);
  url.searchParams.set("service", servicio);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`AgroApp servlet ${servlet}/${servicio} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}
