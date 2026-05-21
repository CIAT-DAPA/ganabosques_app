"use client";

import { useState } from "react";
import { TABLE_CSS } from "@/utils";

export default function ExpandableCodeCell({ codes = {}, rowKey }) {
  const [expanded, setExpanded] = useState(false);

  if (!codes || Object.keys(codes).length === 0) {
    return <span className="text-gray-400">Sin códigos</span>;
  }

  const farmEntries = Object.entries(codes);

  const displayEntries = expanded
    ? farmEntries
    : farmEntries.slice(0, 2);

  const hasMore = farmEntries.length > 2;

  return (
    <div
      className={`${TABLE_CSS.codeCell} ${
        expanded ? TABLE_CSS.codeCellExpanded : ""
      }`}
      style={{ minWidth: expanded ? "auto" : "200px" }}
    >
      <div className="space-y-1">
        {displayEntries.map(([farmId, farmCodes], farmIndex) => (
          <div
            key={`${rowKey}-${farmId}-${farmIndex}`}
            className="p-1 shadow-md"
          >
            <div className={TABLE_CSS.codeChip}>
              {farmCodes.map((item, i) => (
                <div
                  key={`${farmId}-${i}`}
                >
                  <strong>{item.source}:</strong> {item.ext_code}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={TABLE_CSS.expandBtn}
        >
          {expanded
            ? "Ver menos ▲"
            : `+${farmEntries.length - 2} más ▼`}
        </button>
      )}
    </div>
  );
}