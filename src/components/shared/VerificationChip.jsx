"use client";

import { useState } from "react";
import { COLOR_RISK, COLOR_OK } from "@/utils";

// Verification indicator chip with hover tooltip
export default function VerificationChip({ verification }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isVerified = verification?.status === true;
  const color = isVerified ? COLOR_OK : COLOR_RISK;
  const label = isVerified ? "Verificado" : "No verificado";

  // Format date for tooltip
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => isVerified && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-default"
        style={{ backgroundColor: color, color: "#fff", whiteSpace: "nowrap" }}
      >
        {label}
      </span>

      {showTooltip && isVerified && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 
                     bg-gray-900 text-white text-xs rounded-lg px-3 py-2 
                     shadow-lg whitespace-nowrap pointer-events-none"
        >
          <span className="block font-semibold mb-1">
            Fecha: {formatDate(verification.verification_date)}
          </span>
          {verification.observation && (
            <span className="block opacity-90">
              {verification.observation}
            </span>
          )}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 
                       border-4 border-transparent border-t-gray-900"
          />
        </span>
      )}
    </span>
  );
}
