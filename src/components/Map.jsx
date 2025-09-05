"use client";

import EnterpriseRiskMap from './maps/EnterpriseRiskMap';
import FarmRiskMap from './maps/FarmRiskMap';
import NationalRiskMap from './maps/NationalRiskMap';

export default function Map({ enterpriseRisk, farmRisk, nationalRisk }) {
  // Renderizar el mapa específico según las props
  if (enterpriseRisk) {
    return <EnterpriseRiskMap />;
  }
  
  if (farmRisk) {
    return <FarmRiskMap />;
  }
  
  if (nationalRisk) {
    return <NationalRiskMap />;
  }
  
  // Fallback por defecto (nacional)
  return <NationalRiskMap />;
}
