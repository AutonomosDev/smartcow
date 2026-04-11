"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function InsightBanner() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="relative w-full rounded-[2rem] overflow-hidden bg-brand-dark p-10 md:p-14 shadow-3xl shadow-brand-dark/30 mt-12 mb-20"
    >
      {/* Radial Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(154,223,89,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold uppercase tracking-widest mb-6 border border-[#C8E6C9]">
            <Sparkles size={12} />
            SmartCow Advisor
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Análisis de <span className="text-brand-light italic">Producción</span> y<br /> Salud Preventiva en Tiempo Real.
          </h2>
          
          <p className="text-white/60 text-lg leading-relaxed max-w-xl font-medium">
            Nuestro sistema ha detectado una leve caída en la rumia en el Potrero 4. 
            Te sugerimos revisar los sensores de salud.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <Link 
            href="/chat"
            className="bg-brand-light text-brand-dark px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-light/20 group"
          >
            Ir a SmartCow AI
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <p className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] text-center">
            Última sync: hace 5 min
          </p>
        </div>
      </div>
      
      {/* Decorative Grid SVG */}
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </motion.div>
  );
}
