"use client";

import { useRef } from "react";
import { WMSTileLayer, useMapEvent } from "react-leaflet";

export default function NationalRiskLayers({ 
  foundAdms, 
  adm3Details, 
  adm3Risk, 
  setPopupData, 
  yearStart 
}) {
  // Handler de clicks WMS
  function WMSRiskClickHandler({ adm3Risk, adm3Details, showPopup }) {
    const activeReq = useRef(0);

    useMapEvent("click", async (e) => {
      const reqId = ++activeReq.current;

      const map = e.target;
      const { lat, lng } = e.latlng;

      const bbox = map.getBounds().toBBoxString();
      const size = map.getSize();
      const point = map.latLngToContainerPoint(e.latlng);

      const params = new URLSearchParams({
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetFeatureInfo",
        FORMAT: "image/png",
        TRANSPARENT: "true",
        QUERY_LAYERS: "administrative:admin_3",
        LAYERS: "administrative:admin_3",
        STYLES: "",
        SRS: "EPSG:4326",
        BBOX: bbox,
        WIDTH: size.x,
        HEIGHT: size.y,
        X: Math.floor(point.x),
        Y: Math.floor(point.y),
        INFO_FORMAT: "application/json",
      });

      const rawUrl = `https://ganageo.alliance.cgiar.org/geoserver/administrative/wms?${params.toString()}`;
      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;

      try {
        const response = await fetch(proxiedUrl);
        if (activeReq.current !== reqId) return;

        const data = await response.json();
        const cod_ver = data?.features?.[0]?.properties?.cod_ver;

        if (!cod_ver) {
          showPopup(null);
          return;
        }

        const detail = adm3Details.find((d) => d.ext_id === cod_ver);
        if (!detail) {
          showPopup(null);
          return;
        }

        const riskArray = Object.values(adm3Risk).flat();
        const riskData = riskArray.find((r) => r.adm3_id === detail.id);
        if (!riskData) {
          showPopup(null);
          return;
        }

        showPopup({ lat, lng, detail, riskData });
      } catch (err) {
        console.error("Error al hacer GetFeatureInfo:", err);
        showPopup(null);
      }
    });

    return null;
  }

  return (
    <>
      {/* Capas de riesgo por veredas */}
      {foundAdms &&
        foundAdms.length > 0 &&
        adm3Details.map((detail) => {
          const riskArray = Object.values(adm3Risk || {}).flat();
          const riskData = riskArray.find((r) => r.adm3_id === detail.id);
          if (!riskData) return null;
          const riskVal = riskData.risk_total;

          let styleName = "norisk";
          if (riskVal > 2.5) styleName = "hightrisk";
          else if (riskVal > 1.5) styleName = "mediumrisk";
          else if (riskVal > 0) styleName = "lowrisk";

          return (
            <WMSTileLayer
              key={detail.ext_id}
              url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
              layers="administrative:admin_3"
              format="image/png"
              transparent={true}
              cql_filter={`cod_ver='${detail.ext_id}'`}
              styles={styleName}
              zIndex={10000}
            />
          );
        })}

      {/* Handler de clicks para mostrar popups */}
      {adm3Risk && adm3Details?.length > 0 && foundAdms?.length > 0 && (
        <WMSRiskClickHandler
          adm3Risk={adm3Risk}
          adm3Details={adm3Details}
          showPopup={setPopupData}
        />
      )}
    </>
  );
}
