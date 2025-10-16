// components/EnterpriseChart.jsx
"use client";

import React, { useMemo } from "react";
import { MapPin, Building2, Activity, Briefcase, Tag, AlertTriangle } from "lucide-react";

const COLOR_TRUE = "#D50000";   // rojo alerta
const COLOR_FALSE = "#00C853";  // verde sin alerta

// ================================
// Utilidades
// ================================
function getExtCodeBySource(item, source = "SIT_CODE") {
  const arr = item?.ext_id || item?.extId || [];
  const found = Array.isArray(arr)
    ? arr.find((e) => e?.source === source || e?.label === source)
    : null;
  return found?.ext_code ?? null;
}
function getProducerId(item) {
  const arr = item?.ext_id || item?.extId || [];
  const found = Array.isArray(arr)
    ? arr.find((e) => e?.source === "PRODUCER_ID" || e?.label === "PRODUCER_ID")
    : null;
  return found?.ext_code ?? null;
}

function providerAlertFlags(provider = {}) {
  const r = provider?.risk || {};
  return {
    direct: r?.risk_direct === true,
    input: r?.risk_input === true,
    output: r?.risk_output === true,
    defHa: r?.deforestation?.ha ?? null,
  };
}

function hasAnyAlert(provider = {}) {
  const f = providerAlertFlags(provider);
  return f.direct || f.input || f.output;
}
function hasAnyAlertInArray(arr = []) {
  return (arr || []).some(hasAnyAlert);
}

function Badge({ active, className = "" }) {
  const color = active ? COLOR_TRUE : COLOR_FALSE;
  const label = active ? "Con Alerta" : "Sin Alerta";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: color, color: "#fff" }}
    >
      {label}
    </span>
  );
}

function CellChip({ active, title }) {
  const color = active ? COLOR_TRUE : COLOR_FALSE;
  const label = active ? "Con alerta" : "Sin alerta";
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

function fmtHa(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  return n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
}

// ================================
// Componente principal
// ================================
export default function EnterpriseChart({ yearStart, yearEnd, enterpriseDetails = [] }) {
  if (!enterpriseDetails || enterpriseDetails.length === 0)
    return <p className="text-sm text-gray-500"></p>;

  const ent = enterpriseDetails[0];
  const department = ent?.adm1?.name || "—";
  const municipality = ent?.adm2?.name || "—";
  const enterpriseName = ent?.name || "—";
  const enterpriseType = ent?.type_enterprise || ent?.type || "—";

  const inputs = ent?.providers?.inputs ?? [];
  const outputs = ent?.providers?.outputs ?? [];

  const inputAlert = hasAnyAlertInArray(inputs);
  const outputAlert = hasAnyAlertInArray(outputs);

  const inputsRows = useMemo(
    () =>
      (inputs || []).map((p) => {
        const flags = providerAlertFlags(p);
        return {
          scope: "entrada",
          sit: getExtCodeBySource(p, "SIT_CODE"),
          producerId: getProducerId(p),
          ...flags,
          _id: p?._id,
        };
      }),
    [inputs]
  );

  const outputsRows = useMemo(
    () =>
      (outputs || []).map((p) => {
        const flags = providerAlertFlags(p);
        return {
          scope: "salida",
          sit: getExtCodeBySource(p, "SIT_CODE"),
          producerId: getProducerId(p),
          ...flags,
          _id: p?._id,
        };
      }),
    [outputs]
  );

  const Table = ({ title, rows }) => (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-gray-700">Predio</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Alerta directa</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Alerta de entrada</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Alerta de salida</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Área deforestada (ha)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-gray-500">
                  No hay predios para mostrar.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const hasSit = !!r.sit;
                const hasProd = !!r.producerId;
                return (
                  <tr key={r._id || `${r.sit || "S"}-${idx}`}>
                    <td className="px-3 py-2">
                      {(hasSit || hasProd) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {hasSit && <><span className="font-semibold">SIT:</span> {r.sit}</>}
                          {hasSit && hasProd && <span>, </span>}
                          {hasProd && <><span className="font-semibold">PRODUCER_ID:</span> {r.producerId}</>}
                        </div>
                      )}
                      
                    </td>
                    <td className="px-3 py-2"><CellChip active={r.direct} title="Alerta directa" /></td>
                    <td className="px-3 py-2"><CellChip active={r.input} title="Alerta de entrada" /></td>
                    <td className="px-3 py-2"><CellChip active={r.output} title="Alerta de salida" /></td>
                    <td className="px-3 py-2">{fmtHa(r.defHa)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="px-10 py-6 mb-6 border-b border-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1px_minmax(0,1fr)] gap-4 md:gap-0">
          {/* Izquierda */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Empresa</div>
                <div className="font-medium">{enterpriseName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Tipo de empresa</div>
                <div className="font-medium">{enterpriseType}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Departamento</div>
                <div className="font-medium">{department}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Municipio</div>
                <div className="font-medium">{municipality}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Período</div>
                <div className="font-medium">
                  {yearStart} - {yearEnd}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Alerta de entrada</div>
                <Badge active={inputAlert} className="mt-1" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Alerta de salida</div>
                <Badge active={outputAlert} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden md:block bg-gray-200 md:self-stretch" style={{ width: 1 }} />

          {/* Derecha: Tablas */}
          <div className="md:pl-4 md:min-w-0 space-y-8">
            <Table title="Predios con alerta de entrada" rows={inputsRows} />
            <Table title="Predios con alerta de salida" rows={outputsRows} />
          </div>
        </div>
      </div>
    </div>
  );
}