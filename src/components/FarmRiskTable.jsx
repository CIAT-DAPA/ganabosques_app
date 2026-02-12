"use client";

import RiskDataTable from "./RiskDataTable";
import { RiskChip, VerificationChip, fmtNum, fmtProp, formatPeriod, getCodes, COLUMN_INFO } from "./shared";

// Transform farm risk data to flat rows
function transformFarmData(data) {
  const entries = Object.entries(data || {});
  const rows = [];

  for (const [, record] of entries) {
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
        verificacion: item.verification || null,
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

  return rows;
}

// Column config
const FARM_COLUMNS = [
  { key: "departamento", label: "Departamento" },
  { key: "municipio", label: "Municipio" },
  { key: "vereda", label: "Vereda" },
  { key: "codes", label: "Código SIT" },
  { key: "periodo", label: "Periodo" },
  { 
    key: "alerta_directa", 
    label: "Alerta Directa",
    render: (value) => <RiskChip hasRisk={value} title="Alerta Directa" />
  },
  { 
    key: "alerta_entrada", 
    label: "Alerta Entrada",
    render: (value) => <RiskChip hasRisk={value} title="Alerta Entrada" />
  },
  { 
    key: "alerta_salida", 
    label: "Alerta Salida",
    render: (value) => <RiskChip hasRisk={value} title="Alerta Salida" />
  },
  {
    key: "verificacion",
    label: "Verificación",
    render: (value) => <VerificationChip verification={value} />
  },
  { 
    key: "deforestacion_ha", 
    label: "Def. (ha)",
    info: COLUMN_INFO.deforestation_ha,
    render: (value) => fmtNum(value)
  },
  { 
    key: "deforestacion_prop", 
    label: "Def. (%)",
    info: COLUMN_INFO.deforestation_pct,
    render: (value) => fmtProp(value)
  },
  { 
    key: "area_protegida_ha", 
    label: "Prot. (ha)",
    info: COLUMN_INFO.protected_ha,
    render: (value) => fmtNum(value)
  },
  { 
    key: "area_protegida_prop", 
    label: "Prot. (%)",
    info: COLUMN_INFO.protected_pct,
    render: (value) => fmtProp(value)
  },
  { 
    key: "frontera_dentro_ha", 
    label: "F. In (ha)",
    info: COLUMN_INFO.frontier_in_ha,
    render: (value) => fmtNum(value)
  },
  { 
    key: "frontera_dentro_prop", 
    label: "F. In (%)",
    info: COLUMN_INFO.frontier_in_pct,
    render: (value) => fmtProp(value)
  },
  { 
    key: "frontera_fuera_ha", 
    label: "F. Out (ha)",
    info: COLUMN_INFO.frontier_out_ha,
    render: (value) => fmtNum(value)
  },
  { 
    key: "frontera_fuera_prop", 
    label: "F. Out (%)",
    info: COLUMN_INFO.frontier_out_pct,
    render: (value) => fmtProp(value)
  },
];

// Farm Risk Table Component
export default function FarmRiskTable({ data = {} }) {
  const rows = transformFarmData(data);

  return (
    <RiskDataTable
      data={rows}
      columns={FARM_COLUMNS}
      getRowKey={(row, idx) => `${row.farm_id}-${idx}`}
      emptyMessage="No hay datos de fincas para mostrar."
    />
  );
}
