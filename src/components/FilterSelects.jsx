"use client";

import { useMemo } from "react";
import CustomSelect from "@/components/CustomSelect";

export default function FilterSelects({
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
}) {
  // Utility function to normalize values to safe strings
  const asId = (v) => (v == null ? "" : String(v));

  // Memoized options to prevent unnecessary re-renders
  const sourceOptions = useMemo(() => [{ value: "smbyc", label: "SMBYC" }], []);

  const yearOptions = useMemo(() => 
    yearRanges.map((item) => ({
      value: asId(item.id),
      label: `${item.deforestation_year_start} - ${item.deforestation_year_end}`,
    })), [yearRanges]
  );

  const handleYearChange = (e) => {
    const selectedId = e.target.value;
    setYear(selectedId);
    
    const selected = yearRanges.find((y) => asId(y.id) === selectedId);
    setPeriod(selected);
    
    if (selected) {
      onYearStartEndChange?.(
        selected.deforestation_year_start,
        selected.deforestation_year_end
      );
    } else {
      onYearStartEndChange?.(null, null);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Source Select */}
      <CustomSelect
        value={source}
        onChange={(e) => setSource(e.target.value)}
        options={sourceOptions}
        className="min-w-[120px]"
        aria-label="Seleccionar fuente de datos"
      />

      {/* Risk/Modality Select */}
      <CustomSelect
        value={risk}
        onChange={(e) => setRisk(e.target.value)}
        options={riskOptions}
        className="min-w-[140px]"
        aria-label="Seleccionar tipo de riesgo"
      />

      {/* Period Select */}
      <CustomSelect
        value={asId(year)}
        onChange={handleYearChange}
        options={yearOptions}
        placeholder="Seleccionar período"
        className="min-w-[160px]"
        aria-label="Seleccionar período de análisis"
      />
    </div>
  );
}
