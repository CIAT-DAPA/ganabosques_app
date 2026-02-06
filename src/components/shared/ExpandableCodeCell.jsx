"use client";

import { useState } from "react";
import { TABLE_CSS } from "@/utils";

// Expandable cell for code lists
export default function ExpandableCodeCell({ codes = [], rowKey }) {
  const [expanded, setExpanded] = useState(false);

  if (!codes || codes.length === 0) {
    return <span className="text-gray-400">Sin códigos</span>;
  }

  const displayCodes = expanded ? codes : codes.slice(0, 5);
  const hasMore = codes.length > 5;

  return (
    <div
      className={`${TABLE_CSS.codeCell} ${expanded ? TABLE_CSS.codeCellExpanded : ""}`}
      style={{ minWidth: expanded ? "auto" : "200px" }}
    >
      <div className={TABLE_CSS.codeContainer}>
        {displayCodes.map((code, i) => (
          <span key={`${rowKey}-${i}`} className={TABLE_CSS.codeChip}>
            {code}
          </span>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={TABLE_CSS.expandBtn}
        >
          {expanded ? "Ver menos ▲" : `+${codes.length - 5} más ▼`}
        </button>
      )}
    </div>
  );
}
