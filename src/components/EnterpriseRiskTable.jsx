"use client";

import RiskDataTable from "./RiskDataTable";
import { RiskChip, ExpandableCodeCell, formatPeriod } from "./shared";
import { ENTERPRISE_TYPES, translateEnterpriseType, TYPE_ALIASES } from "@/utils";

// Get enterprise type from record
function getEnterpriseTypeFromRecord(enterprise) {
  if (enterprise.type_enterprise || enterprise.type) {
    return translateEnterpriseType(enterprise.type_enterprise || enterprise.type);
  }

  if (Array.isArray(enterprise.ext_id) && enterprise.ext_id.length > 0) {
    for (const idObj of enterprise.ext_id) {
      if (idObj.label && TYPE_ALIASES[idObj.label]) {
        return translateEnterpriseType(TYPE_ALIASES[idObj.label]);
      }
    }
    const labels = enterprise.ext_id.map((e) => e?.label).filter(Boolean);
    if (labels.includes("SLAUGHTERHOUSE_ID")) return ENTERPRISE_TYPES.SLAUGHTERHOUSE;
  }

  return "—";
}

// Get enterprise external code
function getEnterpriseExtCode(enterprise) {
  if (Array.isArray(enterprise.ext_id) && enterprise.ext_id.length > 0) {
    return enterprise.ext_id[0]?.ext_code || "N/A";
  }
  return "N/A";
}

// Transform enterprise risk data to flat rows
function transformEnterpriseData(data) {
  const entries = Object.entries(data || {});
  const rows = [];

  for (const [, record] of entries) {
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
        _rowKey: `${getEnterpriseExtCode(enterprise)}-${item.period_start}`,
      });
    }
  }

  return rows;
}

// Column config
const ENTERPRISE_COLUMNS = [
  { key: "departamento", label: "Departamento" },
  { key: "municipio", label: "Municipio" },
  { key: "tipo_empresa", label: "Tipo Empresa" },
  { key: "id_empresa", label: "ID Empresa", highlight: true },
  { key: "nombre_empresa", label: "Nombre Empresa", highlight: true },
  { key: "periodo", label: "Periodo" },
  {
    key: "alerta",
    label: "Alerta",
    render: (value) => <RiskChip hasRisk={value} />,
  },
  {
    key: "alerta_entrada",
    label: "Alerta Entrada (SIT Codes)",
    minWidth: "200px",
    render: (value, row, idx) => (
      <ExpandableCodeCell codes={value} rowKey={`in-${row.id_empresa}-${idx}`} />
    ),
  },
  {
    key: "alerta_salida",
    label: "Alerta Salida (SIT Codes)",
    minWidth: "200px",
    render: (value, row, idx) => (
      <ExpandableCodeCell codes={value} rowKey={`out-${row.id_empresa}-${idx}`} />
    ),
  },
];

// Enterprise Risk Table Component
export default function EnterpriseRiskTable({ data = {} }) {
  const rows = transformEnterpriseData(data);

  return (
    <RiskDataTable
      data={rows}
      columns={ENTERPRISE_COLUMNS}
      getRowKey={(row, idx) => `${row.id_empresa}-${idx}`}
      emptyMessage="No hay datos de empresas para mostrar."
    />
  );
}
