import { GenerativeArtifact, ArtifactRow, KpiItem, AlertItem } from './artifact-renderer';

export function mapToolResultToArtifact(toolContext: { tool: string; result: any }): GenerativeArtifact | null {
  const { tool, result } = toolContext;

  if (!result) return null;

  try {
    switch (tool) {
      case 'get_clima':
        if (result.current_weather) {
          return { type: 'weather', title: 'Clima Predial', data: result };
        }
        return null;

      case 'get_indicadores_economicos':
        if (result.uf || result.dolar) {
          return { type: 'market', title: 'Indicadores Económicos', data: result };
        }
        return null;

      case 'get_animal':
        if (result.data) {
          return { type: 'animal', title: `Ficha: ${result.data.diio}`, data: result.data };
        }
        return null;

      case 'get_gdp':
        if (result.ok && result.data) {
          const gdp = Number(result.data.gdp_promedio || 0).toFixed(2);
          const dias = Number(result.data.dias_en_lote || 0).toFixed(0);
          const peso = Number(result.data.peso_promedio_actual || 0).toFixed(0);
          
          return {
            type: 'kpi',
            title: `Productividad (Lote ${result.data.lote_id})`,
            kpis: [
              { val: `${gdp} kg/d`, lbl: 'GDP', color: 'ok' },
              { val: `${peso} kg`, lbl: 'Peso Prom.', color: 'ok' },
            ],
            rows: [
              { label: 'Días en engorda', value: dias },
            ]
          };
        }
        return null;

      case 'get_alertas_salud':
        if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
          const items: AlertItem[] = result.data.map((al: any) => {
            let lvl: AlertItem['level'] = 'Info';
            if (al.nivel_gravedad > 7) lvl = 'Urgente';
            else if (al.nivel_gravedad > 4) lvl = 'Atención';
            return {
              level: lvl,
              text: `Animal ${al.diio}: ${al.descripcion}`
            };
          });
          return { type: 'alerts', title: 'Tratamientos / Alertas', items };
        }
        return null;

      case 'get_lotes':
      case 'get_lote_detalles':
        if (result.ok && result.data && Array.isArray(result.data)) {
          const rows: ArtifactRow[] = result.data.slice(0, 5).map((l: any) => ({
            label: l.nombre || `Lote ${l.id}`,
            value: `${l.cantidad_animales || l.cantidad || 0} cab.${l.estado ? ` - ${l.estado}` : ''}`,
            color: (l.cantidad_animales === 0 || l.cantidad === 0) ? 'warn' : 'ok'
          }));
          return {
            type: 'table',
            title: 'Lotes Destacados',
            rows
          };
        }
        return null;

      default:
        // Generic mapping fallback if valid data
        if (result.ok && result.data) {
           return {
             type: 'kpi',
             title: `Respuesta de ${tool}`,
             kpis: [{ val: 'OK', lbl: 'Dato', color: 'ok' }]
           }
        }
        return null;
    }
  } catch (e) {
    console.error('[Artifact Mapper Error]', e);
    return null;
  }
}
