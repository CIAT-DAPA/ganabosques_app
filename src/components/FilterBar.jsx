'use client';

import { useEffect, useState } from 'react';

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
  farmRisk = false
}) {
  const [yearRanges, setYearRanges] = useState([]);

  const getRiskLabel = () => {
    if (farmRisk) return 'Modalidad';
    return 'Riesgo';
  };

  const getRiskOptions = () => {
    if (enterpriseRisk) {
      return [{ value: 'risk_total', label: 'Riesgo Total' }];
    }

    if (farmRisk) {
      return [
        { value: 'risk_direct', label: 'Riesgo Directo' },
        { value: 'risk_total', label: 'Riesgo Total' }
      ];
    }

    return [
      { value: 'total', label: 'Riesgo Total' },
      { value: 'parcial', label: 'Riesgo Directo' }
    ];
  };

  useEffect(() => {
    async function fetchYearRanges() {
      try {
        const res = await fetch('http://127.0.0.1:8000/deforestation/');
        const data = await res.json();
        setYearRanges(data);
      } catch (err) {
        console.error('Error fetching year ranges:', err);
      }
    }

    fetchYearRanges();
  }, []);

  const selectStyle =
    'appearance-none bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-full py-2 px-4 pr-8 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  const icon = (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="absolute top-4 left-[88px] right-4 z-[1000] flex gap-4 items-center">
      {/* Risk selector */}
      <div className="relative">
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className={selectStyle}>
          <option value="">{getRiskLabel()}</option>
          {getRiskOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {icon}
      </div>

      {/* Year range selector */}
      <div className="relative">
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectStyle}>
          <option value="">Año</option>
          {yearRanges.map((item) => (
            <option key={item.id} value={item.id}>
              {item.year_start} - {item.year_end}
            </option>
          ))}
        </select>
        {icon}
      </div>

      {/* Source selector */}
      <div className="relative">
        <select value={source} onChange={(e) => setSource(e.target.value)} className={selectStyle}>
          <option value="">Fuente</option>
          <option value="smbyc">SMBYC</option>
        </select>
        {icon}
      </div>

      {/* Search bar */}
      <form
        onSubmit={onSearch}
        className="flex items-center flex-grow bg-white rounded-full shadow-md overflow-hidden border border-gray-300 min-w-[200px]"
      >
        <input
          type="text"
          placeholder="Buscar empresa"
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
      </form>
    </div>
  );
}
