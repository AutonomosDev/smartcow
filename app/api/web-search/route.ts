/**
 * POST /api/web-search
 * Busca en internet usando Tavily Search API.
 * Solo disponible para usuarios autenticados y cuando el toggle 🌐 está activo.
 * Ticket: AUT-260
 *
 * Body: { query: string, max_results?: number }
 * Response: { results: { title, url, snippet, score }[] }
 */

import { NextRequest } from "next/server";
import { withAuth, withAuthBearer, AuthError } from "@/src/lib/with-auth";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
}

export async function POST(req: NextRequest) {
  // Auth — Bearer (mobile) o cookie (web)
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      await withAuthBearer(req);
    } else {
      await withAuth();
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  let body: { query: string; max_results?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { query, max_results = 5 } = body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return Response.json({ error: "query requerida" }, { status: 400 });
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Servicio de búsqueda web no disponible" }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        search_depth: "basic",
        include_answer: false,
        max_results: Math.min(Math.max(1, max_results), 10),
        country: "chile",
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[web-search] Tavily error:", res.status, errText);
      return Response.json({ error: "Error en servicio de búsqueda" }, { status: 502 });
    }

    const data = (await res.json()) as TavilyResponse;

    return Response.json({
      results: data.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        score: r.score,
      })),
    });
  } catch (err) {
    console.error("[web-search] fetch error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Error conectando al servicio de búsqueda" }, { status: 502 });
  }
}
