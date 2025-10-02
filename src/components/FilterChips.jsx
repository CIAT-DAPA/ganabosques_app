"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function FilterChips({
  farmRisk = false,
  enterpriseRisk = false,
  nationalRisk = false,
  foundFarms = [],
  setFoundFarms,
  selectedEnterprise,
  setSelectedEnterprise,
  foundAdms = [],
  setFoundAdms,
}) {
  const handleRemoveFarm = (farmCode) => {
    setFoundFarms(prev => prev.filter(f => f.code !== farmCode));
  };

  const handleRemoveEnterprise = () => {
    setSelectedEnterprise(null);
  };

  const handleRemoveAdm = (admId) => {
    setFoundAdms(prev => prev.filter(a => a.id !== admId));
  };

  const chipBaseClasses = "bg-custom text-custom-dark px-3 py-1 rounded-full text-sm flex items-center shadow-md hover:cursor-pointer transition-colors duration-200 hover:bg-gray-100";

  return (
    <div className="flex flex-col gap-2">
      {/* Chips SIT_CODE para Farm Risk */}
      {farmRisk && foundFarms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {foundFarms.map((farm) => (
            <button
              key={farm.id || farm.code}
              type="button"
              onClick={() => handleRemoveFarm(farm.code)}
              className={chipBaseClasses}
              aria-label={`Remover finca ${farm.code}`}
            >
              <span className="me-2">{farm.code}</span>
              <FontAwesomeIcon
                icon={faXmark}
                className="text-[#082C14]"
                size="sm"
              />
            </button>
          ))}
        </div>
      )}

      {/* Chip empresa seleccionada para Enterprise Risk */}
      {/* Chips de empresas seleccionadas para Enterprise Risk */}
{enterpriseRisk && Array.isArray(selectedEnterprise) && selectedEnterprise.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {selectedEnterprise.map((ent) => (
      <button
        key={ent.id}
        type="button"
        onClick={() =>
          setSelectedEnterprise((prev) => prev.filter((e) => e.id !== ent.id))
        }
        className={chipBaseClasses}
        aria-label={`Remover empresa ${ent.name}`}
      >
        <span className="me-2">{ent.name}</span>
        <FontAwesomeIcon
          icon={faXmark}
          className="text-[#082C14]"
          size="sm"
        />
      </button>
    ))}
  </div>
)}

      {/* Chips ADM seleccionados para National Risk */}
      {nationalRisk && foundAdms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {foundAdms.map((adm) => (
            <button
              key={adm.id}
              type="button"
              onClick={() => handleRemoveAdm(adm.id)}
              className={chipBaseClasses}
              aria-label={`Remover región ${adm.adm3name}`}
            >
              <span className="me-2">{adm.adm3name}</span>
              <FontAwesomeIcon
                icon={faXmark}
                className="text-[#082C14]"
                size="sm"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
