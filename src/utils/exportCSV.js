"use client";
import { fmtProp } from "./formatUtils";

export const formatSitCodes = (sitCodes = {}) => {
  return Object.entries(sitCodes)
    .map(([farmId, farmCodes]) => {
      const codes = farmCodes
        .filter((code) => code?.ext_code)
        .map((code) => `${code.source}: ${code.ext_code}`)
        .join(" | ");

      return `{ ${codes} }`;
    })
    .join("\n");
};

export const formatFarmCodes = (extIds = []) => {
  if (!Array.isArray(extIds)) return "Sin códigos";

  return (
    extIds
      .filter((c) => c?.ext_code)
      .map((c) => `${c.source}: ${c.ext_code}`)
      .join(", ") || "Sin códigos"
  );
};

export const escapeCsvCell = (cell) => {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
};

export const exportEnterpriseToCSV = (data) => {
  if (!data || Object.keys(data).length === 0) return "";

  const rows = [];

  rows.push([
    "Departamento",
    "Municipio",
    "Tipo Empresa",
    "ID Empresa",
    "Nombre Empresa",
    "Periodo",
    "Alerta",
    "Alerta Entrada",
    "Alerta Salida",
  ]);

  Object.entries(data).forEach(([enterpriseId, enterpriseData]) => {
    const enterprise = enterpriseData.enterprise;

    enterpriseData.items?.forEach((item) => {
      const startYear = new Date(item.period_start).getFullYear();
      const endYear = new Date(item.period_end).getFullYear();

      const period = `${startYear} - ${endYear}`;

      const inputCodes = formatSitCodes(
        item.sit_codes?.input || {}
      );

      const outputCodes = formatSitCodes(
        item.sit_codes?.output || {}
      );

      rows.push([
        enterprise?.department || "",
        enterprise?.municipality || "",
        enterprise?.type_enterprise || "",
        enterprise?.ext_id?.[0]?.ext_code || enterpriseId,
        enterprise?.name || "",
        period,
        item.risk_input?.length > 0 ||
        item.risk_output?.length > 0
          ? "Con alerta"
          : "Sin alerta",
        inputCodes || "Sin códigos",
        outputCodes || "Sin códigos",
      ]);
    });
  });

  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
};

export const exportFarmToCSV = (data) => {
  if (!data || Object.keys(data).length === 0) return "";

  const rows = [];

  rows.push([
    "Departamento",
    "Municipio",
    "Vereda",
    "Códigos",
    "Periodo",
    "Alerta Directa",
    "Alerta Entrada",
    "Alerta Salida",
    "Verificación",
    "Def. (ha)",
    "Def. (%)",
    "Prot. (ha)",
    "Prot. (%)",
    "F. In (ha)",
    "F. In (%)",
    "F. Out (ha)",
    "F. Out (%)",
  ]);

  Object.entries(data).forEach(([farmId, farmData]) => {
    const farm = farmData.farm;

    const codes = formatFarmCodes(farm?.ext_id);

    farmData.items?.forEach((item) => {
      const startYear = new Date(item.period_start).getFullYear();
      const endYear = new Date(item.period_end).getFullYear();

      const period = `${startYear} - ${endYear}`;

      rows.push([
        farm?.department || "",
        farm?.municipality || "",
        farm?.vereda || "",
        codes,
        period,

        item.risk_direct ? "Con alerta" : "Sin alerta",
        item.risk_input ? "Con alerta" : "Sin alerta",
        item.risk_output ? "Con alerta" : "Sin alerta",

        "No verificado",

        item?.deforestation?.ha?.toFixed(2) || "0.00",
        fmtProp(item?.deforestation?.prop),

        item?.protected?.ha?.toFixed(2) || "0.00",
        fmtProp(item?.protected?.prop),

        item?.farming_in?.ha?.toFixed(2) || "0.00",
        fmtProp(item?.farming_in?.prop),

        item?.farming_out?.ha?.toFixed(2) || "0.00",
        fmtProp(item?.farming_out?.prop),
      ]);
    });
  });

  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
};

export const exportVeredaToCSV = (data) => {
  if (!data || Object.keys(data).length === 0) return "";

  const rows = [];

  rows.push([
    "Departamento",
    "Municipio",
    "Vereda",
    "Periodo",
    "Alerta",
    "Alerta Directa",
    "Alerta Entrada",
    "Alerta Salida",
    "Predios",
    "Deforestación (ha)",
  ]);

  Object.entries(data).forEach(([adm3Id, veredaData]) => {
    veredaData.items?.forEach((item) => {
      const startYear = new Date(item.period_start).getFullYear();
      const endYear = new Date(item.period_end).getFullYear();

      const period = `${startYear} - ${endYear}`;

      const directCodes = formatSitCodes(
        item.sit_codes?.direct || {}
      );

      const inputCodes = formatSitCodes(
        item.sit_codes?.input || {}
      );

      const outputCodes = formatSitCodes(
        item.sit_codes?.output || {}
      );

      rows.push([
        veredaData.department || "",
        veredaData.municipality || "",
        veredaData.name || "",
        period,

        item.risk_total
          ? "Con alerta"
          : "Sin alerta",

        directCodes || "Sin códigos",
        inputCodes || "Sin códigos",
        outputCodes || "Sin códigos",

        item.farm_amount || 0,

        item.def_ha?.toFixed(2) || "0.00",
      ]);
    });
  });

  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
};