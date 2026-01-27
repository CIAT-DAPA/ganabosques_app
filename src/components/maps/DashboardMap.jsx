"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { fetchFarmRiskByAnalysisId } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";
import { ChevronUp, ChevronDown, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { GeoJSON, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// CSS Classes for table
const TABLE_CSS = {
  tableContainer: "bg-white rounded-xl shadow-lg overflow-hidden mx-6 md:mx-12 mb-6",
  table: "min-w-full divide-y divide-gray-200",
  tableHeader: "bg-gray-50 border-b border-gray-200",
  th: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors",
  thActive: "px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider cursor-pointer bg-green-50",
  td: "px-4 py-3 whitespace-nowrap text-sm text-gray-700",
  tdHighlight: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
  tr: "hover:bg-gray-50 transition-colors",
  trAlt: "hover:bg-gray-50 transition-colors bg-gray-25",
  pagination: "flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200",
  paginationInfo: "text-sm text-gray-600",
  paginationButtons: "flex items-center gap-2",
  paginationButton: "px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer",
  viewMapButton: "inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm",
  badge: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
  badgeRed: "bg-red-100 text-red-800",
  badgeYellow: "bg-yellow-100 text-yellow-800",
  badgeGreen: "bg-green-100 text-green-800",
  badgeGray: "bg-gray-100 text-gray-800",
  emptyState: "flex flex-col items-center justify-center py-12 text-gray-500",
};

// Risk colors matching EnterpriseChart
const COLOR_RISK = "#D50000";   // rojo riesgo
const COLOR_OK = "#00C853";     // verde sin riesgo

// Risk chip component - matching EnterpriseChart style
function RiskChip({ hasRisk, title }) {
  const color = hasRisk ? COLOR_RISK : COLOR_OK;
  const label = hasRisk ? "Con alerta" : "Sin alerta";
  return (
    <span
      title={title}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color, color: "#fff", whiteSpace: "nowrap" }}
    >
      {label}
    </span>
  );
}

// Sort icon component
function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ChevronUp className="w-3 h-3 text-gray-300 inline ml-1" />;
  }
  return sortConfig.direction === "asc" 
    ? <ChevronUp className="w-3 h-3 text-green-600 inline ml-1" />
    : <ChevronDown className="w-3 h-3 text-green-600 inline ml-1" />;
}

// Format number with decimals
const fmtNum = (v, decimals = 2) => {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  return n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(decimals);
};

