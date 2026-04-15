export * from "./get-lotes";
export * from "./get-gdp";
export * from "./get-animal";
export * from "./get-animales";
export * from "./get-pesajes";
export * from "./get-partos";
export * from "./get-inseminaciones";
export * from "./get-ecografias";
export * from "./get-bajas";
export * from "./get-ubicacion";
export * from "./get-potreros";
export * from "./get-clima";
export * from "./get-indicadores-economicos";
export * from "./get-precio-ganado";

export const smartCowToolsDefinitions = [
  {
    name: "get_lotes",
    description: "Obtiene todos los lotes activos del predio con GDP calculado",
    input_schema: {
      type: "object",
      properties: { predioId: { type: "number" } },
      required: ["predioId"],
    },
  },
  {
    name: "get_gdp",
    description: "Obtiene el GDP de un lote específico y proyección",
    input_schema: {
      type: "object",
      properties: { 
        loteId: { type: "number" },
        periodo: { 
          type: "object", 
          properties: { desde: { type: "string" }, hasta: { type: "string" } }
        }
      },
      required: ["loteId"],
    },
  },
  {
    name: "get_animal",
    description: "Obtiene la ficha completa de un animal por su DIIO",
    input_schema: {
      type: "object",
      properties: { diio: { type: "string" } },
      required: ["diio"],
    },
  },
  {
    name: "get_animales",
    description: "Obtiene una lista de animales en el predio con filtros opcionales",
    input_schema: {
      type: "object",
      properties: { 
        predioId: { type: "number" },
        filtros: { 
            type: "object",
            properties: { estado: { type: "string" }, sexo: { type: "string" }, modulo: { type: "string" }, raza: { type: "string" } }
        }
      },
      required: ["predioId"],
    },
  },
  {
    name: "get_pesajes",
    description: "Retorna el historial de pesos con fecha para un animal o predio",
    input_schema: {
      type: "object",
      properties: { 
        animalId: { type: "number" },
        predioId: { type: "number" },
        periodo: { 
          type: "object", 
          properties: { desde: { type: "string" }, hasta: { type: "string" } }
        }
      },
    },
  },
  {
    name: "get_partos",
    description: "Obtiene total estadístico de partos, resultados y tasa de parición",
    input_schema: {
      type: "object",
      properties: { 
        predioId: { type: "number" },
        periodo: { 
          type: "object", 
          properties: { desde: { type: "string" }, hasta: { type: "string" } }
        }
      },
      required: ["predioId"],
    },
  },
  {
    name: "get_inseminaciones",
    description: "Retorna total de IA, resultados y tasa de preñez calculada",
    input_schema: {
      type: "object",
      properties: { 
        predioId: { type: "number" },
        periodo: { 
          type: "object", 
          properties: { desde: { type: "string" }, hasta: { type: "string" } }
        }
      },
      required: ["predioId"],
    },
  },
  {
    name: "get_ecografias",
    description: "Retorna preñadas confirmadas y partos esperados a 30/60/90 días",
    input_schema: {
      type: "object",
      properties: { predioId: { type: "number" } },
      required: ["predioId"],
    },
  },
  {
    name: "get_bajas",
    description: "Retorna total de bajas, tasa de mortalidad y detalle por motivo/causa",
    input_schema: {
      type: "object",
      properties: { 
        predioId: { type: "number" },
        periodo: { 
          type: "object", 
          properties: { desde: { type: "string" }, hasta: { type: "string" } }
        }
      },
      required: ["predioId"],
    },
  },
  {
    name: "get_ubicacion_animales",
    description: "Retorna animales agrupados por potrero",
    input_schema: {
      type: "object",
      properties: { predioId: { type: "number" } },
      required: ["predioId"],
    },
  },
  {
    name: "get_potreros",
    description: "Obtiene hectáreas, capacidad máxima y tipo de potreros",
    input_schema: {
      type: "object",
      properties: { predioId: { type: "number" } },
      required: ["predioId"],
    },
  },
  {
    name: "get_clima",
    description: "Obtiene el clima actual y pronóstico usando la latitud y longitud del predio vía OpenMeteo",
    input_schema: {
      type: "object",
      properties: { predioId: { type: "number" } },
      required: ["predioId"],
    },
  },
  {
    name: "get_indicadores_economicos",
    description: "Obtiene el valor actual de UF, Dólar y Euro a través de mindicador.cl",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_precio_ganado",
    description: "Obtiene información referencial de precios de la feria ganadera por categoría (CLP/kg)",
    input_schema: {
      type: "object",
      properties: {},
    },
  }
];
