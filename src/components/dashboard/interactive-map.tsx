/**
 * src/components/dashboard/interactive-map.tsx
 * Visualización geoespacial premium de SmartCow.
 * Utiliza SVG estilizado y Framer Motion para simular un radar de animales.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Info, AlertTriangle } from "lucide-react";

interface AnimalMarker {
  id: string;
  x: number;
  y: number;
  status: "healthy" | "alert" | "monitoring";
  type: string;
}

const MOCK_ANIMALS: AnimalMarker[] = [
  { id: "1", x: 120, y: 80, status: "healthy", type: "Vaca Angus" },
  { id: "2", x: 250, y: 150, status: "healthy", type: "Vaca Angus" },
  { id: "3", x: 400, y: 100, status: "alert", type: "Ternero" },
  { id: "4", x: 320, y: 220, status: "monitoring", type: "Toro Hereford" },
  { id: "5", x: 180, y: 280, status: "healthy", type: "Vaca Angus" },
  { id: "6", x: 550, y: 180, status: "healthy", type: "Vaca Angus" },
];

export function InteractiveMap() {
  return (
    <div className="relative w-full h-full bg-[#06200F]/5 rounded-[2rem] overflow-hidden border border-gray-100 group">
      {/* 1. Mapa Base Estilizado (SVG) */}
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full object-cover opacity-80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Potrero 1 */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d="M50 50 L300 30 L350 150 L80 180 Z"
          fill="rgba(154, 223, 89, 0.05)"
          stroke="rgba(154, 223, 89, 0.2)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {/* Potrero 2 */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut", delay: 0.2 }}
          d="M320 20 L600 50 L650 200 L380 180 Z"
          fill="rgba(154, 223, 89, 0.03)"
          stroke="rgba(154, 223, 89, 0.1)"
          strokeWidth="1.5"
        />
        {/* Potrero 3 (Guachera) */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
          d="M100 200 L450 190 L500 350 L150 380 Z"
          fill="rgba(154, 223, 89, 0.08)"
          stroke="rgba(154, 223, 89, 0.3)"
          strokeWidth="1.5"
        />
        
        {/* Caminos */}
        <path d="M310 25 L365 185 M100 190 L120 380" stroke="rgba(0,0,0,0.05)" strokeWidth="4" />
      </svg>

      {/* 2. Overlays de Información */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-light animate-pulse" />
            <span className="text-xs font-bold text-ink-title uppercase tracking-wider">Monitoreo en Vivo</span>
          </div>
          <p className="text-[10px] text-ink-meta mt-1 font-medium italic">Fundo El Roble · Sector Norte</p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-dark transition-colors">
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Marcadores de Animales (Interactivos) */}
      <div className="absolute inset-0 pointer-events-none">
        {MOCK_ANIMALS.map((animal) => (
          <div
            key={animal.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{ 
              left: `${(animal.x / 800) * 100}%`, 
              top: `${(animal.y / 400) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Pulse Effect */}
            <motion.div
              className={`absolute inset-0 rounded-full ${
                animal.status === "alert" ? "bg-red-400" : 
                animal.status === "monitoring" ? "bg-blue-400" : "bg-brand-light"
              }`}
              animate={{
                scale: [1, 2.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            {/* Marker Point */}
            <motion.div
              className={`relative w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125 ${
                animal.status === "alert" ? "bg-red-500" : 
                animal.status === "monitoring" ? "bg-blue-500" : "bg-brand-dark"
              }`}
              whileHover={{ scale: 1.5 }}
            >
               {/* Mini Tooltip on Hover */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white text-[9px] px-2 py-1 rounded shadow-xl pointer-events-none">
                 {animal.type} #{animal.id}
               </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* 4. Bottom Legend */}
      <div className="absolute bottom-6 left-6 z-10 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-dark border-2 border-white" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Saludable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Alerta</span>
        </div>
      </div>
    </div>
  );
}

// Re-using Lucide icons and framer-motion defined above
import { Layers } from "lucide-react";
