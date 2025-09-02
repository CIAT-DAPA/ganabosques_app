"use client";

import { useState, useEffect } from "react";
import Toast from "@/components/Toast";
import FilterSelects from "@/components/FilterSelects";
import SearchBar from "@/components/SearchBar";
import FilterChips from "@/components/FilterChips";
import {
  useEnterprises,
  useYearRanges,
  useAdmSuggestions,
  useFarmCodeSearch,
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
}) {
  const [toast, setToast] = useState(null);

  // Custom hooks para manejar la lógica compleja
  const {
    filteredEnterprises,
    setFilteredEnterprises,
    error: enterpriseError,
  } = useEnterprises(enterpriseRisk, search);

  const { yearRanges, error: yearError } = useYearRanges(
    source,
    risk,
    year,
    setYear,
    setPeriod,
    onYearStartEndChange
  );

  const { admSuggestions, setAdmSuggestions } = useAdmSuggestions(
    search,
    admLevel,
    nationalRisk
  );

  // Hook para búsqueda diferida de SIT_CODE
  useFarmCodeSearch(farmRisk, foundFarms, setFoundFarms, setToast);

  // Mostrar errores como toast
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
      {/* Filter Selects */}
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
      />

      {/* Search Bar and Chips Container */}
      <div className="flex flex-col gap-2 flex-grow">
        <SearchBar
          search={search}
          setSearch={setSearch}
          onSearch={onSearch}
          farmRisk={farmRisk}
          enterpriseRisk={enterpriseRisk}
          nationalRisk={nationalRisk}
          filteredEnterprises={filteredEnterprises}
          setFilteredEnterprises={setFilteredEnterprises}
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

      {/* Toast Messages */}
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
