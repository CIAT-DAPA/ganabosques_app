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
  useEnterpriseSuggestions,
  useSourceLabels
} from "@/hooks/useFilterBarLogic";
import { useMapFiltersOptional } from "@/contexts/MapFiltersContext";

// Filter bar with standalone props or context support
export default function FilterBar({
  risk: propRisk,
  setRisk: propSetRisk,
  year: propYear,
  setYear: propSetYear,
  source: propSource,
  setSource: propSetSource,
  search: propSearch,
  setSearch: propSetSearch,
  onSearch,
  enterpriseRisk = false,
  farmRisk = false,
  nationalRisk = false,
  dashboardRisk = false,
  report = false,
  multiPeriod = false,
  hideSearch = false,
  activity: propActivity,
  setActivity: propSetActivity,
  admLevel: propAdmLevel,
  onAdmSearch,
  selectedEnterprise: propSelectedEnterprise,
  setSelectedEnterprise: propSetSelectedEnterprise,
  foundFarms: propFoundFarms,
  setFoundFarms: propSetFoundFarms,
  foundAdms: propFoundAdms,
  setFoundAdms: propSetFoundAdms,
  onYearStartEndChange: propOnYearStartEndChange,
  riskOptions: propRiskOptions,
  period: propPeriod,
  setPeriod: propSetPeriod,
  reportType,
  setReportType,
  onPeriodsChange,
  sourceLabel: propSourceLabel,
  setSourceLabel: propSetSourceLabel,
}) {
  const ctx = useMapFiltersOptional();
  
  const risk = propRisk ?? ctx?.risk;
  const setRisk = propSetRisk ?? ctx?.setRisk;
  const year = propYear ?? ctx?.year;
  const setYear = propSetYear ?? ctx?.setYear;
  const source = propSource ?? ctx?.source;
  const setSource = propSetSource ?? ctx?.setSource;
  const search = propSearch ?? ctx?.search;
  const setSearch = propSetSearch ?? ctx?.setSearch;
  const period = propPeriod ?? ctx?.period;
  const setPeriod = propSetPeriod ?? ctx?.setPeriod;
  const selectedEnterprise = propSelectedEnterprise ?? ctx?.selectedEnterprise;
  const setSelectedEnterprise = propSetSelectedEnterprise ?? ctx?.setSelectedEnterprise;
  const foundFarms = propFoundFarms ?? ctx?.foundFarms;
  const setFoundFarms = propSetFoundFarms ?? ctx?.setFoundFarms;
  const foundAdms = propFoundAdms ?? ctx?.foundAdms;
  const setFoundAdms = propSetFoundAdms ?? ctx?.setFoundAdms;
  const admLevel = propAdmLevel ?? ctx?.admLevel;
  const riskOptions = propRiskOptions ?? ctx?.riskOptions;
  const onYearStartEndChange = propOnYearStartEndChange ?? ctx?.handleYearStartEndChange;
  const activity = propActivity ?? ctx?.activity;
  const setActivity = propSetActivity ?? ctx?.setActivity;
  const sourceLabel = propSourceLabel ?? ctx?.sourceLabel;
  const setSourceLabel = propSetSourceLabel ?? ctx?.setSourceLabel;

  const [toast, setToast] = useState(null);

  const shouldSearchEnterprise = enterpriseRisk || (report && reportType === "empresa");
  const {
    enterpriseSuggestions,
    setEnterpriseSuggestions,
    loading: enterpriseLoading,
    error: enterpriseError,
  } = useEnterpriseSuggestions(search, shouldSearchEnterprise, 400, activity);

  const { yearRanges, error: yearError } = useYearRanges(
    source,
    risk,
    year,
    setYear,
    setPeriod,
    onYearStartEndChange,
    activity
  );

  const shouldSearchAdm = nationalRisk || (report && reportType === "vereda");
  const { admSuggestions, setAdmSuggestions } = useAdmSuggestions(
    search,
    admLevel,
    shouldSearchAdm
  );

  const shouldSearchFarm = farmRisk || (report && reportType === "finca");
  useFarmCodeSearch(shouldSearchFarm, foundFarms, setFoundFarms, setToast, activity, sourceLabel);

  // Fetch available source labels from enums
  const { sourceLabels } = useSourceLabels();

  // Auto-switch sourceLabel when activity changes
  useEffect(() => {
    if (activity === "cacao" || activity === "cafe") {
      setSourceLabel("GEOFARMER_ID");
    } else if (activity === "ganaderia") {
      setSourceLabel("SIT_CODE");
    }
  }, [activity, setSourceLabel]);

  useEffect(() => {
    if (enterpriseError) setToast({ type: "alert", message: enterpriseError });
  }, [enterpriseError]);

  useEffect(() => {
    if (yearError) setToast({ type: "alert", message: yearError });
  }, [yearError]);
  // Use relative positioning for dashboard, absolute for map overlays
  const containerClasses = dashboardRisk
    ? "relative z-[1000] flex gap-4 py-4"
    : "absolute top-4 left-[88px] right-4 z-[1000] flex gap-4";

  return (
    <div className={containerClasses}>
      <FilterSelects
        risk={risk}
        setRisk={setRisk}
        year={year}
        setYear={setYear}
        source={source}
        setSource={setSource}
        activity={activity}
        setActivity={setActivity}
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

      {((!report && !hideSearch) || (report && reportType !== "")) && (
        <div className="flex items-start gap-2 flex-grow">
          {/* Source label select — visible only for farm risk */}
          {(farmRisk || (report && reportType === "finca")) && sourceLabels.length > 0 && (
            <select
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              className="px-3 py-2 text-sm rounded-full bg-custom border border-gray-300 shadow-md text-custom-dark focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shrink-0"
              aria-label="Tipo de código"
            >
              {sourceLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          )}

          <div className="flex flex-col gap-2 flex-grow">
            <SearchBar
              search={search}
              setSearch={setSearch}
              onSearch={onSearch}
              farmRisk={report ? reportType === "finca" : farmRisk}
              enterpriseRisk={report ? reportType === "empresa" : enterpriseRisk}
              nationalRisk={report ? reportType === "vereda" : nationalRisk}
              report={report}
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
              onAdmSearch={onAdmSearch ?? ctx?.handleAdmSearch}
              admLevel={admLevel}
              risk={risk}
              year={year}
              source={source}
              setToast={setToast}
              enterpriseLoading={enterpriseLoading}
              activity={activity}
              sourceLabel={sourceLabel}
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
        </div>
      )}

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