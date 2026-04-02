/**
 * modules.ts — Feature flags por módulo AgroApp.
 * Permite desactivar un módulo cuando la DB propia esté lista.
 * Control via env vars: AGROAPP_MODULE_<NOMBRE>=0 para deshabilitar.
 * Ticket: AUT-124
 */

export type AgroAppModule =
  | "ganado_actual"
  | "pesajes"
  | "partos"
  | "inseminaciones"
  | "ecografias";

const MODULE_ENV_MAP: Record<AgroAppModule, string> = {
  ganado_actual: "AGROAPP_MODULE_GANADO_ACTUAL",
  pesajes: "AGROAPP_MODULE_PESAJES",
  partos: "AGROAPP_MODULE_PARTOS",
  inseminaciones: "AGROAPP_MODULE_INSEMINACIONES",
  ecografias: "AGROAPP_MODULE_ECOGRAFIAS",
};

/**
 * Retorna true si el módulo está habilitado.
 * Por defecto todos están habilitados salvo que la env var sea "0" o "false".
 */
export function isModuleEnabled(module: AgroAppModule): boolean {
  const envKey = MODULE_ENV_MAP[module];
  const val = process.env[envKey];
  if (val === undefined) return true;
  return val !== "0" && val.toLowerCase() !== "false";
}

/** Lanza si el módulo está deshabilitado. */
export function assertModuleEnabled(module: AgroAppModule): void {
  if (!isModuleEnabled(module)) {
    throw new Error(
      `AgroApp module "${module}" is disabled. Set ${MODULE_ENV_MAP[module]}=1 to enable.`
    );
  }
}
