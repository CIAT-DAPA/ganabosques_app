"use client";

import { useMemo, useState } from "react";
import CustomSelect from "@/components/CustomSelect";

/* ===========================
   Multi select de períodos (bonito)
   =========================== */
function MultiPeriodSelect({
  options,
  values = [],
  onChange,
  buttonLabel = "Períodos",
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  const isAll = values.length === options.length;
  const handleToggleAll = () => {
    if (isAll) onChange([]);
    else onChange(options.map((o) => o.value));
  };

  const handleClear = () => onChange([]);

  const handleCheck = (val) => {
    if (values.includes(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  };

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? buttonLabel
      : selectedLabels.length <= 2
      ? selectedLabels.join(", ")
      : `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="appearance-none bg-custom border border-gray-300 text-custom-dark text-sm font-medium rounded-full py-2 px-4 pr-8 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer relative w-full"
      >
        {summary}
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          className="absolute z-[1001] mt-1 w-72 bg-custom border border-gray-300 rounded-2xl shadow-lg max-h-64 overflow-auto"
          onMouseLeave={close}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-custom-dark">Seleccionar períodos</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                {isAll ? "Quitar todos" : "Seleccionar todos"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="p-1">
            {options.map((opt, i) => (
              <label
                key={opt.value}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm text-custom-dark cursor-pointer hover:bg-gray-100
                  ${i === 0 ? "rounded-t-2xl" : ""} ${i === options.length - 1 ? "rounded-b-2xl" : ""}
                  ${values.includes(opt.value) ? "bg-gray-100" : ""}
                `}
              >
                <input
                  type="checkbox"
                  checked={values.includes(opt.value)}
                  onChange={() => handleCheck(opt.value)}
                  className="accent-[#082C14]"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-200 text-right">
            <button
              type="button"
              onClick={close}
              className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   FilterSelects
   =========================== */
export default function FilterSelects({
  // modo reporte
  report = false,
  multiPeriod = false, // activa multiselección de períodos en modo reporte

  // tipo de reporte
  reportType,
  setReportType,

  // existentes
  risk,
  setRisk,
  year,
  setYear,
  source,
  setSource,
  riskOptions,
  yearRanges,
  period,
  setPeriod,
  onYearStartEndChange,
  onPeriodsChange,
}) {
  const asId = (v) => (v == null ? "" : String(v));

  const formatPeriod = (item) => {
    if (
      item?.deforestation_type === "annual" ||
      item?.deforestation_type === "cumulative"
    ) {
      const start = item?.deforestation_period_start
        ? new Date(item.deforestation_period_start).getFullYear()
        : "";
      const end = item?.deforestation_period_end
        ? new Date(item.deforestation_period_end).getFullYear()
        : "";
      return `${start} - ${end}`;
    }
    return `${item?.deforestation_period_start} - ${item?.deforestation_period_end}`;
  };

  const sourceOptions = useMemo(() => [{ value: "smbyc", label: "SMBYC" }], []);

  const yearOptions = useMemo(
    () =>
      (yearRanges || []).map((item) => ({
        value: asId(item.id),
        label: formatPeriod(item),
        _raw: item, // guardamos todo para usar fechas luego
      })),
    [yearRanges]
  );

  const reportTypeOptions = useMemo(
    () => [
      { value: "vereda", label: "Vereda" },
    ],
    []
  );

  // Estado local para multiselección de períodos
  const [multiSelectedIds, setMultiSelectedIds] = useState([]);

  const handleYearChangeSingle = (e) => {
    const selectedId = e.target.value;
    setYear?.(selectedId);

    const selected = (yearRanges || []).find((y) => asId(y.id) === selectedId);
    setPeriod?.(selected);

    if (selected) {
      onYearStartEndChange?.(
        selected.deforestation_period_start,
        selected.deforestation_period_end
      );
    } else {
      onYearStartEndChange?.(null, null);
    }
  };
  const handleMultiChangeAndNotify = (vals, options) => {
    setMultiSelectedIds(vals);

    const selectedItems = options
      .filter((o) => vals.includes(o.value))
      .map((o) => o._raw);
    onPeriodsChange?.(selectedItems);
    if (!selectedItems.length) {
      onYearStartEndChange?.(null, null);
      return;
    }

    const starts = selectedItems
      .map((it) => new Date(it.deforestation_period_start).getTime())
      .filter((n) => !isNaN(n));
    const ends = selectedItems
      .map((it) => new Date(it.deforestation_period_end).getTime())
      .filter((n) => !isNaN(n));

    const minStart = starts.length
      ? new Date(Math.min(...starts)).toISOString()
      : null;
    const maxEnd = ends.length
      ? new Date(Math.max(...ends)).toISOString()
      : null;

    onYearStartEndChange?.(minStart, maxEnd);
    // Si quieres además pasar la lista completa:
    // setPeriod?.(selectedItems);
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Tipo de reporte (solo en modo reporte) */}
      

      {/* Fuente */}
      <CustomSelect
        value={source}
        onChange={(e) => setSource?.(e.target.value)}
        options={sourceOptions}
        className="min-w-[120px]"
        aria-label="Seleccionar fuente de datos"
      />

      {/* Tipo de riesgo */}
      <CustomSelect
        value={risk}
        onChange={(e) => setRisk?.(e.target.value)}
        options={riskOptions}
        className="min-w-[140px]"
        aria-label="Seleccionar tipo de riesgo"
      />

      {/* Período: single o múltiple */}
      {report && multiPeriod ? (
        <MultiPeriodSelect
          options={yearOptions.map(({ value, label, _raw }) => ({
            value,
            label,
            _raw,
          }))}
          values={multiSelectedIds}
          onChange={(vals) => handleMultiChangeAndNotify(vals, yearOptions)}
          buttonLabel="Períodos"
          className="min-w-[140px]"
        />
      ) : (
        <CustomSelect
          value={asId(year)}
          onChange={handleYearChangeSingle}
          options={yearOptions}
          placeholder="Seleccionar período"
          className="min-w-[160px]"
          aria-label="Seleccionar período de análisis"
        />
      )}
      {report &&  (
        <CustomSelect
          value={reportType}
          onChange={(e) => setReportType?.(e.target.value)}
          options={reportTypeOptions}
          className="min-w-[160px]"
          aria-label="Seleccionar tipo de reporte"
          placeholder="Tipo de reporte"
        />
      )}
    </div>
  );
}
