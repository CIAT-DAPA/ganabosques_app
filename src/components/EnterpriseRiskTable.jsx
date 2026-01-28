"use client";

import React, { useState } from "react";

// CSS Classes matching DashboardMap style
const TABLE_CSS = {
  tableContainer: "bg-white rounded-xl shadow-lg overflow-hidden",
  table: "min-w-full divide-y divide-gray-200",
  tableHeader: "bg-gray-50 border-b border-gray-200",
  th: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider",
  td: "px-4 py-3 whitespace-nowrap text-sm text-gray-700",
  tdHighlight: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
  tr: "hover:bg-gray-50 transition-colors",
  trAlt: "hover:bg-gray-50 transition-colors bg-gray-25",
  emptyState: "flex flex-col items-center justify-center py-12 text-gray-500",
  codeCell: "max-w-[200px] overflow-hidden transition-all duration-300 ease-in-out cursor-pointer",
  codeCellExpanded: "max-w-none",
  codeContainer: "flex flex-wrap gap-1",
  codeChip: "inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs",
  expandBtn: "text-blue-600 hover:text-blue-800 text-xs mt-1 cursor-pointer font-medium",
};

// Risk colors matching EnterpriseChart
const COLOR_RISK = "#D50000";   // rojo riesgo
const COLOR_OK = "#00C853";     // verde sin riesgo

function RiskChip({ hasRisk }) {
  const color = hasRisk ? COLOR_RISK : COLOR_OK;
  const label = hasRisk ? "Con alerta" : "Sin alerta";
  return (
    <span
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

// ================================
// 🔵 Traducción de tipos de empresa con alias (Standardized)
// ================================
const TYPE_ALIASES = {
  COLLECTIONCENTER: "COLLECTION_CENTER",
  "CENTRO_ACOPIO": "COLLECTION_CENTER",
  "CENTRO DE ACOPIO": "COLLECTION_CENTER",
  ACOPIO: "COLLECTION_CENTER",
  PLANTA: "SLAUGHTERHOUSE",
  FERIA: "CATTLE_FAIR",
  EMPRESA: "ENTERPRISE",
  FINCA: "FARM",
  
  // From IDs
  "SLAUGHTERHOUSE_ID": "SLAUGHTERHOUSE",
  "PRODUCTIONUNIT_ID": "FARM", 
};

const ENTERPRISE_TYPES = {
  FARM: "Finca",
  COLLECTION_CENTER: "Centro de acopio",
  SLAUGHTERHOUSE: "Planta de beneficio",
  CATTLE_FAIR: "Feria ganadera",
  ENTERPRISE: "Empresa",
};

function translateEnterpriseType(type) {
  if (!type) return "—";
  const raw = type.toString().trim().toUpperCase();
  const normalized = TYPE_ALIASES[raw] || raw;
  return ENTERPRISE_TYPES[normalized] || type;
}

function getEnterpriseTypeFromRecord(enterprise) {
  // Try to find explicit type first
  if (enterprise.type_enterprise || enterprise.type) {
    return translateEnterpriseType(enterprise.type_enterprise || enterprise.type);
  }
  
  // Fallback to inference from ext_id labels if type is missing
  if (Array.isArray(enterprise.ext_id) && enterprise.ext_id.length > 0) {
    for (const idObj of enterprise.ext_id) {
      if (idObj.label && TYPE_ALIASES[idObj.label]) {
        return translateEnterpriseType(TYPE_ALIASES[idObj.label]);
      }
    }
    // Specific check for the old logic mapping
    const labels = enterprise.ext_id.map(e => e?.label).filter(Boolean);
    if (labels.includes("SLAUGHTERHOUSE_ID")) return ENTERPRISE_TYPES.SLAUGHTERHOUSE;
  }
  
  return "—";
}

function getEnterpriseExtCode(enterprise) {
  if (Array.isArray(enterprise.ext_id) && enterprise.ext_id.length > 0) {
    return enterprise.ext_id[0]?.ext_code || "N/A";
  }
  return "N/A";
}

function ExpandableCodeCell({ codes = [], rowKey }) {
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

export default function EnterpriseRiskTable({ data = {} }) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className={TABLE_CSS.tableContainer}>
        <div className={TABLE_CSS.emptyState}>
          <p className="text-gray-500">No hay datos de empresas para mostrar.</p>
        </div>
      </div>
    );
  }

  // Flatten: one row per enterprise + item combination
  const rows = [];
  for (const [/* enterpriseId */, record] of entries) {
    const enterprise = record?.enterprise || {};
    const items = Array.isArray(record?.items) ? record.items : [];

    for (const item of items) {
      const entrada = item.sit_codes?.input || [];
      const salida = item.sit_codes?.output || [];
      
      rows.push({
        departamento: enterprise.department || "—",
        municipio: enterprise.municipality || "—",
        tipo_empresa: getEnterpriseTypeFromRecord(enterprise),
        id_empresa: getEnterpriseExtCode(enterprise),
        nombre_empresa: enterprise.name || "—",
        periodo: formatPeriod(item.period_start, item.period_end),
        alerta: entrada.length > 0 || salida.length > 0,
        alerta_entrada: entrada,
        alerta_salida: salida,
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
              <th className={TABLE_CSS.th}>Tipo Empresa</th>
              <th className={TABLE_CSS.th}>ID Empresa</th>
              <th className={TABLE_CSS.th}>Nombre Empresa</th>
              <th className={TABLE_CSS.th}>Periodo</th>
              <th className={TABLE_CSS.th}>Alerta</th>
              <th className={TABLE_CSS.th} style={{ minWidth: "200px" }}>Alerta Entrada (SIT Codes)</th>
              <th className={TABLE_CSS.th} style={{ minWidth: "200px" }}>Alerta Salida (SIT Codes)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={`${row.id_empresa}-${idx}`} className={idx % 2 === 0 ? TABLE_CSS.tr : TABLE_CSS.trAlt}>
                <td className={TABLE_CSS.td}>{row.departamento}</td>
                <td className={TABLE_CSS.td}>{row.municipio}</td>
                <td className={TABLE_CSS.td}>{row.tipo_empresa}</td>
                <td className={TABLE_CSS.tdHighlight}>{row.id_empresa}</td>
                <td className={TABLE_CSS.tdHighlight}>{row.nombre_empresa}</td>
                <td className={TABLE_CSS.td}>{row.periodo}</td>
                <td className={TABLE_CSS.td}>
                  <RiskChip hasRisk={row.alerta} />
                </td>
                <td className={TABLE_CSS.td}>
                  <ExpandableCodeCell
                    codes={row.alerta_entrada}
                    rowKey={`in-${row.id_empresa}-${idx}`}
                  />
                </td>
                <td className={TABLE_CSS.td}>
                  <ExpandableCodeCell
                    codes={row.alerta_salida}
                    rowKey={`out-${row.id_empresa}-${idx}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
