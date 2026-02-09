"use client";

import RiskDataTable from "./RiskDataTable";
import { RiskChip, ExpandableCodeCell, fmtNum, formatPeriod } from "./shared";

// Transform ADM3 risk data to flat rows
function transformAdm3Data(data) {
  const entries = Array.isArray(data) ? data : Object.values(data || {});
  const rows = [];

  for (const record of entries) {
    const items = Array.isArray(record?.items) ? record.items : [];

    if (items.length === 0) continue;

    const sortedItems = [...items].sort(
      (a, b) => new Date(b.period_start) - new Date(a.period_start)
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

  return rows;
}

// Column config
const ADM3_COLUMNS = [
  { key: "departamento", label: "Departamento" },
  { key: "municipio", label: "Municipio" },
  { key: "vereda", label: "Vereda", highlight: true },
  { key: "periodo", label: "Periodo" },
  {
    key: "alerta",
    label: "Alerta",
    render: (value) => <RiskChip hasRisk={value} title="Alerta" />,
  },
  {
    key: "sit_direct",
    label: "Alerta Directa (SIT)",
    minWidth: "180px",
    render: (value, row, idx) => (
      <ExpandableCodeCell codes={value} rowKey={`dir-${row.adm3_id}-${idx}`} />
    ),
  },
  {
    key: "sit_input",
    label: "Alerta Entrada (SIT)",
    minWidth: "180px",
    render: (value, row, idx) => (
      <ExpandableCodeCell codes={value} rowKey={`in-${row.adm3_id}-${idx}`} />
    ),
  },
  {
    key: "sit_output",
    label: "Alerta Salida (SIT)",
    minWidth: "180px",
    render: (value, row, idx) => (
      <ExpandableCodeCell codes={value} rowKey={`out-${row.adm3_id}-${idx}`} />
    ),
  },
  { 
    key: "predios", 
    label: "Predios",
    render: (value) => value
  },
  {
    key: "deforestacion",
    label: "Deforestación (ha)",
    render: (value) => fmtNum(value),
  },
];

// ADM3 Risk Table Component
export default function Adm3RiskTable({ data = {} }) {
  const rows = transformAdm3Data(data);

  return (
    <RiskDataTable
      data={rows}
      columns={ADM3_COLUMNS}
      getRowKey={(row, idx) => `${row.adm3_id}-${idx}`}
      emptyMessage="No hay datos de veredas para mostrar."
    />
  );
}
