import { db } from "@/src/db/client";
import { predios } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

export async function get_clima(predioId: number) {
  try {
    const [predio] = await db.select({ config: predios.config }).from(predios).where(eq(predios.id, predioId));
    
    // Default a Osorno, Chile (Centro ganadero sur)
    let lat = -40.5739;
    let lon = -73.1336;
    
    if (predio?.config && typeof predio.config === 'object' && 'lat' in predio.config && 'lon' in predio.config) {
      lat = Number(predio.config.lat);
      lon = Number(predio.config.lon);
    }

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FSantiago`, {
      next: { revalidate: 3600 } // Cache estricto en Next.js por 1 hora
    });
    
    if (!response.ok) throw new Error("Error fetching weather from OpenMeteo");
    const data = await response.json();
    
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
