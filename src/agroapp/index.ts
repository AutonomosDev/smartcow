/**
 * index.ts — Public API del proxy AgroApp.
 * Ticket: AUT-124
 */

export { cache, MemoryCache } from "./cache.js";
export { isModuleEnabled, assertModuleEnabled, type AgroAppModule } from "./modules.js";
export { getSession, destroySession, servletPost } from "./client.js";
export {
  // Tipos filtros
  type FiltrosBase,
  type FiltrosGanado,
  type FiltrosPesajes,
  type FiltrosPartos,
  type FiltrosInseminaciones,
  type FiltrosEcografias,
  // Ganado actual
  getGanadoActual,
  // Pesajes
  getPesajes,
  getGanancias,
  // Partos
  getPartos,
  getPartosPendientes,
  // Inseminaciones
  getInseminaciones,
  getInseminacionesPendientes,
  // Ecografías
  getEcografias,
  getEcografiasPendientes,
} from "./proxy.js";
