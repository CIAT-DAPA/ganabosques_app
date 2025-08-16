import { useEffect, useState } from "react";

export function useFilteredMovement(originalMovement, yearStart) {
  const [filteredMovement, setFilteredMovement] = useState({});

  useEffect(() => {
    if (!yearStart || !originalMovement) return;

    const yearKey = String(yearStart);
    const filtered = {};

    Object.entries(originalMovement).forEach(([farmId, data]) => {
      const inputStats = data.inputs?.statistics?.[yearKey];
      const outputStats = data.outputs?.statistics?.[yearKey];

      const involvedInputFarms = inputStats?.farms?.map(String) || [];
      const involvedInputEnterprises = inputStats?.enterprises?.map(String) || [];

      const involvedOutputFarms = outputStats?.farms?.map(String) || [];
      const involvedOutputEnterprises = outputStats?.enterprises?.map(String) || [];

      const filteredInputs = {
        ...data.inputs,
        statistics: {
          [yearKey]: inputStats,
        },
        farms:
          data.inputs.farms?.filter(Boolean)?.filter((f) =>
            involvedInputFarms.includes(String(f.destination?.farm_id))
          ) || [],
        enterprises:
          data.inputs.enterprises?.filter(Boolean)?.filter((e) =>
            involvedInputEnterprises.includes(String(e.destination?._id))
          ) || [],
      };

      const filteredOutputs = {
        ...data.outputs,
        statistics: {
          [yearKey]: outputStats,
        },
        farms:
          data.outputs.farms?.filter(Boolean)?.filter((f) =>
            involvedOutputFarms.includes(String(f.destination?.farm_id))
          ) || [],
        enterprises:
          data.outputs.enterprises?.filter(Boolean)?.filter((e) =>
            involvedOutputEnterprises.includes(String(e.destination?._id))
          ) || [],
      };

      const filteredMixed = {
        [yearKey]: data.mixed?.[yearKey] || {},
      };

      filtered[farmId] = {
        ...data,
        inputs: filteredInputs,
        outputs: filteredOutputs,
        mixed: filteredMixed,
      };
    });

    setFilteredMovement(filtered);
  }, [yearStart, originalMovement]);

  return filteredMovement;
}
