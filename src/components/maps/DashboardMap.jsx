"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import RiskDataTable from "@/components/RiskDataTable";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { fetchFarmRiskByAnalysisId } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";
import { useMapState } from "@/hooks/useMapState";
import { MapPin } from "lucide-react";
import { GeoJSON, Popup } from "react-leaflet";
import L from "leaflet";
import { RiskChip, fmtNum, fmtProp, RISK_OPTIONS, InfoTooltip, COLUMN_INFO } from "@/components/shared";
import { useLoadingState } from "@/hooks/useLoadingState";


// Risk colors
const COLOR_RISK = "#D50000";
const COLOR_OK = "#00C853";

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
  const { token } = useAuth();
  const { mapRef, handleMapCreated } = useMapState();
  const { loading, setPendingTasks } = useLoadingState();

  // Filter states
  const [risk, setRisk] = useState(RISK_OPTIONS[0]?.value || "");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  
  // Data states
  const [analysis, setAnalysis] = useState(null);

  // Table state
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedPolygons, setSelectedPolygons] = useState(new Map());
  const [recordsPerPage, setRecordsPerPage] = useState(20);

  // SIT CODE search state
  const [search, setSearch] = useState("");
  const [foundFarms, setFoundFarms] = useState([]);

  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  // Get analysis ID
  const analysisId = useMemo(() => {
    if (!analysis) return null;
    if (Array.isArray(analysis) && analysis.length > 0) {
      return analysis[0]?.id || analysis[0]?.analysis_id;
    }
    if (analysis?.id) return analysis.id;
    if (analysis?.analysis_id) return analysis.analysis_id;
    return null;
  }, [analysis]);


  // Fetch table data when analysis changes or page changes
  useEffect(() => {
    if (!token || !analysisId) return;

    const fetchData = async () => {
      setTableLoading(true);
      try {
        const result = await fetchFarmRiskByAnalysisId(
          token,
          analysisId,
          recordsPerPage,
          currentPage
        );

        if (result?.items && Array.isArray(result.items)) {
          setTableData(result.items);
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

  // Handle view on map - toggle polygon visibility
  const handleViewOnMap = useCallback((item) => {
    const farmId = item.farm_id || item.farm?.farm_id;
    
    if (selectedPolygons.has(farmId)) {
      setSelectedPolygons(prev => {
        const next = new Map(prev);
        next.delete(farmId);
        return next;
      });
      return;
    }

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

    const newPolygon = {
      farmId,
      geojson,
      extId,
      adm3Name,
      deforestation: item.deforestation?.ha || 0,
      isRisk
    };
    setSelectedPolygons(prev => new Map(prev).set(farmId, newPolygon));

    // Fly to bounds
    if (mapRef.current && geojson) {
      try {
        const allCoords = [];
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
  }, [selectedPolygons, mapRef]);

  // Table columns configuration
  const columns = useMemo(() => [
    { 
      key: "ext_id", 
      label: "SIT CODE", 
      sortable: true, 
      highlight: true,
      getValue: (row) => getItemValue(row, "ext_id"),
    },
    { 
      key: "adm3_name", 
      label: "Vereda", 
      sortable: true,
      getValue: (row) => getItemValue(row, "adm3_name"),
    },
    { 
      key: "deforestation_ha", 
      label: "Def. (ha)", 
      sortable: true,
      info: COLUMN_INFO.deforestation_ha,
      getValue: (row) => getItemValue(row, "deforestation_ha"),
      render: (val) => fmtNum(val),
    },
    { 
      key: "deforestation_prop", 
      label: "Def. (%)", 
      sortable: true,
      info: COLUMN_INFO.deforestation_pct,
      getValue: (row) => getItemValue(row, "deforestation_prop"),
      render: (val) => fmtProp(val),
    },
    { 
      key: "farming_in_ha", 
      label: "F. In (ha)", 
      sortable: true,
      info: COLUMN_INFO.frontier_in_ha,
      getValue: (row) => getItemValue(row, "farming_in_ha"),
      render: (val) => fmtNum(val),
    },
    { 
      key: "farming_in_prop", 
      label: "F. In (%)", 
      sortable: true,
      info: COLUMN_INFO.frontier_in_pct,
      getValue: (row) => getItemValue(row, "farming_in_prop"),
      render: (val) => fmtProp(val),
    },
    { 
      key: "farming_out_ha", 
      label: "F. Out (ha)", 
      sortable: true,
      info: COLUMN_INFO.frontier_out_ha,
      getValue: (row) => getItemValue(row, "farming_out_ha"),
      render: (val) => fmtNum(val),
    },
    { 
      key: "farming_out_prop", 
      label: "F. Out (%)", 
      sortable: true,
      info: COLUMN_INFO.frontier_out_pct,
      getValue: (row) => getItemValue(row, "farming_out_prop"),
      render: (val) => fmtProp(val),
    },
    { 
      key: "protected_ha", 
      label: "Prot. (ha)", 
      sortable: true,
      info: COLUMN_INFO.protected_ha,
      getValue: (row) => getItemValue(row, "protected_ha"),
      render: (val) => fmtNum(val),
    },
    { 
      key: "risk_direct", 
      label: "Alerta Directa", 
      sortable: true,
      getValue: (row) => getItemValue(row, "risk_direct"),
      render: (val) => <RiskChip hasRisk={val} title="Alerta Directa" />,
    },
    { 
      key: "risk_input", 
      label: "Alerta Entrada", 
      sortable: true,
      getValue: (row) => getItemValue(row, "risk_input"),
      render: (val) => <RiskChip hasRisk={val} title="Alerta de Entrada" />,
    },
    { 
      key: "risk_output", 
      label: "Alerta Salida", 
      sortable: true,
      getValue: (row) => getItemValue(row, "risk_output"),
      render: (val) => <RiskChip hasRisk={val} title="Alerta de Salida" />,
    },
    { 
      key: "actions", 
      label: "Acciones", 
      sortable: false,
      render: (_, row) => {
        const hasGeoJSON = !!(row.farm?.geojson || row.geojson);
        const farmId = row.farm_id || row.farm?.farm_id;
        const isVisible = selectedPolygons.has(farmId);
        return (
          <button
            onClick={() => handleViewOnMap(row)}
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
        );
      },
    },
  ], [selectedPolygons, handleViewOnMap]);

  // Sort table data: DEF_HA desc, then input alert, then output alert
  const sortedTableData = useMemo(() => {
    if (!tableData.length) return [];
    return [...tableData].sort((a, b) => {
      // First: DEF_HA descending
      const defA = Number(getItemValue(a, "deforestation_ha")) || 0;
      const defB = Number(getItemValue(b, "deforestation_ha")) || 0;
      if (defB !== defA) return defB - defA;
      
      // Second: Input alert (true first)
      const alertInputA = getItemValue(a, "risk_input") === true ? 1 : 0;
      const alertInputB = getItemValue(b, "risk_input") === true ? 1 : 0;
      if (alertInputB !== alertInputA) return alertInputB - alertInputA;
      
      // Third: Output alert (true first)
      const alertOutputA = getItemValue(a, "risk_output") === true ? 1 : 0;
      const alertOutputB = getItemValue(b, "risk_output") === true ? 1 : 0;
      return alertOutputB - alertOutputA;
    });
  }, [tableData]);

  return (
    <>
      <div id="dashboard-export">
        <div className="relative px-6 md:px-12 z-20 mb-4">
          <FilterBar
            risk={risk}
            setRisk={setRisk}
            year={year}
            setYear={setYear}
            source={source}
            setSource={setSource}
            search={search}
            setSearch={setSearch}
            enterpriseRisk={false}
            farmRisk={tableData.length > 0}
            nationalRisk={false}
            dashboardRisk={true}
            hideSearch={tableData.length === 0}
            foundFarms={foundFarms}
            setFoundFarms={setFoundFarms}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={RISK_OPTIONS}
            period={period}
            setPeriod={setPeriod}
          />

          {(loading || tableLoading) && (
            <LoadingSpinner message="Cargando datos..." />
          )}
        </div>

        {/* Table description */}
        <div className="mx-6 md:mx-12 mb-4">
          <p className="text-base font-plus-jakarta text-[#082C14] font-medium">
            Esta tabla muestra todos los predios registrados para el período seleccionado. 
            Puede ordenar por la columna que desee haciendo click en ella.
          </p>
        </div>

        {/* Results table */}
        <div className="mx-6 md:mx-12 mb-6">
          <RiskDataTable
            data={foundFarms.length > 0 
              ? sortedTableData.filter(row => {
                  const rowSitCode = getItemValue(row, "ext_id");
                  return foundFarms.some(f => f.code === rowSitCode);
                })
              : sortedTableData
            }
            columns={columns}
            getRowKey={(row, idx) => row.farm_id || row.farm?.farm_id || idx}
            emptyMessage={foundFarms.length > 0 
              ? "No se encontraron registros con los SIT CODEs especificados."
              : (analysisId 
                ? "No se encontraron registros para el análisis seleccionado."
                : "Seleccione un período para ver los datos.")}
            sortable={true}
            paginated={true}
            defaultPageSize={recordsPerPage}
            externalPage={currentPage}
            setExternalPage={setCurrentPage}
            hasMore={tableData.length === recordsPerPage}
          />
        </div>

        {/* Map section */}
        <div className="relative px-6 md:px-12 mt-8">
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
                  color: polygon.isRisk ? COLOR_RISK : COLOR_OK,
                  weight: 3,
                  fillColor: polygon.isRisk ? COLOR_RISK : COLOR_OK,
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
