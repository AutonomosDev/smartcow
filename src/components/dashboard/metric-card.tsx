"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon: Icon, subtitle, trend }: MetricCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex flex-col group transition-all duration-300 hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-brand-light/10 flex items-center justify-center transition-colors group-hover:bg-brand-light/20">
          <Icon className="text-brand-dark w-6 h-6" />
        </div>
        
        {trend && (
          <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <p className="text-ink-meta text-[10px] font-bold uppercase tracking-widest mb-1">
        {title}
      </p>
      
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-ink-title tracking-tight">
          {value}
        </h3>
      </div>
      
      {subtitle && (
        <p className="text-ink-meta text-[11px] mt-2 line-clamp-1 opacity-70">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
