// Tablas base
export * from "./organizaciones";
export * from "./kb_documents";
export * from "./holdings";
export * from "./predios";
export * from "./users";

// Catálogos de referencia
export * from "./catalogos";

// Mediería (antes de animales — animales importa desde aquí)
export * from "./medieros";

// Proveedores de ganado (AUT-296: ferias, criadores, intermediarios)
export * from "./proveedores";

// Dominio ganadero
export * from "./animales";
export * from "./lotes";
export * from "./pesajes";
export * from "./partos";
export * from "./inseminaciones";
export * from "./ecografias";
export * from "./areteos";
export * from "./bajas";
export * from "./potreros";
export * from "./movimientos_potrero";
export * from "./ventas";
export * from "./tratamientos";
export * from "./traslados";
export * from "./inventarios";
export * from "./corrales";

// Datos de mercado externo
export * from "./precios-feria";

// KPIs diarios (AUT-391)
export * from "./kpi_diario";

// Chat
export * from "./conversaciones";
export * from "./chat_sessions";
export * from "./chat_attachments";
export * from "./chat_usage";
export * from "./chat-cache";
export * from "./slash_commands";
export * from "./user_tasks";
export * from "./user-memory";
