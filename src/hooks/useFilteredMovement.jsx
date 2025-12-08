import { useEffect, useState } from "react";

export function useFilteredMovement(originalMovement, yearStart, yearEnd, risk) {
  const [filteredMovement, setFilteredMovement] = useState({});

  useEffect(() => {
    if (!originalMovement) {
      setFilteredMovement({});
      return;
    }

    const baseDate =
      risk === "cumulative" ? (yearEnd ?? yearStart) : (yearStart ?? yearEnd);

    if (!baseDate) { setFilteredMovement({}); return; }

    const year = new Date(baseDate).getFullYear();
    if (Number.isNaN(year)) { setFilteredMovement({}); return; }

    const yearKey = String(year);

    // Helpers SOLO acumulado
    const parseYear = (v) => {
      if (v == null) return NaN;
      if (typeof v === "number" && v >= 1000 && v <= 9999) return v;
      if (typeof v === "string" && /^\d{4}$/.test(v.trim())) return Number(v.trim());
      const d = new Date(v); const y = d.getFullYear();
      return Number.isNaN(y) ? NaN : y;
    };

    const getYearRange = (ys, ye) => {
      const a = parseYear(ys ?? ye);
      const b = parseYear(ye ?? ys);
      if (Number.isNaN(a) || Number.isNaN(b)) return [yearKey];
      const start = Math.min(a, b), end = Math.max(a, b);
      const arr = []; for (let y = start; y <= end; y++) arr.push(String(y));
      return arr;
    };

    const uniq = (arr) => Array.from(new Set((arr || []).map(String)));
    const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

    // 🔧 FIX: mergeSpecies que conserva subcategorías (deep-merge)
    const mergeSpecies = (speciesList) => {
      const list = (speciesList || []).filter(Boolean);
      if (!list.length) return undefined;

      // Caso ARRAY de items (lo mantenemos como antes)
      if (Array.isArray(list[0])) {
        const map = new Map();
        for (const arr of list) {
          if (!Array.isArray(arr)) continue;
          for (const item of arr) {
            if (!item) continue;
            const key = String(
              item?.subcategory ?? item?.name ?? item?.species_name ??
              item?.category ?? item?._id ?? item?.id ?? item?.species_id ?? JSON.stringify(item)
            );
            const prev = map.get(key) || {};
            const merged = { ...prev, ...item };
            for (const [k, v] of Object.entries(item)) {
              if (typeof v === "number") merged[k] = (typeof prev[k] === "number" ? prev[k] : 0) + v;
            }
            map.set(key, merged);
          }
        }
        return Array.from(map.values());
      }

      // Caso OBJETO: { Grupo: { Subcat: { headcount,... } } }
      if (isPlainObject(list[0])) {
        const out = {};
        for (const obj of list) {
          if (!isPlainObject(obj)) continue;
          for (const [group, sub] of Object.entries(obj)) {
            // sub puede ser número o un objeto de subcategorías
            if (typeof sub === "number") {
              out[group] = (typeof out[group] === "number" ? out[group] + sub : (out[group] || 0) + sub);
              continue;
            }
            if (!isPlainObject(sub)) continue;
            out[group] = out[group] || {};
            for (const [subcat, values] of Object.entries(sub)) {
              if (!isPlainObject(values)) continue;
              const dst = out[group][subcat] || {};
              for (const [k, v] of Object.entries(values)) {
                dst[k] = typeof v === "number"
                  ? ((typeof dst[k] === "number" ? dst[k] : 0) + v)
                  : v; // último no numérico gana
              }
              out[group][subcat] = dst;
            }
          }
        }
        return out; // <- mantiene la forma anidada
      }

      // Fallback
      return list[list.length - 1];
    };

    const mergeStats = (statsList) => {
      const farms = uniq(statsList.flatMap(s => (s?.farms || []).map(String)));
      const enterprises = uniq(statsList.flatMap(s => (s?.enterprises || []).map(String)));
      const species = mergeSpecies(statsList.map(s => s?.species));
      const lastNonNull = [...statsList].reverse().find(s => s && typeof s === "object") || {};
      const merged = { ...lastNonNull, farms, enterprises };
      if (species !== undefined) merged.species = species;
      return merged;
    };

    const mergeMixed = (mixedObj, years) => {
      if (!mixedObj) return {};
      const acc = {};
      years.forEach(y => {
        const v = mixedObj?.[y];
        if (v && typeof v === "object") for (const [k, val] of Object.entries(v)) acc[k] = val;
      });
      return acc;
    };

    const collectInvolved = (statsByYear, years, field) => {
      const all = [];
      for (const y of years) {
        const s = statsByYear?.[y];
        if (s && Array.isArray(s[field])) all.push(...s[field].map(String));
      }
      return uniq(all);
    };

    const filtered = {};

    Object.entries(originalMovement).forEach(([farmId, data]) => {
      const yearsToUse = [yearKey];

      const finalYearKey = (risk === "cumulative" && yearsToUse.length)
        ? yearsToUse[yearsToUse.length - 1]
        : yearKey;

      const inputStatsList = yearsToUse.map(y => data?.inputs?.statistics?.[y]).filter(Boolean);
      const inputStatsMerged = risk === "cumulative"
        ? (inputStatsList.length ? mergeStats(inputStatsList) : {})
        : data?.inputs?.statistics?.[yearKey];

      const involvedInputFarms = risk === "cumulative"
        ? collectInvolved(data?.inputs?.statistics, yearsToUse, 'farms')
        : (inputStatsMerged?.farms?.map(String) || data?.inputs?.statistics?.[yearKey]?.farms?.map(String) || []);

      const involvedInputEnterprises = risk === "cumulative"
        ? collectInvolved(data?.inputs?.statistics, yearsToUse, 'enterprises')
        : (inputStatsMerged?.enterprises?.map(String) || data?.inputs?.statistics?.[yearKey]?.enterprises?.map(String) || []);

      const filteredInputs = {
        ...data?.inputs,
        statistics: { [finalYearKey]: inputStatsMerged },
        farms: (data?.inputs?.farms || [])
          ?.filter(Boolean)
          ?.filter(f => involvedInputFarms.includes(String(f?.destination?.farm_id))) || [],
        enterprises: (data?.inputs?.enterprises || [])
          ?.filter(Boolean)
          ?.filter(e => involvedInputEnterprises.includes(String(e?.destination?._id))) || [],
      };

      const outputStatsList = yearsToUse.map(y => data?.outputs?.statistics?.[y]).filter(Boolean);
      const outputStatsMerged = risk === "cumulative"
        ? (outputStatsList.length ? mergeStats(outputStatsList) : {})
        : data?.outputs?.statistics?.[yearKey];

      const involvedOutputFarms = risk === "cumulative"
        ? collectInvolved(data?.outputs?.statistics, yearsToUse, 'farms')
        : (outputStatsMerged?.farms?.map(String) || data?.outputs?.statistics?.[yearKey]?.farms?.map(String) || []);

      const involvedOutputEnterprises = risk === "cumulative"
        ? collectInvolved(data?.outputs?.statistics, yearsToUse, 'enterprises')
        : (outputStatsMerged?.enterprises?.map(String) || data?.outputs?.statistics?.[yearKey]?.enterprises?.map(String) || []);

      const filteredMixed = {
        [finalYearKey]: risk === "cumulative"
          ? mergeMixed(data?.mixed, yearsToUse)
          : (data?.mixed?.[finalYearKey] || {}),
      };

      filtered[farmId] = {
        ...data,
        inputs: filteredInputs,
        outputs: {
          ...data?.outputs,
          statistics: { [finalYearKey]: outputStatsMerged },
          farms: (data?.outputs?.farms || [])
            ?.filter(Boolean)
            ?.filter(f => involvedOutputFarms.includes(String(f?.destination?.farm_id))) || [],
          enterprises: (data?.outputs?.enterprises || [])
            ?.filter(Boolean)
            ?.filter(e => involvedOutputEnterprises.includes(String(e?.destination?._id))) || [],
        },
        mixed: filteredMixed,
      };
    });

    setFilteredMovement(filtered);
  }, [originalMovement, yearStart, yearEnd, risk]);

  return filteredMovement;
}