// Format proportion as percentage
const fmtProp = (v) => {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${(Number(v) * 100).toFixed(0)}%`;
};

// Table columns configuration - matching API structure
const COLUMNS = [
  { key: "ext_id", label: "ID Externo", sortable: true },
  { key: "adm3_name", label: "Vereda", sortable: true },
  { key: "deforestation_ha", label: "Def. (ha)", sortable: true },
  { key: "deforestation_prop", label: "Def. (%)", sortable: true },
  { key: "farming_in_ha", label: "F. In (ha)", sortable: true },
  { key: "farming_in_prop", label: "F. In (%)", sortable: true },
  { key: "farming_out_ha", label: "F. Out (ha)", sortable: true },
  { key: "farming_out_prop", label: "F. Out (%)", sortable: true },
  { key: "protected_ha", label: "Prot. (ha)", sortable: true },
  { key: "risk_direct", label: "Alerta Directa", sortable: true },
  { key: "risk_input", label: "Alerta Entrada", sortable: true },
  { key: "risk_output", label: "Alerta Salida", sortable: true },
  { key: "actions", label: "Acciones", sortable: false },
];

// Helper to extract data from nested API structure
const getItemValue = (item, key) => {
  switch (key) {
    case "ext_id":
      return item.farm?.ext_id?.[0]?.ext_code || "-";
    case "adm3_name":
      return item.farm?.adm3_name || "-";
    case "deforestation_ha":
      return item.deforestation?.ha;
    case "deforestation_prop":
      return item.deforestation?.prop;
    case "farming_in_ha":
      return item.farming_in?.ha;
    case "farming_in_prop":
      return item.farming_in?.prop;
    case "farming_out_ha":
      return item.farming_out?.ha;
    case "farming_out_prop":
      return item.farming_out?.prop;
    case "protected_ha":
      return item.protected?.ha;
    case "protected_prop":
      return item.protected?.prop;
    case "risk_direct":
      return item.risk_direct;
    case "risk_input":
      return item.risk_input;
    case "risk_output":
      return item.risk_output;
    case "geojson":
      return item.geojson;
    default:
      return item[key];
  }
};

export default function DashboardMap() {
  const riskOptions = useMemo(
    () => [
      { value: "annual", label: "Alerta anual" },
      { value: "cumulative", label: "Alerta acumulada" },
    ],
    []
  );

  const [risk, setRisk] = useState(riskOptions[0]?.value || "");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const mapRef = useRef();
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  // Table state
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "ext_id", direction: "asc" });
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedPolygons, setSelectedPolygons] = useState(new Map()); // Map of farmId -> polygon data
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const pageSizeOptions = [10, 20, 50];

  const { token } = useAuth();

  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  // Get the analysis ID - the hook returns an array, we need the first item's id or analysis_id
  const analysisId = useMemo(() => {
    if (!analysis) return null;
    // If analysis is an array, get the first item
    if (Array.isArray(analysis) && analysis.length > 0) {
      return analysis[0]?.id || analysis[0]?.analysis_id;
    }
    // If analysis is an object with id
    if (analysis?.id) return analysis.id;
    if (analysis?.analysis_id) return analysis.analysis_id;
    return null;
  }, [analysis]);

  // Debug log
  useEffect(() => {
    console.log("Dashboard - period:", period);
    console.log("Dashboard - analysis:", analysis);
    console.log("Dashboard - analysisId:", analysisId);
  }, [period, analysis, analysisId]);

  // Loading state
  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // Fetch table data when analysis changes or page changes
  useEffect(() => {
    if (!token || !analysisId) {
      console.log("Dashboard - skipping fetch: no token or analysisId", { token: !!token, analysisId });
      return;
    }

    const fetchData = async () => {
      setTableLoading(true);
      console.log("Dashboard - fetching data for analysisId:", analysisId, "page:", currentPage, "pageSize:", recordsPerPage);
      try {
        const result = await fetchFarmRiskByAnalysisId(
          token,
          analysisId,
          recordsPerPage,
          currentPage
        );
        console.log("Dashboard - API response:", result);

        // Handle the actual API response structure: { page, page_size, items }
        if (result?.items && Array.isArray(result.items)) {
          console.log("Dashboard - first item structure:", result.items[0]);
          console.log("Dashboard - first item.geojson:", result.items[0]?.geojson);
          console.log("Dashboard - first item.farm.geojson:", result.items[0]?.farm?.geojson);
          setTableData(result.items);
          // Use total from API if available, otherwise estimate based on full page
          const estimatedTotal = result.total || (result.items.length === recordsPerPage 
            ? currentPage * recordsPerPage + 1 
            : (currentPage - 1) * recordsPerPage + result.items.length);
          setTotal(estimatedTotal);
        } else if (Array.isArray(result)) {
          setTableData(result);
          setTotal(result.length);
        } else if (result?.data) {
          setTableData(result.data);
          setTotal(result.total || result.data.length);
        } else {
          setTableData([]);
          setTotal(0);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setTableData([]);
        setTotal(0);
      } finally {
        setTableLoading(false);
      }
    };

    fetchData();
  }, [token, analysisId, currentPage, recordsPerPage]);

  // Reset page when analysis changes
  useEffect(() => {
    setCurrentPage(1);
  }, [analysisId]);

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return tableData;
    
    return [...tableData].sort((a, b) => {
      const aVal = getItemValue(a, sortConfig.key);
      const bVal = getItemValue(b, sortConfig.key);
      
      if (aVal == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bVal == null) return sortConfig.direction === "asc" ? -1 : 1;
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [tableData, sortConfig]);

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  // Handle view on map - toggle polygon visibility
  const handleViewOnMap = useCallback((item) => {
    const farmId = item.farm_id || item.farm?.farm_id;
    
    // If already visible, remove it
    if (selectedPolygons.has(farmId)) {
      setSelectedPolygons(prev => {
        const next = new Map(prev);
        next.delete(farmId);
        return next;
      });
      return;
    }

    // GeoJSON is nested inside farm object
    const geojsonStr = item.farm?.geojson || item.geojson;
    const extId = getItemValue(item, "ext_id");
    const adm3Name = getItemValue(item, "adm3_name");
    const isRisk = item.risk_direct || item.risk_input || item.risk_output;
    
    if (!geojsonStr) {
      console.warn("No GeoJSON data for this item");
      return;
    }

    let geojson;
    try {
      geojson = typeof geojsonStr === "string" ? JSON.parse(geojsonStr) : geojsonStr;
    } catch (err) {
      console.error("Error parsing GeoJSON:", err);
      return;
    }

    // Add polygon to visible set
    const newPolygon = {
      farmId,
      geojson,
      extId,
      adm3Name,
      deforestation: item.deforestation?.ha || 0,
      isRisk
    };
    setSelectedPolygons(prev => new Map(prev).set(farmId, newPolygon));

    // Calculate bounds and fly to them
    if (mapRef.current && geojson) {
      try {
        const allCoords = [];
        
        // Extract coordinates from GeoJSON
        const extractCoords = (feature) => {
          if (feature.geometry?.type === "Polygon") {
            feature.geometry.coordinates[0]?.forEach(([lon, lat]) => {
              allCoords.push([lat, lon]);
            });
          } else if (feature.geometry?.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon[0]?.forEach(([lon, lat]) => {
                allCoords.push([lat, lon]);
              });
            });
          }
        };

        if (geojson.type === "FeatureCollection") {
          geojson.features?.forEach(extractCoords);
        } else if (geojson.type === "Feature") {
          extractCoords(geojson);
        }

        if (allCoords.length > 0) {
          const bounds = L.latLngBounds(allCoords);
          mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
        }
      } catch (err) {
        console.error("Error calculating bounds:", err);
      }
    }
  }, [selectedPolygons]);

  // Pagination calculations
  const totalPages = Math.ceil(total / recordsPerPage);
  const startRecord = total > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0;
  const endRecord = Math.min(currentPage * recordsPerPage, total);

  return (
    <>
      <div id="dashboard-export">
        <div className="relative px-6 md:px-12">
          <FilterBar
            risk={risk}
            setRisk={setRisk}
            year={year}
            setYear={setYear}
            source={source}
            setSource={setSource}
            search=""
            setSearch={() => {}}
            enterpriseRisk={false}
            farmRisk={false}
            nationalRisk={false}
            dashboardRisk={true}
            hideSearch={true}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={riskOptions}
            period={period}
            setPeriod={setPeriod}
          />

          {(loading || tableLoading) && (
            <LoadingSpinner message="Cargando datos..." />
          )}

          <RiskLegend
            enterpriseRisk={false}
            farmRisk={false}
            nationalRisk={true}
          />

          <BaseMap
            onMapCreated={handleMapCreated}
            showDeforestation={true}
            period={period}
            source={source}
            risk={risk}
          >
            {/* GeoJSON polygons for selected farms */}
            {Array.from(selectedPolygons.values()).map((polygon) => (
              <GeoJSON
                key={`farm-${polygon.farmId}`}
                data={polygon.geojson}
                style={{
                  color: polygon.isRisk ? "#D50000" : "#00C853",
                  weight: 3,
                  fillColor: polygon.isRisk ? "#D50000" : "#00C853",
                  fillOpacity: 0.3,
                }}
              >
                <Popup>
                  <div className="p-2 text-sm space-y-1">
                    <div className="font-semibold text-green-700">Finca</div>
                    <div>
                      <span className="font-medium">Ext ID:</span> {polygon.extId}
                    </div>
                    <div>
                      <span className="font-medium">Vereda:</span> {polygon.adm3Name}
                    </div>
                    <div>
                      <span className="font-medium">Deforestación:</span> {Number(polygon.deforestation).toFixed(2)} ha
                    </div>
                    <div>
                      <span className="font-medium">Alerta:</span>{" "}
                      {polygon.isRisk ? "Con alerta" : "Sin alerta"}
                    </div>
                  </div>
                </Popup>
              </GeoJSON>
            ))}
          </BaseMap>
        </div>

        {/* Descripción de la tabla */}
        <div className="mx-6 md:mx-12 mt-8 mb-4">
          <p className="text-base font-plus-jakarta text-[#082C14] font-medium">
            Esta tabla muestra todos los predios registrados para el período seleccionado. 
            Puede ordenar por la columna que desee haciendo click en ella.
          </p>
        </div>

        {/* Tabla de resultados */}
        <div className={TABLE_CSS.tableContainer}>
          {sortedData.length === 0 && !tableLoading ? (
            <div className={TABLE_CSS.emptyState}>
              <p className="text-gray-500">
                {analysisId 
                  ? "No se encontraron registros para el análisis seleccionado."
                  : "Seleccione un período para ver los datos."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className={TABLE_CSS.table}>
                  <thead className={TABLE_CSS.tableHeader}>
                    <tr>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className={sortConfig.key === col.key ? TABLE_CSS.thActive : TABLE_CSS.th}
                          onClick={() => col.sortable && handleSort(col.key)}
                        >
                          <span className="flex items-center">
                            {col.label}
                            {col.sortable && <SortIcon column={col.key} sortConfig={sortConfig} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedData.map((item, index) => {
                      const hasGeoJSON = !!(item.farm?.geojson || item.geojson);
                      const farmId = item.farm_id || item.farm?.farm_id;
                      const isVisible = selectedPolygons.has(farmId);
                      return (
                        <tr key={farmId || index} className={index % 2 === 0 ? TABLE_CSS.tr : TABLE_CSS.trAlt}>
                          <td className={TABLE_CSS.tdHighlight}>{getItemValue(item, "ext_id")}</td>
                          <td className={TABLE_CSS.td}>{getItemValue(item, "adm3_name")}</td>
                          <td className={TABLE_CSS.td}>{fmtNum(getItemValue(item, "deforestation_ha"))}</td>
                          <td className={TABLE_CSS.td}>{fmtProp(getItemValue(item, "deforestation_prop"))}</td>
                          <td className={TABLE_CSS.td}>{fmtNum(getItemValue(item, "farming_in_ha"))}</td>
                          <td className={TABLE_CSS.td}>{fmtProp(getItemValue(item, "farming_in_prop"))}</td>
                          <td className={TABLE_CSS.td}>{fmtNum(getItemValue(item, "farming_out_ha"))}</td>
                          <td className={TABLE_CSS.td}>{fmtProp(getItemValue(item, "farming_out_prop"))}</td>
                          <td className={TABLE_CSS.td}>{fmtNum(getItemValue(item, "protected_ha"))}</td>
                          <td className={TABLE_CSS.td}>
                            <RiskChip hasRisk={getItemValue(item, "risk_direct")} title="Alerta Directa" />
                          </td>
                          <td className={TABLE_CSS.td}>
                            <RiskChip hasRisk={getItemValue(item, "risk_input")} title="Alerta de Entrada" />
                          </td>
                          <td className={TABLE_CSS.td}>
                            <RiskChip hasRisk={getItemValue(item, "risk_output")} title="Alerta de Salida" />
                          </td>
                          <td className={TABLE_CSS.td}>
                            <button
                              onClick={() => handleViewOnMap(item)}
                              disabled={!hasGeoJSON}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer ${
                                isVisible 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-green-600 hover:bg-green-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={hasGeoJSON ? (isVisible ? "Quitar del mapa" : "Ver en mapa") : "Sin geometría"}
                            >
                              <MapPin className="w-3 h-3" />
                              {isVisible ? "Quitar" : "Ver"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={TABLE_CSS.pagination}>
                <div className="flex items-center gap-4">
                  <div className={TABLE_CSS.paginationInfo}>
                    Mostrando <span className="font-medium">{startRecord}</span> a{" "}
                    <span className="font-medium">{endRecord}</span> de{" "}
                    <span className="font-medium">{total}</span> registros
                  </div>
                  <select
                    value={recordsPerPage}
                    onChange={(e) => {
                      setRecordsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    {pageSizeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt} por página</option>
                    ))}
                  </select>
                </div>
                <div className={TABLE_CSS.paginationButtons}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={TABLE_CSS.paginationButton}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {/* Page numbers */}
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                            currentPage === i
                              ? 'bg-green-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className={TABLE_CSS.paginationButton}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Download PDF Button */}
      {tableData.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-4 mb-8 flex justify-end">
          <DownloadPdfButton
            targetId="dashboard-export"
            filename="dashboard_alertas.pdf"
            label="Descargar (PDF)"
          />
        </div>
      )}
    </>
  );
}
