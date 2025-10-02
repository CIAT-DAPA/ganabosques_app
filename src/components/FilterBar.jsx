"use client";

import { useState, useEffect } from "react";
import Toast from "@/components/Toast";
import FilterSelects from "@/components/FilterSelects";
import SearchBar from "@/components/SearchBar";
import FilterChips from "@/components/FilterChips";
import {
  useYearRanges,
  useAdmSuggestions,
  useFarmCodeSearch,
  useEnterpriseSuggestions
} from "@/components/hooks/useFilterBarLogic";

export default function FilterBar({
  risk,
  setRisk,
  year,
  setYear,
  source,
  setSource,
  search,
  setSearch,
  onSearch,
  enterpriseRisk = false,
  farmRisk = false,
  nationalRisk = false,
  report = false,
  multiPeriod = false,
  admLevel,
  onAdmSearch,
  selectedEnterprise,
  setSelectedEnterprise,
  foundFarms,
  setFoundFarms,
  foundAdms,
  setFoundAdms,
  onYearStartEndChange,
  riskOptions,
  period,
  setPeriod,
  reportType,
  setReportType,
  onPeriodsChange,
}) {
  const [toast, setToast] = useState(null);

  // 🔎 Empresas por nombre (debounce). Mapeamos a los nombres esperados por SearchBar:
  const {
    enterpriseSuggestions,
    setEnterpriseSuggestions,
    loading: enterpriseLoading,
    error: enterpriseError, // si tu hook devuelve null, igual funciona
  } = useEnterpriseSuggestions(search,enterpriseRisk);

  // 🔁 Años disponibles
  const { yearRanges, error: yearError } = useYearRanges(
    source,
    risk,
    year,
    setYear,
    setPeriod,
    onYearStartEndChange
  );

  // 🗺️ ADM por nombre (debounce)
  const { admSuggestions, setAdmSuggestions } = useAdmSuggestions(
    search,
    admLevel,
    nationalRisk
  );

  // 🧷 Búsqueda diferida de SIT_CODE
  useFarmCodeSearch(farmRisk, foundFarms, setFoundFarms, setToast);

  // 🛎️ Toasts de error
  useEffect(() => {
    if (enterpriseError) {
      setToast({ type: "alert", message: enterpriseError });
    }
  }, [enterpriseError]);

  useEffect(() => {
    if (yearError) {
      setToast({ type: "alert", message: yearError });
    }
  }, [yearError]);

  return (
    <div className="absolute top-4 left-[88px] right-4 z-[1000] flex gap-4">
      {/* Selectores de filtros */}
      <FilterSelects
        risk={risk}
        setRisk={setRisk}
        year={year}
        setYear={setYear}
        source={source}
        setSource={setSource}
        riskOptions={riskOptions}
        yearRanges={yearRanges}
        period={period}
        setPeriod={setPeriod}
        onYearStartEndChange={onYearStartEndChange}
        report={report}
        reportType={reportType}
        setReportType={setReportType}
        multiPeriod={multiPeriod}
        onPeriodsChange={onPeriodsChange}
      />

      {/* Buscador + chips (solo cuando no es modo reporte) */}
      {!report && (
        <div className="flex flex-col gap-2 flex-grow">
          <SearchBar
            search={search}
            setSearch={setSearch}
            onSearch={onSearch}
            farmRisk={farmRisk}
            enterpriseRisk={enterpriseRisk}
            nationalRisk={nationalRisk}
            /* ⬇️ Mantenemos las props que espera SearchBar pero alimentadas del nuevo hook */
            filteredEnterprises={enterpriseSuggestions}
            setFilteredEnterprises={setEnterpriseSuggestions}
            selectedEnterprise={selectedEnterprise}
            setSelectedEnterprise={setSelectedEnterprise}
            foundFarms={foundFarms}
            setFoundFarms={setFoundFarms}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
            admSuggestions={admSuggestions}
            setAdmSuggestions={setAdmSuggestions}
            onAdmSearch={onAdmSearch}
            admLevel={admLevel}
            risk={risk}
            year={year}
            source={source}
            setToast={setToast}
            /* opcional: si quieres indicar spinner durante búsqueda de empresas */
            enterpriseLoading={enterpriseLoading}
          />

          <FilterChips
            farmRisk={farmRisk}
            enterpriseRisk={enterpriseRisk}
            nationalRisk={nationalRisk}
            foundFarms={foundFarms}
            setFoundFarms={setFoundFarms}
            selectedEnterprise={selectedEnterprise}
            setSelectedEnterprise={setSelectedEnterprise}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}