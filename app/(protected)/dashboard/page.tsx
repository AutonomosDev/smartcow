import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import {
  getPredioKpisFiltered,
  getPrediosConAnimales,
  getCategoriasPorPredio,
  type PredioKpis,
  type PredioConAnimales,
  type CategoriaConAnimales,
} from "@/src/lib/queries/predio";
import { db } from "@/src/db/client";
import { estadoReproductivo } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import { SearchPill } from "@/src/components/dashboard/search-pill";
import { Sparkles, ChevronRight, Layers, Bell, Weight, Baby, Stethoscope } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    predioId?: string;
    categoriaId?: string;
    estado?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  const { nombre, predios: predioIds } = session.user;
  const params = await searchParams;

  // Cargar predios con conteo de animales (ordenados por total DESC)
  const prediosConAnimales = await getPrediosConAnimales(predioIds);

  // Default: predio con más animales
  const defaultPredioId = prediosConAnimales[0]?.id ?? predioIds[0] ?? 0;
  const predioId = params.predioId ? Number(params.predioId) : defaultPredioId;

  // Categorías disponibles para el predio seleccionado
  const categorias = await getCategoriasPorPredio(predioId);

  // Resolver categoriaId y estadoReproductivoId desde params
  const categoriaId = params.categoriaId ? Number(params.categoriaId) : undefined;
  let estadoReproductivoId: number | undefined;

  if (params.estado && params.estado !== "") {
    const erRow = await db
      .select({ id: estadoReproductivo.id })
      .from(estadoReproductivo)
      .where(eq(estadoReproductivo.nombre, params.estado))
      .limit(1);
    estadoReproductivoId = erRow[0]?.id;
  }

  const kpis = await getPredioKpisFiltered(predioId, categoriaId, estadoReproductivoId);
  const predioActual = prediosConAnimales.find((p) => p.id === predioId);

  return (
    <>
      <div className="hidden md:block">
        <DesktopView
          nombre={nombre}
          kpis={kpis}
          predioActual={predioActual ?? null}
          predios={prediosConAnimales}
          categorias={categorias}
          currentPredioId={predioId}
          currentCategoriaId={params.categoriaId ?? ""}
          currentEstado={params.estado ?? ""}
        />
      </div>
      <div className="block md:hidden">
        <MobileView
          nombre={nombre}
          kpis={kpis}
          nombrePredio={predioActual?.nombre ?? null}
        />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DESKTOP VIEW
// ─────────────────────────────────────────────

interface DesktopViewProps {
  nombre: string | null | undefined;
  kpis: PredioKpis;
  predioActual: PredioConAnimales | null;
  predios: PredioConAnimales[];
  categorias: CategoriaConAnimales[];
  currentPredioId: number;
  currentCategoriaId: string;
  currentEstado: string;
}

function DesktopView({
  nombre,
  kpis,
  predioActual,
  predios,
  categorias,
  currentPredioId,
  currentCategoriaId,
  currentEstado,
}: DesktopViewProps) {
  return (
    <div className="min-h-screen bg-farm-base relative overflow-x-hidden font-sans pb-20 md:pb-0">

      {/* TOP NAV */}
      <nav className="absolute top-0 w-full z-50 px-6 py-5 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center">
            <Layers size={18} className="text-brand-dark" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight hidden md:block">SmartCow</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-white/90 text-sm font-medium">
            <Link href="#" className="hover:text-white transition-colors">Potreros Activos</Link>
            <Link href="#" className="hover:text-white transition-colors">Sanidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Reportes</Link>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 transition">
            <span className="text-white text-sm font-bold uppercase">{nombre?.[0] ?? "U"}</span>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative w-full h-[55vh] min-h-[400px]">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2074&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <span className="text-brand-light font-bold text-sm tracking-widest uppercase mb-4 drop-shadow-md">Panel de Control</span>
          <h1 className="text-white text-5xl md:text-[64px] font-bold max-w-4xl leading-[1.1] tracking-tight drop-shadow-lg">
            Visualiza y Controla <br /><span className="text-white/90">Todo Tu Predio</span>
          </h1>
          <p className="text-white/80 text-lg mt-6 max-w-xl font-medium drop-shadow-md">
            Animales, pesajes, partos y ecografías de tu predio en tiempo real.
          </p>
        </div>
      </div>

      {/* SEARCH PILL — client component */}
      <SearchPill
        predios={predios}
        categorias={categorias}
        currentPredioId={currentPredioId}
        currentCategoriaId={currentCategoriaId}
        currentEstado={currentEstado}
      />

      {/* KPIs */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-ink-title text-2xl md:text-3xl font-bold tracking-tight">Resumen Operacional</h2>
            <p className="text-ink-body mt-2 text-sm">
              {predioActual?.nombre ?? "Predio"} · datos actualizados
            </p>
          </div>
          <Link href="/chat" className="text-brand-dark font-semibold text-sm flex items-center gap-1 hover:opacity-70 transition">
            Consultar IA <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-farm-surface rounded-card p-6 shadow-card">
            <div className="w-10 h-10 rounded-inner bg-brand-light/20 flex items-center justify-center mb-4">
              <Layers size={20} className="text-brand-dark" />
            </div>
            <p className="text-ink-meta text-xs font-bold uppercase tracking-wider mb-1">Animales activos</p>
            <p className="text-ink-title text-4xl font-bold tracking-tight">{kpis.totalAnimales.toLocaleString("es-CL")}</p>
          </div>

          <div className="bg-farm-surface rounded-card p-6 shadow-card">
            <div className="w-10 h-10 rounded-inner bg-brand-light/20 flex items-center justify-center mb-4">
              <Weight size={20} className="text-brand-dark" />
            </div>
            <p className="text-ink-meta text-xs font-bold uppercase tracking-wider mb-1">Pesajes registrados</p>
            <p className="text-ink-title text-4xl font-bold tracking-tight">{kpis.totalPesajes.toLocaleString("es-CL")}</p>
            {kpis.ultimoPesaje && (
              <p className="text-ink-meta text-xs mt-2">
                Último: {new Date(kpis.ultimoPesaje.fecha).toLocaleDateString("es-CL")} · {kpis.ultimoPesaje.pesoKg} kg
              </p>
            )}
          </div>

          <div className="bg-farm-surface rounded-card p-6 shadow-card">
            <div className="w-10 h-10 rounded-inner bg-brand-light/20 flex items-center justify-center mb-4">
              <Baby size={20} className="text-brand-dark" />
            </div>
            <p className="text-ink-meta text-xs font-bold uppercase tracking-wider mb-1">Partos</p>
            <p className="text-ink-title text-4xl font-bold tracking-tight">{kpis.totalPartos.toLocaleString("es-CL")}</p>
          </div>

          <div className="bg-farm-surface rounded-card p-6 shadow-card">
            <div className="w-10 h-10 rounded-inner bg-brand-light/20 flex items-center justify-center mb-4">
              <Stethoscope size={20} className="text-brand-dark" />
            </div>
            <p className="text-ink-meta text-xs font-bold uppercase tracking-wider mb-1">Ecografías</p>
            <p className="text-ink-title text-4xl font-bold tracking-tight">{kpis.totalEcografias.toLocaleString("es-CL")}</p>
          </div>
        </div>

        {/* AI Banner */}
        <div className="mt-16 bg-brand-dark rounded-card p-10 md:p-14 flex flex-col md:flex-row items-center justify-between shadow-float relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="max-w-xl mb-6 md:mb-0 relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-light/20 text-brand-light px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-brand-light/20">
              <Sparkles size={12} /> Insight Automático
            </div>
            <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">SmartCow Assistant</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Consulta tendencias, pesajes y estado reproductivo de {predioActual?.nombre ?? "tu predio"} con IA.
            </p>
          </div>
          <Link
            href="/chat"
            className="w-full md:w-auto bg-brand-light text-brand-dark px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-white transition-colors shrink-0 shadow-[0_0_20px_rgba(154,223,89,0.3)] relative z-10"
          >
            <Sparkles size={18} />
            Analizar Rendimiento
          </Link>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE VIEW
// ─────────────────────────────────────────────

function MobileView({
  nombre,
  kpis,
  nombrePredio,
}: {
  nombre: string | null | undefined;
  kpis: PredioKpis;
  nombrePredio: string | null;
}) {
  return (
    <div className="min-h-[100dvh] relative font-sans flex flex-col overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1594771804886-a933bb2d609b?q=80&w=800&auto=format&fit=crop"
          alt="Fundo Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06200F]/80 via-[#06200F]/30 to-[#06200F]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 pt-12 pb-24 px-6 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 drop-shadow-md">
          <div>
            <p className="text-[#9ADF59] text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Tu Predio Activo</p>
            <h2 className="text-white text-3xl font-bold tracking-tight">Hola, {nombre ?? "Operario"}</h2>
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg">
            <span className="text-white text-sm font-bold uppercase">{nombre?.[0] ?? "U"}</span>
          </div>
        </header>

        <div className="flex-1 min-h-[40px]" />

        {/* AI Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden mb-6 flex-shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#9ADF59] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="inline-flex items-center gap-2 bg-[#9ADF59]/20 text-[#9ADF59] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#9ADF59]/30 relative z-10 shadow-inner">
            <Sparkles size={12} /> SmartCow Insights
          </div>
          <h3 className="text-white text-2xl font-bold mb-3 relative z-10 leading-tight">
            {nombrePredio ?? "Tu predio"} — datos al día.
          </h3>
          <p className="text-white/70 text-sm mb-6 relative z-10 font-medium leading-relaxed">
            {kpis.totalAnimales.toLocaleString("es-CL")} animales activos registrados.
          </p>
          <Link
            href="/chat"
            className="w-full bg-[#9ADF59] text-[#06200F] px-6 py-4 rounded-full font-bold flex items-center justify-between hover:bg-white transition-colors relative z-10 shadow-[0_0_20px_rgba(154,223,89,0.4)]"
          >
            <span>Hablar con IA Asistente</span>
            <div className="w-8 h-8 rounded-full bg-[#06200F]/10 flex items-center justify-center">
              <ChevronRight size={18} />
            </div>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mt-2">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-white/90 font-bold text-lg">Acciones Rápidas</h3>
            <Link href="/tasks" className="text-[#9ADF59] text-xs font-bold uppercase tracking-wider">Ver todas</Link>
          </div>
          <div className="space-y-3">
            <Link
              href="/tasks"
              className="bg-[#06200F]/60 backdrop-blur-xl rounded-[24px] border border-white/10 p-5 shadow-lg flex items-center gap-4 active:scale-[0.98] transition-transform group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-[#06200F] transition-colors">
                <Weight size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-base">Pesaje Pendiente</h4>
                <p className="text-white/50 text-xs mt-0.5">Vence a las 18:00 hrs</p>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </Link>

            <Link
              href="/chat"
              className="bg-[#06200F]/60 backdrop-blur-xl rounded-[24px] border border-white/10 p-5 shadow-lg flex items-center gap-4 active:scale-[0.98] transition-transform group"
            >
              <div className="w-12 h-12 rounded-full bg-[#9ADF59]/20 border border-[#9ADF59]/30 flex items-center justify-center text-[#9ADF59] group-hover:bg-[#9ADF59] group-hover:text-[#06200F] transition-colors">
                <Layers size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-base">Animales activos</h4>
                <p className="text-white/50 text-xs mt-0.5">
                  {kpis.totalAnimales.toLocaleString("es-CL")} en {nombrePredio ?? "el predio"}
                </p>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </Link>
          </div>
        </div>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#06200F]/80 px-6 py-4 rounded-[32px] w-[90%] flex justify-between items-center z-50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl border border-white/10">
        <Link href="/dashboard" className="text-[#9ADF59] flex flex-col items-center gap-1">
          <Layers size={24} strokeWidth={2.5} />
        </Link>
        <Link href="/tasks" className="text-white/40 hover:text-white transition-colors flex flex-col items-center gap-1">
          <Weight size={24} strokeWidth={2.5} />
        </Link>
        <Link href="/chat" className="relative group">
          <div className="absolute inset-0 bg-[#9ADF59] rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="w-[60px] h-[60px] bg-[#9ADF59] rounded-full flex justify-center items-center -mt-10 relative z-10 border-[6px] border-[#06200F] shadow-xl hover:scale-105 transition-transform">
            <Sparkles size={24} className="text-[#06200F]" strokeWidth={2.5} />
          </div>
        </Link>
        <Link href="#" className="text-white/40 hover:text-white transition-colors flex flex-col items-center gap-1">
          <Bell size={24} strokeWidth={2.5} />
        </Link>
      </nav>
    </div>
  );
}
