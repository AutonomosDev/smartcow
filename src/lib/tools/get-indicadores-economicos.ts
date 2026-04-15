export async function get_indicadores_economicos() {
  try {
    const response = await fetch("https://mindicador.cl/api", {
      next: { revalidate: 21600 } // Cache estricto por 6 horas
    });
    
    if (!response.ok) throw new Error("Error fetching data from mindicador.cl");
    const data = await response.json();
    
    return { 
      ok: true, 
      data: {
        uf: data.uf.valor,
        dolar: data.dolar.valor,
        euro: data.euro.valor,
        fecha: data.fecha
      } 
    };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
