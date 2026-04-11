"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type FontType = "inter" | "jakarta" | "manrope";

interface FontContextType {
  font: FontType;
  setFont: (font: FontType) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<FontType>("inter");

  // Persistir en localStorage opcionalmente
  useEffect(() => {
    const saved = localStorage.getItem("smartcow-font") as FontType;
    if (saved) setFontState(saved);
  }, []);

  const setFont = (newFont: FontType) => {
    setFontState(newFont);
    localStorage.setItem("smartcow-font", newFont);
  };

  const getFontClass = () => {
    switch (font) {
      case "jakarta":
        return "font-jakarta";
      case "manrope":
        return "font-manrope";
      default:
        return "font-inter";
    }
  };

  return (
    <FontContext.Provider value={{ font, setFont }}>
      <div className={getFontClass() + " min-h-screen"}>
        {children}
      </div>
    </FontContext.Provider>
  );
}

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
