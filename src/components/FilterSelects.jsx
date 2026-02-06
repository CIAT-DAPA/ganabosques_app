"use client";

import { useMemo, useState } from "react";
import CustomSelect from "@/components/CustomSelect";
import MultiPeriodSelect from "@/components/MultiPeriodSelect";

// Filter selection controls
export default function FilterSelects({
  report = false,
  multiPeriod = false,
  reportType,
  setReportType,
  risk,
  setRisk,
  year,
  setYear,
  source,
  setSource,
  activity = "ganaderia",
  setActivity,
  riskOptions,
  yearRanges,
  period,
  setPeriod,
  onYearStartEndChange,
  onPeriodsChange,
}) {
  const asId = (v) => (v == null ? "" : String(v));

  const formatPeriod = (item) => {
    const type = item?.deforestation_type;
    
    // For annual and cumulative: show only years (YYYY - YYYY)
    if (type === "annual" || type === "cumulative") {
      const start = item?.deforestation_period_start
        ? new Date(item.deforestation_period_start).getFullYear()
        : "";
      const end = item?.deforestation_period_end
        ? new Date(item.deforestation_period_end).getFullYear()
        : "";
      return `${start} - ${end}`;
    }
    
    // For atd and nad: show year-month format (YYYY-MM - YYYY-MM)
    if (type === "atd" || type === "nad") {
      const formatYearMonth = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
      };
      const start = formatYearMonth(item?.deforestation_period_start);
      const end = formatYearMonth(item?.deforestation_period_end);
      return `${start} - ${end}`;
    }
    
    // Fallback: show raw values
    return `${item?.deforestation_period_start} - ${item?.deforestation_period_end}`;
  };

  const sourceOptions = useMemo(() => [{ value: "smbyc", label: "SMBYC" }], []);

  const activityOptions = useMemo(() => [
    { value: "cacao", label: "Cacao" },
    { value: "ganaderia", label: "Ganadería" },
  ], []);

  const yearOptions = useMemo(() =>
    (yearRanges || []).map((item) => ({
      value: asId(item.id),
      label: formatPeriod(item),
      _raw: item,
    })), [yearRanges]);

  const reportTypeOptions = useMemo(() => [
    { value: "vereda", label: "Vereda" },
    { value: "finca", label: "Finca" },
    { value: "empresa", label: "Empresa" },
  ], []);

  const [multiSelectedIds, setMultiSelectedIds] = useState([]);

  const handleYearChangeSingle = (e) => {
    const selectedId = e.target.value;
    setYear?.(selectedId);

    const selected = (yearRanges || []).find((y) => asId(y.id) === selectedId);
    setPeriod?.(selected);

    if (selected) {
      onYearStartEndChange?.(selected.deforestation_period_start, selected.deforestation_period_end);
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

    const minStart = starts.length ? new Date(Math.min(...starts)).toISOString() : null;
    const maxEnd = ends.length ? new Date(Math.max(...ends)).toISOString() : null;

    onYearStartEndChange?.(minStart, maxEnd);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <CustomSelect
        value={activity}
        onChange={(e) => setActivity?.(e.target.value)}
        options={activityOptions}
        className="min-w-[140px]"
        aria-label="Seleccionar actividad"
        placeholder="Seleccionar actividad"
      />

      <CustomSelect
        value={source}
        onChange={(e) => setSource?.(e.target.value)}
        options={sourceOptions}
        className="min-w-[120px]"
        aria-label="Seleccionar fuente de datos"
      />

      <CustomSelect
        value={risk}
        onChange={(e) => setRisk?.(e.target.value)}
        options={riskOptions}
        className="min-w-[140px]"
        aria-label="Seleccionar tipo de riesgo"
      />

      {report && multiPeriod ? (
        <MultiPeriodSelect
          options={yearOptions.map(({ value, label, _raw }) => ({ value, label, _raw }))}
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

      {report && (
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