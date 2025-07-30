"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import {
  fetchEnterprises,
  fetchYearRanges,
  fetchFarmBySITCode,
  searchAdmByName,
} from "@/services/apiService";

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
  setAdmLevel,
  onAdmSearch,
  selectedEnterprise,
  setSelectedEnterprise,
  foundFarms,
  setFoundFarms,
  foundAdms,
  setFoundAdms,
}) {
  const [yearRanges, setYearRanges] = useState([]);
  const [toast, setToast] = useState(null);
  const [enterpriseList, setEnterpriseList] = useState([]);
  const [filteredEnterprises, setFilteredEnterprises] = useState([]);
  const [admSuggestions, setAdmSuggestions] = useState([]);

  useEffect(() => {
    if (!enterpriseRisk) return;
    fetchEnterprises()
      .then(setEnterpriseList)
      .catch(() =>
        setToast({ type: "alert", message: "Error al cargar empresas" })
      );
  }, [enterpriseRisk]);

  useEffect(() => {
    if (enterpriseRisk && search.trim() !== "") {
      const term = search.toLowerCase();
      const filtered = enterpriseList.filter((ent) =>
        ent.name.toLowerCase().includes(term)
      );
      setFilteredEnterprises(filtered);
    } else {
      setFilteredEnterprises([]);
    }
  }, [search, enterpriseList, enterpriseRisk]);

  useEffect(() => {
    fetchYearRanges()
      .then(setYearRanges)
      .catch(() =>
        setToast({ type: "alert", message: "No se encontraron años disponibles" })
      );
  }, []);

  useEffect(() => {
    if (!nationalRisk || !search || !admLevel) return;

    const delay = setTimeout(async () => {
      try {
        const results = await searchAdmByName(search, admLevel);
        setAdmSuggestions(results);
      } catch (error) {
        console.error("Error al buscar sugerencias ADM:", error);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [search, admLevel, nationalRisk]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;

    if (farmRisk) {
      if (foundFarms.length >= 5) {
        setToast({ type: "warning", message: "Máximo 5 SIT CODE permitidos" });
        return;
      }

      try {
        const data = await fetchFarmBySITCode(trimmed);
        if (data.length === 0) {
          setToast({ type: "alert", message: "No se encontró el SIT CODE" });
          return;
        }

        const sitCode = data[0].ext_id.find(
          (ext) => ext.source === "SIT_CODE"
        )?.ext_code;

        if (!foundFarms.find((f) => f.id === data[0].id)) {
          setFoundFarms((prev) => [...prev, { id: data[0].id, code: sitCode }]);
        }

        setSearch("");
      } catch (error) {
        console.error("Error fetching SIT_CODE:", error);
        setToast({
          type: "alert",
          message: "Error de red al buscar el SIT CODE",
        });
      }

      return;
    }

    if (enterpriseRisk) return;

    if (nationalRisk) {
      onAdmSearch(trimmed, admLevel);
      return;
    }

    onSearch(e);
  };

  const selectStyle =
    "appearance-none bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-full py-2 px-4 pr-8 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  const icon = (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  const getRiskLabel = () => (farmRisk ? "Modalidad" : "Riesgo");
  const getRiskOptions = () => {
    if (enterpriseRisk) return [{ value: "risk_total", label: "Riesgo Total" }];
    if (farmRisk)
      return [
        { value: "risk_direct", label: "Riesgo Directo" },
        { value: "risk_total", label: "Riesgo Total" },
      ];
    return [
      { value: "total", label: "Riesgo Total" },
      { value: "parcial", label: "Riesgo Directo" },
    ];
  };

  return (
    <div className="absolute top-4 left-[88px] right-4 z-[1000] flex gap-4 items-center">
      {/* Selects */}
      <div className="relative">
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className={selectStyle}>
          <option value="">{getRiskLabel()}</option>
          {getRiskOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {icon}
      </div>

      <div className="relative">
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectStyle}>
          <option value="">Año</option>
          {yearRanges.map((item) => (
            <option key={item.id} value={item.id}>{item.year_start} - {item.year_end}</option>
          ))}
        </select>
        {icon}
      </div>

      <div className="relative">
        <select value={source} onChange={(e) => setSource(e.target.value)} className={selectStyle}>
          <option value="">Fuente</option>
          <option value="smbyc">SMBYC</option>
        </select>
        {icon}
      </div>

      {nationalRisk && (
        <div className="relative">
          <select value={admLevel} onChange={(e) => setAdmLevel(e.target.value)} className={selectStyle}>
            <option value="">Nivel administrativo</option>
            <option value="adm1">Departamento</option>
            <option value="adm2">Municipio</option>
            <option value="adm3">Vereda</option>
          </select>
          {icon}
        </div>
      )}

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex flex-col gap-2 flex-grow min-w-[200px]">
        <div className="relative w-full">
          <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden border border-gray-300">
            <input
              type="text"
              placeholder={
                farmRisk
                  ? "Buscar SIT CODE"
                  : enterpriseRisk
                  ? "Buscar empresa"
                  : nationalRisk
                  ? `Buscar ${admLevel === "adm1" ? "departamento" : admLevel === "adm2" ? "municipio" : admLevel === "adm3" ? "vereda" : ""}`
                  : "Buscar"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-grow px-4 py-2 text-sm text-gray-700 bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-full m-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
              </svg>
            </button>
          </div>

          {/* Suggestions */}
          {enterpriseRisk && filteredEnterprises.length > 0 && !selectedEnterprise && (
            <ul className="absolute top-full mt-1 left-0 right-0 bg-white rounded-md shadow border border-gray-300 max-h-48 overflow-y-auto z-[1000]">
              {filteredEnterprises.map((ent) => (
                <li
                  key={ent.id}
                  onClick={() => {
                    setSelectedEnterprise(ent);
                    setSearch("");
                    setFilteredEnterprises([]);
                  }}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {ent.name}
                </li>
              ))}
            </ul>
          )}

          {nationalRisk && admSuggestions.length > 0 && (
            <ul className="absolute top-full mt-1 left-0 right-0 bg-white rounded-md shadow border border-gray-300 max-h-48 overflow-y-auto z-[2000]">
              {admSuggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    if (foundAdms.length >= 5) {
                      setToast({ type: "warning", message: "Máximo 5 elementos permitidos" });
                      return;
                    }
                    if (!foundAdms.find((adm) => adm.id === item.id)) {
                      setFoundAdms((prev) => [...prev, { id: item.id, code: item.name }]);
                    }
                    setSearch("");
                    setAdmSuggestions([]);
                    onAdmSearch(item.name, admLevel);
                  }}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chips */}
        {farmRisk && foundFarms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {foundFarms.map((farm) => (
              <span key={farm.id} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center">
                {farm.code}
                <button
                  type="button"
                  onClick={() => setFoundFarms((prev) => prev.filter((f) => f.id !== farm.id))}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >×</button>
              </span>
            ))}
          </div>
        )}

        {enterpriseRisk && selectedEnterprise && (
          <div className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center w-fit">
            {selectedEnterprise.name}
            <button
              type="button"
              onClick={() => setSelectedEnterprise(null)}
              className="ml-2 text-red-500 hover:text-red-700 font-bold"
            >×</button>
          </div>
        )}

        {nationalRisk && foundAdms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {foundAdms.map((adm) => (
              <span key={adm.id} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center">
                {adm.code}
                <button
                  type="button"
                  onClick={() => setFoundAdms((prev) => prev.filter((a) => a.id !== adm.id))}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >×</button>
              </span>
            ))}
          </div>
        )}
      </form>

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
