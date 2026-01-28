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
  dashboardRisk = false,
  report = false,
  multiPeriod = false,
  hideSearch = false,
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
  const shouldSearchEnterprise = enterpriseRisk || (report && reportType === "empresa");
  const {
    enterpriseSuggestions,
    setEnterpriseSuggestions,
    loading: enterpriseLoading,
    error: enterpriseError, // si tu hook devuelve null, igual funciona
  } = useEnterpriseSuggestions(search, shouldSearchEnterprise);

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
  const shouldSearchAdm = nationalRisk || (report && reportType === "vereda");
  const { admSuggestions, setAdmSuggestions } = useAdmSuggestions(
    search,
    admLevel,
    shouldSearchAdm
  );

  // 🧷 Búsqueda diferida de SIT_CODE
  const shouldSearchFarm = farmRisk || (report && reportType === "finca");
  useFarmCodeSearch(shouldSearchFarm, foundFarms, setFoundFarms, setToast);

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

      {/* Buscador + chips (cuando no es modo reporte, O cuando es reporte con cualquier tipo) */}
      {((!report && !hideSearch) || (report && reportType !== "")) && (
        <div className="flex flex-col gap-2 flex-grow">
          <SearchBar
            search={search}
            setSearch={setSearch}
            onSearch={onSearch}
            farmRisk={report ? reportType === "finca" : farmRisk}
            enterpriseRisk={report ? reportType === "empresa" : enterpriseRisk}
            nationalRisk={report ? reportType === "vereda" : nationalRisk}
            report={report}
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
            farmRisk={report ? reportType === "finca" : farmRisk}
            enterpriseRisk={report ? reportType === "empresa" : enterpriseRisk}
            nationalRisk={report ? reportType === "vereda" : nationalRisk}
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