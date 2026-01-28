"use client";

import React from "react";

// CSS Classes matching DashboardMap style
const TABLE_CSS = {
  tableContainer: "bg-white rounded-xl shadow-lg overflow-hidden",
  table: "min-w-full divide-y divide-gray-200",
  tableHeader: "bg-gray-50 border-b border-gray-200",
  th: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap",
  td: "px-4 py-3 whitespace-nowrap text-sm text-gray-700",
  tdHighlight: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
  tr: "hover:bg-gray-50 transition-colors",
  trAlt: "hover:bg-gray-50 transition-colors bg-gray-25",
  emptyState: "flex flex-col items-center justify-center py-12 text-gray-500",
};

// Risk colors
const COLOR_RISK = "#D50000";   // rojo riesgo
const COLOR_OK = "#00C853";     // verde sin riesgo

function RiskChip({ hasRisk, title }) {
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

function formatPeriod(start, end) {
  const ys = start ? new Date(start).getFullYear() : "";
  const ye = end ? new Date(end).getFullYear() : "";
  return ys && ye ? `${ys} - ${ye}` : ys || ye || "—";
}

// Format number with decimals
const fmtNum = (v, decimals = 2) => {
  if (v == null || Number.isNaN(Number(v))) return "0";
  const n = Number(v);
  return n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(decimals);
};

// ============================================
// 🔵 Cell Component for SIT Codes (Expandable)
// ============================================
function ExpandableCodeCell({ codes = [], rowKey }) {
  const [expanded, setExpanded] = React.useState(false);

  if (!codes || codes.length === 0) {
    return <span className="text-gray-400">Sin códigos</span>;
  }

  const displayCodes = expanded ? codes : codes.slice(0, 5);
  const hasMore = codes.length > 5;

  return (
    <div
      style={{
        maxWidth: expanded ? "none" : "200px",
        overflow: "hidden",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div className="flex flex-wrap gap-1">
        {displayCodes.map((code, i) => (
          <span
            key={`${rowKey}-${i}`}
            className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
          >
            {code}
          </span>
        ))}
      </div>
      {hasMore && (
        <div
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-xs mt-1 cursor-pointer font-medium"
        >
          {expanded ? "Ver menos ▲" : `+${codes.length - 5} más ▼`}
        </div>
      )}
    </div>
  );
}

export default function Adm3RiskTable({ data = {} }) {
  // data comes as an array (adm3RiskHistory) in original code, but here we might receive the object structure directly or array.
  // The user showed a JSON object: { "id": { ... } } or just the inner object? 
  // "recuerda: { "684...": { ... } }" -> It's an object/dictionary.
  
  // Convert to array of entries if it's an object
  const entries = Array.isArray(data) ? data : Object.values(data);

  if (entries.length === 0) {
    return (
      <div className={TABLE_CSS.tableContainer}>
        <div className={TABLE_CSS.emptyState}>
          <p className="text-gray-500">No hay datos de veredas para mostrar.</p>
        </div>
      </div>
    );
  }

  // Flatten: one row per adm3 + item (period) combination
  const rows = [];
  
  for (const record of entries) {
    // Check if record has items, if not, maybe skip or show one row?
    const items = Array.isArray(record?.items) ? record.items : [];
    
    if (items.length === 0) {
      // Show at least the Adm3 info? Or skip? Usually skip if no history.
      // But let's verify if user wants to see it. Assuming items exist based on JSON.
      continue; 
    }

    // Sort items by period desc (optional, but good for reports)
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.period_start) - new Date(a.period_start)
    );

    for (const item of sortedItems) {
      const direct = item.sit_codes?.direct || [];
      const input = item.sit_codes?.input || [];
      const output = item.sit_codes?.output || [];

      rows.push({
        departamento: record.department || "—",
        municipio: record.municipality || "—",
        vereda: record.name || "—",
        adm3_id: record.adm3_id || "—",
        periodo: formatPeriod(item.period_start, item.period_end),
        alerta: item.risk_total,
        predios: item.farm_amount || 0,
        deforestacion: item.def_ha || 0,
        sit_direct: direct,
        sit_input: input,
        sit_output: output,
      });
    }
  }

  if (rows.length === 0) {
    return (
      <div className={TABLE_CSS.tableContainer}>
        <div className={TABLE_CSS.emptyState}>
          <p className="text-gray-500">No hay items de análisis para mostrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={TABLE_CSS.tableContainer}>
      <div className="overflow-x-auto">
        <table className={TABLE_CSS.table}>
          <thead className={TABLE_CSS.tableHeader}>
            <tr>
              <th className={TABLE_CSS.th}>Departamento</th>
              <th className={TABLE_CSS.th}>Municipio</th>
              <th className={TABLE_CSS.th}>Vereda</th>
              <th className={TABLE_CSS.th}>Periodo</th>
              <th className={TABLE_CSS.th}>Alerta</th>
              <th className={TABLE_CSS.th} style={{ minWidth: "180px" }}>Alerta Directa (SIT)</th>
              <th className={TABLE_CSS.th} style={{ minWidth: "180px" }}>Alerta Entrada (SIT)</th>
              <th className={TABLE_CSS.th} style={{ minWidth: "180px" }}>Alerta Salida (SIT)</th>
              <th className={TABLE_CSS.th}>Predios</th>
              <th className={TABLE_CSS.th}>Deforestación (ha)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={`${row.adm3_id}-${idx}`} className={idx % 2 === 0 ? TABLE_CSS.tr : TABLE_CSS.trAlt}>
                <td className={TABLE_CSS.td}>{row.departamento}</td>
                <td className={TABLE_CSS.td}>{row.municipio}</td>
                <td className={TABLE_CSS.tdHighlight}>{row.vereda}</td>
                <td className={TABLE_CSS.td}>{row.periodo}</td>
                <td className={TABLE_CSS.td}>
                  <RiskChip hasRisk={row.alerta} title="Alerta" />
                </td>
                <td className={TABLE_CSS.td}>
                  <ExpandableCodeCell codes={row.sit_direct} rowKey={`dir-${row.adm3_id}-${idx}`} />
                </td>
                <td className={TABLE_CSS.td}>
                  <ExpandableCodeCell codes={row.sit_input} rowKey={`in-${row.adm3_id}-${idx}`} />
                </td>
                <td className={TABLE_CSS.td}>
                  <ExpandableCodeCell codes={row.sit_output} rowKey={`out-${row.adm3_id}-${idx}`} />
                </td>
                <td className={TABLE_CSS.td}>{row.predios}</td>
                <td className={TABLE_CSS.td}>{fmtNum(row.deforestacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
