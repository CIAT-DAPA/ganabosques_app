"use client";

import { useState } from "react";
import { TABLE_CSS } from "@/utils";

export default function ExpandableCodeCell({ codes = {}, rowKey, isPrinting = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!codes || Object.keys(codes).length === 0) {
    return <span className="text-gray-400">Sin códigos</span>;
  }

  const farmEntries = Object.entries(codes);

  const shouldExpand = expanded || isPrinting;

  const displayEntries = shouldExpand
    ? farmEntries
    : farmEntries.slice(0, 2);

  const hasMore = farmEntries.length > 2;

  return (
    <div
      className={`${TABLE_CSS.codeCell} ${
        shouldExpand || !hasMore ? TABLE_CSS.codeCellExpanded : ""
      }`}
      style={{ minWidth: shouldExpand ? "auto" : "200px" }}
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
                  <strong>{item.source}:</strong> <span>{item.ext_code}{ i < farmCodes.length - 1 && <br /> }</span>
                </div>
              ))}
            </div> { farmIndex < displayEntries.length - 1 && <br /> }
          </div>
        ))}
      </div>

      {hasMore && !isPrinting && (
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