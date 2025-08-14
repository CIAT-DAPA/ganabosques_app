import { useMap, useMapEvents } from "react-leaflet";
import axios from "axios";
import L from "leaflet";

function ClickAdm3({ adm3Details, adm3Risk, onAreaClick }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const rawUrl = getFeatureInfoUrl(
        map,
        "https://ganageo.alliance.cgiar.org/geoserver/wms",
        "administrative:admin_3",
        e.latlng,
        {
          info_format: "application/json",
          propertyName: "cod_ver",
        }
      );

      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;

      axios.get(proxiedUrl)
        .then((res) => {
          console.log("Respuesta GeoServer:", res.data);
          const feature = res.data.features?.[0];
          if (!feature) {
            console.warn("No se encontró ninguna feature en esa zona.");
            return;
          }

          const cod_ver = feature.properties.cod_ver;
          console.log("cod_ver encontrado:", cod_ver);

          const detail = adm3Details.find((d) => d.ext_id === cod_ver);
          if (!detail) {
            console.warn("No se encontró adm3Detail con ext_id:", cod_ver);
            return;
          }

          const riskArray = Object.values(adm3Risk ?? {}).flat();
          const riskData = riskArray.find((r) => r.adm3_id === detail.id);
          if (!riskData) {
            console.warn("No se encontró riesgo para adm3_id:", detail.id);
            return;
          }

          console.log("Llamando onAreaClick con:", detail, riskData, e.latlng);
          onAreaClick(detail, riskData, e.latlng);
        })
        .catch((err) => {
          console.error("Error al contactar GeoServer:", err.message);
        });
    },
  });

  return null;
}

function getFeatureInfoUrl(map, baseUrl, layerName, latlng, extraParams = {}) {
  const point = map.latLngToContainerPoint(latlng, map.getZoom());
  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const defaultParams = {
    SERVICE: "WMS",
    VERSION: "1.1.1",
    REQUEST: "GetFeatureInfo",
    FORMAT: "image/png",
    TRANSPARENT: "true",
    LAYERS: layerName,
    QUERY_LAYERS: layerName,
    STYLES: "",
    SRS: "EPSG:4326",
    BBOX: [sw.lng, sw.lat, ne.lng, ne.lat].join(","),
    WIDTH: size.x,
    HEIGHT: size.y,
    INFO_FORMAT: "application/json",
  };

  const is130 = defaultParams.VERSION === "1.3.0";
  defaultParams[is130 ? "I" : "X"] = Math.floor(point.x);
  defaultParams[is130 ? "J" : "Y"] = Math.floor(point.y);

  const params = L.extend(defaultParams, extraParams || {});
  return baseUrl + L.Util.getParamString(params, baseUrl, true);
}

export default ClickAdm3;
