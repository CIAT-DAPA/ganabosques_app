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

// Risk colors matching EnterpriseChart
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
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  return n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(decimals);
};

// Format proportion as percentage
const fmtProp = (v) => {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${(Number(v) * 100).toFixed(0)}%`;
};

function getCodes(extIds) {
  if (!Array.isArray(extIds)) return "—";
  return extIds.map((e) => e?.ext_code || "").filter(Boolean).join(", ") || "—";
}

export default function FarmRiskTable({ data = {} }) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className={TABLE_CSS.tableContainer}>
        <div className={TABLE_CSS.emptyState}>
          <p className="text-gray-500">No hay datos de fincas para mostrar.</p>
        </div>
      </div>
    );
  }

  // Flatten: one row per farm + item combination
  const rows = [];
  for (const [/* farmId */, record] of entries) {
    const farm = record?.farm || {};
    const items = Array.isArray(record?.items) ? record.items : [];

    for (const item of items) {
      rows.push({
        departamento: farm.department || "—",
        municipio: farm.municipality || "—",
        vereda: farm.vereda || "—",
        farm_id: record.farm_id || "—",
        codes: getCodes(farm.ext_id),
        periodo: formatPeriod(item.period_start, item.period_end),
        alerta_directa: item.risk_direct,
        alerta_entrada: item.risk_input,
        alerta_salida: item.risk_output,
        deforestacion_ha: item.deforestation?.ha,
        deforestacion_prop: item.deforestation?.prop,
        area_protegida_ha: item.protected?.ha,
        area_protegida_prop: item.protected?.prop,
        frontera_dentro_ha: item.farming_in?.ha,
        frontera_dentro_prop: item.farming_in?.prop,
        frontera_fuera_ha: item.farming_out?.ha,
        frontera_fuera_prop: item.farming_out?.prop,
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
              <th className={TABLE_CSS.th}>Farm ID</th>
              <th className={TABLE_CSS.th}>Código SIT</th>
              <th className={TABLE_CSS.th}>Periodo</th>
              <th className={TABLE_CSS.th}>Alerta Directa</th>
              <th className={TABLE_CSS.th}>Alerta Entrada</th>
              <th className={TABLE_CSS.th}>Alerta Salida</th>
              <th className={TABLE_CSS.th}>Def. (ha)</th>
              <th className={TABLE_CSS.th}>Def. (%)</th>
              <th className={TABLE_CSS.th}>Prot. (ha)</th>
              <th className={TABLE_CSS.th}>Prot. (%)</th>
              <th className={TABLE_CSS.th}>F. In (ha)</th>
              <th className={TABLE_CSS.th}>F. In (%)</th>
              <th className={TABLE_CSS.th}>F. Out (ha)</th>
              <th className={TABLE_CSS.th}>F. Out (%)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={`${row.farm_id}-${idx}`} className={idx % 2 === 0 ? TABLE_CSS.tr : TABLE_CSS.trAlt}>
                <td className={TABLE_CSS.td}>{row.departamento}</td>
                <td className={TABLE_CSS.td}>{row.municipio}</td>
                <td className={TABLE_CSS.td}>{row.vereda}</td>
                <td className={TABLE_CSS.tdHighlight}>{row.farm_id}</td>
                <td className={TABLE_CSS.td}>{row.codes}</td>
                <td className={TABLE_CSS.td}>{row.periodo}</td>
                <td className={TABLE_CSS.td}>
                  <RiskChip hasRisk={row.alerta_directa} title="Alerta Directa" />
                </td>
                <td className={TABLE_CSS.td}>
                  <RiskChip hasRisk={row.alerta_entrada} title="Alerta Entrada" />
                </td>
                <td className={TABLE_CSS.td}>
                  <RiskChip hasRisk={row.alerta_salida} title="Alerta Salida" />
                </td>
                <td className={TABLE_CSS.td}>{fmtNum(row.deforestacion_ha)}</td>
                <td className={TABLE_CSS.td}>{fmtProp(row.deforestacion_prop)}</td>
                <td className={TABLE_CSS.td}>{fmtNum(row.area_protegida_ha)}</td>
                <td className={TABLE_CSS.td}>{fmtProp(row.area_protegida_prop)}</td>
                <td className={TABLE_CSS.td}>{fmtNum(row.frontera_dentro_ha)}</td>
                <td className={TABLE_CSS.td}>{fmtProp(row.frontera_dentro_prop)}</td>
                <td className={TABLE_CSS.td}>{fmtNum(row.frontera_fuera_ha)}</td>
                <td className={TABLE_CSS.td}>{fmtProp(row.frontera_fuera_prop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
