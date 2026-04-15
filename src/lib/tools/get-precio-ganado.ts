export async function get_precio_ganado() {
  try {
    // Al no haber API pública JSON de transacciones ganaderas en Chile de libre acceso,
    // simulamos el último reporte de ferias referenciales de Osorno/Puerto Varas.
    // Esto luego se podría conectar a un Worker tipo cron schedule + redis KV.
    const mockData = {
      fecha_reporte: new Date().toISOString().split('T')[0],
      origen: "Feria Osorno (Mocked Data / Cache)",
      moneda: "CLP/kg",
      categorias: {
        "Terneros de Lechería": { min: 1100, max: 1350, rinde_esperado_pct: 45 },
        "Terneros de Engorda": { min: 1500, max: 1950, rinde_esperado_pct: 50 },
        "Novillos Engorda": { min: 1800, max: 2150, rinde_esperado_pct: 53 },
        "Novillos Gordo": { min: 2100, max: 2450, rinde_esperado_pct: 55 },
        "Vacas Gordas": { min: 1100, max: 1300, rinde_esperado_pct: 50 },
        "Vacas Desecho": { min: 600, max: 850, rinde_esperado_pct: 42 }
      }
    };
    
    return { ok: true, data: mockData };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
