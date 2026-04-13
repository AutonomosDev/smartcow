"use client";

import { motion } from "framer-motion";
import { Target, Sparkles, ChevronRight, Layers, Bell, Weight, Baby, Stethoscope } from "lucide-react";
import Link from "next/link";
import type { PredioKpis, RecentEvent } from "@/src/lib/queries/predio";
import { TopNav } from "@/src/components/dashboard/top-nav";
import { MetricCard } from "@/src/components/dashboard/metric-card";
import { InsightBanner } from "@/src/components/dashboard/insight-banner";
import { InteractiveMap } from "@/src/components/dashboard/interactive-map";

interface ViewProps {
  nombre: string | null | undefined;
  kpis: PredioKpis;
  nombrePredio: string | null;
  recentActivity: RecentEvent[];
}

export function DesktopView({ nombre, kpis, nombrePredio, recentActivity }: ViewProps) {
  return (
    <div className="min-h-screen bg-[#FAFBFA] relative overflow-x-hidden font-sans pb-20 md:pb-0">

      {/* 1. TOP NAVIGATION (Atomic) */}
      <TopNav userName={nombre} predioName={nombrePredio} />

      {/* 2. PREMIUM HERO SECTION */}
      <div className="relative w-full h-[45vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/1.jpg" 
              alt="Campo SmartCow" 
              className="w-full h-full object-cover object-center"
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#FAFBFA]" />
          </div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
              <span className="text-brand-light font-bold text-[10px] tracking-[0.3em] uppercase mb-6 bg-brand-light/10 px-4 py-1.5 rounded-full border border-brand-light/20 backdrop-blur-md">
                Sistema de Gestión Inteligente
              </span>
              <h1 className="text-white text-5xl md:text-7xl font-bold max-w-5xl leading-[1.05] tracking-tight mb-8 drop-shadow-2xl">
                  Controla tu Predio con <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-white/90">Precisión Absoluta</span>
              </h1>
              <p className="text-white/80 text-xl max-w-2xl font-medium leading-relaxed drop-shadow-md">
                  Monitorea animales, pesajes y salud preventiva desde una interfaz unificada y potente.
              </p>
          </motion.div>
      </div>

      {/* 3. FLOATING SEARCH PILL */}
      <div className="w-full max-w-5xl mx-auto -mt-10 relative z-30 px-6" />

      {/* 4. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex justify-between items-end mb-12">
              <div>
                  <h2 className="text-ink-title text-3xl font-bold tracking-tight">Estado Operacional</h2>
                  <p className="text-ink-meta mt-2 text-sm font-medium">Inicio · {nombrePredio ?? "Predio Principal"}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-ink-body text-xs font-bold uppercase tracking-widest hover:bg-white hover:shadow-sm transition-all">
                  Ir a Consola
                </button>
              </div>
          </div>

          {/* KPI GRID (Atomic MetricCards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Animales activos"
                value={kpis.totalAnimales.toLocaleString("es-CL")}
                icon={Layers}
                subtitle={`En ${nombrePredio ?? "el predio"}`}
                trend={{ value: 12, isPositive: true }}
              />
              <MetricCard
                title="Pesajes registrados"
                value={kpis.totalPesajes.toLocaleString("es-CL")}
                icon={Weight}
                subtitle={kpis.ultimoPesaje ? `Último: ${kpis.ultimoPesaje.pesoKg}kg` : "Sin datos recientes"}
                trend={{ value: 5, isPositive: true }}
              />
              <MetricCard
                title="Partos proyectados"
                value={kpis.totalPartos.toLocaleString("es-CL")}
                icon={Baby}
                subtitle="Próximos 30 días"
                trend={{ value: 2, isPositive: false }}
              />
              <MetricCard
                title="Sanidad (Ecografías)"
                value={kpis.totalEcografias.toLocaleString("es-CL")}
                icon={Stethoscope}
                subtitle="Controles preventivos"
              />
          </div>

          {/* 5. INSIGHT BANNER (Atomic) */}
          <InsightBanner />

          {/* Secondary Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[450px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <InteractiveMap />
            </div>
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-50 flex flex-col">
              <h3 className="text-ink-title text-sm font-bold mb-4">Actividad Reciente</h3>
              {recentActivity.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-ink-meta text-xs font-medium">Sin actividad registrada</p>
                </div>
              ) : (
                <ul className="space-y-3 overflow-y-auto">
                  {recentActivity.map((event, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${event.type === "pesaje" ? "bg-brand-light" : "bg-blue-400"}`} />
                      <div className="min-w-0">
                        <p className="text-ink-body text-sm font-medium truncate">{event.descripcion}</p>
                        <p className="text-ink-meta text-[11px] mt-0.5">{event.fecha}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      </main>

    </div>
  );
}

export function MobileView({ nombre, kpis, nombrePredio, recentActivity: _recentActivity }: ViewProps) {
  return (
    <div className="min-h-[100dvh] relative font-sans flex flex-col overflow-hidden">

      {/* 1. Fondo Inmersivo Full-Screen (Hero Image background) */}
      <div className="absolute inset-0 w-full h-full z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/1.jpg"
            alt="Fundo Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06200F]/60 via-[#06200F]/30 to-[#FAFBFA]"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 pt-12 pb-24 px-6 overflow-y-auto">
          {/* 1. Header Móvil Simplificado */}
          <header className="flex justify-between items-center mb-8 drop-shadow-md">
              <div>
                  <p className="text-[#9ADF59] text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Tu Predio Activo</p>
                  <h2 className="text-white text-3xl font-bold tracking-tight">Hola, {nombre ?? "Operario"}</h2>
              </div>
              <div className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg">
                  <span className="text-white text-sm font-bold uppercase">{nombre?.[0] ?? "U"}</span>
              </div>
          </header>

          <div className="flex-1 min-h-[40px]"></div>

          {/* 2. Glassmorphism Chat Inteligente */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden mb-6 flex-shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#9ADF59] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="inline-flex items-center gap-2 bg-[#9ADF59]/20 text-[#9ADF59] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#9ADF59]/30 relative z-10 shadow-inner">
                  <Sparkles size={12} /> SmartCow Insights
              </div>

              <h3 className="text-white text-2xl font-bold mb-3 relative z-10 leading-tight">Las vacas en la Guachera Alta requieren atención.</h3>
              <p className="text-white/70 text-sm mb-6 relative z-10 font-medium leading-relaxed">Las temperaturas bajaron anoche. Sugiero iniciar el pesaje preventivo.</p>

              <Link href="/chat" className="w-full bg-[#9ADF59] text-[#06200F] px-6 py-4 rounded-full font-bold flex items-center justify-between hover:bg-white transition-colors relative z-10 shadow-[0_0_20px_rgba(154,223,89,0.4)]">
                  <span>Hablar con IA Asistente</span>
                  <div className="w-8 h-8 rounded-full bg-[#06200F]/10 flex items-center justify-center">
                      <ChevronRight size={18} />
                  </div>
              </Link>
          </div>

          {/* 3. Tareas Rápidas & KPIs Operativos Móviles */}
          <div className="mt-2">
              <div className="flex justify-between items-end mb-4 px-1">
                  <h3 className="text-white/90 font-bold text-lg">Acciones Rápidas</h3>
                  <Link href="/tasks" className="text-[#9ADF59] text-xs font-bold uppercase tracking-wider">Ver todas</Link>
              </div>

              <div className="space-y-3">
                  <Link href="/tasks" className="bg-[#06200F]/60 backdrop-blur-xl rounded-[24px] border border-white/10 p-5 shadow-lg flex items-center gap-4 active:scale-[0.98] transition-transform group">
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-[#06200F] transition-colors">
                          <Target size={20} />
                      </div>
                      <div className="flex-1">
                          <h4 className="font-bold text-white text-base">Pesaje Pendiente</h4>
                          <p className="text-white/50 text-xs mt-0.5">Vence a las 18:00 hrs</p>
                      </div>
                      <ChevronRight size={20} className="text-white/30" />
                  </Link>

                  <Link href="/chat" className="bg-[#06200F]/60 backdrop-blur-xl rounded-[24px] border border-white/10 p-5 shadow-lg flex items-center gap-4 active:scale-[0.98] transition-transform group">
                      <div className="w-12 h-12 rounded-full bg-[#9ADF59]/20 border border-[#9ADF59]/30 flex items-center justify-center text-[#9ADF59] group-hover:bg-[#9ADF59] group-hover:text-[#06200F] transition-colors">
                          <Layers size={20} />
                      </div>
                      <div className="flex-1">
                          <h4 className="font-bold text-white text-base">Animales activos</h4>
                          <p className="text-white/50 text-xs mt-0.5">{kpis?.totalAnimales.toLocaleString("es-CL") ?? 0} en {nombrePredio ?? "el predio"}</p>
                      </div>
                      <ChevronRight size={20} className="text-white/30" />
                  </Link>
              </div>
          </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#06200F]/80 px-6 py-4 rounded-[32px] w-[90%] flex justify-between items-center z-50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl border border-white/10">
          <Link href="/dashboard" className="text-[#9ADF59] flex flex-col items-center gap-1">
              <Layers size={24} strokeWidth={2.5} />
          </Link>
          <Link href="/tasks" className="text-white/40 hover:text-white transition-colors flex flex-col items-center gap-1">
              <Target size={24} strokeWidth={2.5} />
          </Link>
          <Link href="/chat" className="relative group">
              <div className="absolute inset-0 bg-[#9ADF59] rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
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
