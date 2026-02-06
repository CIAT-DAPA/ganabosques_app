"use client";

import { useState } from "react";
import { Info } from "lucide-react";

// Info tooltip component for column headers
export default function InfoTooltip({ text }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-help"
      >
        <Info className="w-3 h-3" />
      </button>
      {isVisible && (
        <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
          {text}
        </div>
      )}
    </div>
  );
}

// Column info definitions
export const COLUMN_INFO = {
  deforestation_ha: "Representa las áreas deforestadas del predio",
  deforestation_pct: "Representa el porcentaje de deforestación",
  frontier_in_ha: "Representa el área dentro de la frontera agrícola",
  frontier_in_pct: "Representa el porcentaje dentro de la frontera agrícola",
  frontier_out_ha: "Representa el área fuera de la frontera agrícola",
  frontier_out_pct: "Representa el porcentaje fuera de la frontera agrícola",
  protected_ha: "Representa el área dentro de áreas protegidas",
  protected_pct: "Representa el porcentaje dentro de áreas protegidas",
};
