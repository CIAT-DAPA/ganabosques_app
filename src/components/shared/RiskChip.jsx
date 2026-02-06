"use client";

import { COLOR_RISK, COLOR_OK } from "@/utils";

// Risk indicator chip
export default function RiskChip({ hasRisk, title }) {
  const color = hasRisk ? COLOR_RISK : COLOR_OK;
  const label = hasRisk ? "Con alerta" : "Sin alerta";
  
  return (
    <span
      title={title}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color, color: "#fff", whiteSpace: "nowrap" }}
    >
      {label}
    </span>
  );
}
