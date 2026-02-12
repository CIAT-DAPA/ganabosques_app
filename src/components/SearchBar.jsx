"use client";

import { useState, useCallback } from "react";

export default function SearchBar({
  search,
  setSearch,
  onSearch,
  farmRisk = false,
  enterpriseRisk = false,
  nationalRisk = false,
  report = false,
  filteredEnterprises = [],
  setFilteredEnterprises,
  selectedEnterprise,            // ahora es array: lista de empresas completas
  setSelectedEnterprise,
  foundFarms = [],
  setFoundFarms,
  foundAdms = [],
  setFoundAdms,
  admSuggestions = [],
  setAdmSuggestions,
  onAdmSearch,
  admLevel,
  risk,
  year,
  source,
  setToast,
  activity,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helpers para ID y nombre (evitan duplicados y claves undefined)
  const getEntId = (x) =>
    x?.id ?? x?._id ?? x?.ext_id?.[0]?.ext_code ?? String(x?.name ?? "");

  const getEntName = (x) =>
    x?.name ?? x?.label ?? String(getEntId(x));

  const getPlaceholder = () => {
    if (farmRisk) return activity === "cacao" ? "Buscar GEOFARMER_ID" : "Buscar SIT CODE";
    if (enterpriseRisk) return "Buscar empresa";
    return "Buscar sitio";
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
  };

  // Selección de EMPRESA → agrega el OBJETO COMPLETO, limpia input y cierra dropdown
  const handleEnterpriseSelect = useCallback(
    (ent) => {
      const payload = ent; // el hook ya trae el objeto completo
      const newId = getEntId(payload);

      const exists = Array.isArray(selectedEnterprise)
        ? selectedEnterprise.some((e) => getEntId(e) === newId)
        : false;

      if (!exists) {
        setSelectedEnterprise((prev) => [...(prev || []), payload]);
      }

      setSearch("");               // limpia input
      setFilteredEnterprises([]);  // cierra dropdown
    },
    [selectedEnterprise, setSelectedEnterprise, setSearch, setFilteredEnterprises]
  );

  // Selección ADM (igual que tenías)
  const handleAdmSelect = useCallback(
    (item) => {
      if (foundAdms.length >= 5) {
        setToast({ type: "warning", message: "Máximo 5 elementos permitidos" });
        return;
      }

      if (!foundAdms.find((adm) => adm.id === item.id)) {
        setFoundAdms((prev) => [...prev, { id: item.id, adm3name: item.name }]);
      }

      setSearch("");
      setAdmSuggestions([]);
      onAdmSearch(item.name, admLevel);
    },
    [foundAdms, setFoundAdms, setSearch, setAdmSuggestions, onAdmSearch, admLevel, setToast]
  );

  const validateFarmRiskSearch = () => {
    // En modo reporte no requerimos year/source, solo validamos cantidad
    if (!report && (!risk || !year || !source)) {
      setToast({
        type: "warning",
        message: "Debes seleccionar Riesgo, Año y Fuente antes de buscar",
      });
      return false;
    }
    if (foundFarms.length >= 5) {
      setToast({ type: "warning", message: "Máximo 5 SIT CODE permitidos" });
      return false;
    }
    return true;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = search.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      if (farmRisk) {
        if (!validateFarmRiskSearch()) return;
        if (!foundFarms.find((f) => f.code === trimmed)) {
          setFoundFarms((prev) => [...prev, { id: null, code: trimmed }]);
        }
        setSearch("");
        return;
      }

      if (enterpriseRisk) return; // empresas funcionan con sugerencias/chips

      if (nationalRisk) {
        onAdmSearch(trimmed, admLevel);
        return;
      }

      onSearch?.(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestionClasses =
    "px-4 py-2 text-sm text-custom-dark hover:bg-gray-100 cursor-pointer transition-colors duration-150";
  const suggestionContainerClasses =
    "absolute left-0 right-0 top-full mt-1 w-full bg-custom border border-gray-300 rounded-md shadow-lg z-[1300] max-h-48 overflow-y-auto";

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-2 flex-grow min-w-[200px]">
      <div className="relative w-full max-w-md">
        <div className="flex items-center bg-custom rounded-full shadow-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
          <input
            type="text"
            placeholder={getPlaceholder()}
            value={search}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className="flex-grow px-4 py-2 text-sm text-custom-dark bg-transparent focus:outline-none disabled:opacity-50"
            aria-label={getPlaceholder()}
          />
          <button
            type="submit"
            disabled={isSubmitting || !search.trim()}
            className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors duration-150 disabled:opacity-50"
            aria-label="Buscar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
            </svg>
          </button>
        </div>

        {/* Sugerencias de EMPRESAS */}
        {enterpriseRisk && search.trim() && filteredEnterprises.length > 0 && (
          <ul className={suggestionContainerClasses} role="listbox">
            {filteredEnterprises.map((ent) => (
              <li
                key={getEntId(ent)}
                onClick={() => handleEnterpriseSelect(ent)}
                className={suggestionClasses}
                role="option"
              >
                {getEntName(ent)}
              </li>
            ))}
          </ul>
        )}

        {/* Sugerencias ADM */}
        {nationalRisk && admSuggestions.length > 0 && (
          <ul className={suggestionContainerClasses} role="listbox">
            {admSuggestions.map((item) => (
              <li
                key={item.id}
                onClick={() => handleAdmSelect(item)}
                className={suggestionClasses}
                role="option"
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}