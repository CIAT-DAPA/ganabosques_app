import {
  fetchEnterprises, searchEnterprisesByName, getEnterpriseRiskDetails,
  fetchAnalysisYearRanges, fetchYearRanges, fetchFarmBySITCode,
  fetchFarmPolygonsByIds, fetchFarmRiskByAnalysisAndFarm,
  fetchFarmRiskByDeforestationId, fetchFarmRiskByAnalysisId,
  fetchMovementStatisticsByFarmIds, fetchMovementStatisticsByEnterpriseIds,
  searchAdmByName, fetchAdm3DetailsByIds, fetchAdm3RisksByAnalysisAndAdm3,
  fetchAdm3RiskByAdm3AndType, fetchRiskGlobal, fetchSuppliersByEnterpriseIds,
  fetchEnums,
} from "../apiService";

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.restoreAllMocks(); });

function mockFetchOk(data) {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
}

function mockFetchError(status = 500, detail = null) {
  global.fetch.mockResolvedValueOnce({
    ok: false, status, json: async () => (detail ? { detail } : {}),
  });
}

const TOKEN = "test-token-123";

describe("fetchEnterprises", () => {
  it("calls the enterprise endpoint and returns data", async () => {
    const data = [{ id: 1, name: "Empresa A" }];
    mockFetchOk(data);
    const result = await fetchEnterprises(TOKEN);
    expect(result).toEqual(data);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("enterprise/"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      })
    );
  });

  it("throws on error response", async () => {
    mockFetchError(500, "Server error");
    await expect(fetchEnterprises(TOKEN)).rejects.toThrow("Error al cargar empresas");
  });
});

describe("searchEnterprisesByName", () => {
  it("searches by name", async () => {
    mockFetchOk([{ id: 1, name: "Test" }]);
    const result = await searchEnterprisesByName(TOKEN, "Test");
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("enterprise/by-name?name=Test"), expect.any(Object)
    );
  });

  it("includes value_chain when provided", async () => {
    mockFetchOk([]);
    await searchEnterprisesByName(TOKEN, "Test", "ganaderia");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("value_chain=livestock"), expect.any(Object)
    );
  });

  it("encodes name with special characters", async () => {
    mockFetchOk([]);
    await searchEnterprisesByName(TOKEN, "José & Co.");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("Jos%C3%A9%20%26%20Co."), expect.any(Object)
    );
  });
});

describe("getEnterpriseRiskDetails", () => {
  it("posts with analysis_id and enterprise_ids", async () => {
    mockFetchOk({ risk: "high" });
    const result = await getEnterpriseRiskDetails(TOKEN, 1, [10, 20]);
    expect(result).toEqual({ risk: "high" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("enterprise-risk/details/by-enterprise"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("fetchAnalysisYearRanges", () => {
  it("fetches and filters by source and type", async () => {
    const data = [
      { id: 1, deforestation_source: "smbyc", deforestation_type: "annual" },
      { id: 2, deforestation_source: "other", deforestation_type: "annual" },
    ];
    mockFetchOk(data);
    const result = await fetchAnalysisYearRanges(TOKEN, "smbyc", "annual");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("returns all items when source and type are null", async () => {
    mockFetchOk([{ id: 1 }, { id: 2 }]);
    const result = await fetchAnalysisYearRanges(TOKEN, null, null);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when response is not array", async () => {
    mockFetchOk({ message: "not an array" });
    const result = await fetchAnalysisYearRanges(TOKEN, null, null);
    expect(result).toEqual([]);
  });

  it("includes value_chain in endpoint when provided", async () => {
    mockFetchOk([]);
    await fetchAnalysisYearRanges(TOKEN, null, null, "ganaderia");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("analysis/?value_chain=livestock"), expect.any(Object)
    );
  });
});

describe("fetchYearRanges", () => {
  it("fetches and filters by source and type", async () => {
    const data = [
      { deforestation_source: "smbyc", deforestation_type: "cumulative" },
      { deforestation_source: "smbyc", deforestation_type: "annual" },
    ];
    mockFetchOk(data);
    const result = await fetchYearRanges(TOKEN, "smbyc", "cumulative");
    expect(result).toHaveLength(1);
  });

  it("returns empty array for non-array response", async () => {
    mockFetchOk("invalid");
    const result = await fetchYearRanges(TOKEN, null, null);
    expect(result).toEqual([]);
  });
});

describe("fetchFarmBySITCode", () => {
  it("uses SIT_CODE as default label", async () => {
    mockFetchOk([]);
    await fetchFarmBySITCode(TOKEN, "ABC123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("labels=SIT_CODE"), expect.any(Object)
    );
  });

  it("uses custom label when provided", async () => {
    mockFetchOk([]);
    await fetchFarmBySITCode(TOKEN, "ABC123", null, "GEOFARMER_ID");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("labels=GEOFARMER_ID"), expect.any(Object)
    );
  });

  it("includes value_chain when provided", async () => {
    mockFetchOk([]);
    await fetchFarmBySITCode(TOKEN, "ABC", "cacao");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("value_chain=cacao"), expect.any(Object)
    );
  });
});

describe("fetchFarmPolygonsByIds", () => {
  it("returns empty array for empty/null ids", async () => {
    expect(await fetchFarmPolygonsByIds(TOKEN, null)).toEqual([]);
    expect(await fetchFarmPolygonsByIds(TOKEN, [])).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches polygons for valid ids", async () => {
    mockFetchOk([{ id: 1, geometry: {} }]);
    const result = await fetchFarmPolygonsByIds(TOKEN, [1, 2]);
    expect(result).toHaveLength(1);
  });
});

describe("fetchFarmRiskByAnalysisAndFarm", () => {
  it("returns empty array when analysisId is falsy", async () => {
    expect(await fetchFarmRiskByAnalysisAndFarm(TOKEN, null, [1])).toEqual([]);
  });
  it("returns empty array when farmIds is empty", async () => {
    expect(await fetchFarmRiskByAnalysisAndFarm(TOKEN, 1, [])).toEqual([]);
  });
  it("returns empty array when farmIds is not array", async () => {
    expect(await fetchFarmRiskByAnalysisAndFarm(TOKEN, 1, "not-array")).toEqual([]);
  });
  it("posts to correct endpoint with valid params", async () => {
    mockFetchOk([{ risk: true }]);
    const result = await fetchFarmRiskByAnalysisAndFarm(TOKEN, 1, [10, 20]);
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("farmrisk/by-analysis-and-farm"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("fetchFarmRiskByDeforestationId", () => {
  it("returns empty array when deforestationId is falsy", async () => {
    expect(await fetchFarmRiskByDeforestationId(TOKEN, null)).toEqual([]);
    expect(await fetchFarmRiskByDeforestationId(TOKEN, "")).toEqual([]);
  });
  it("fetches for valid deforestationId", async () => {
    mockFetchOk([{ id: 1 }]);
    const result = await fetchFarmRiskByDeforestationId(TOKEN, 5);
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("analysis/by-deforestation?deforestation_id=5"),
      expect.any(Object)
    );
  });
});

describe("fetchFarmRiskByAnalysisId", () => {
  it("returns default structure when analysisId is falsy", async () => {
    const result = await fetchFarmRiskByAnalysisId(TOKEN, null);
    expect(result).toEqual({ items: [], page: 1, page_size: 20 });
  });
  it("fetches with default pagination", async () => {
    mockFetchOk({ items: [{ id: 1 }], page: 1, page_size: 20 });
    const result = await fetchFarmRiskByAnalysisId(TOKEN, 1);
    expect(result.items).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("page_size=20"), expect.any(Object)
    );
  });
  it("supports custom pagination", async () => {
    mockFetchOk({ items: [], page: 2, page_size: 50 });
    await fetchFarmRiskByAnalysisId(TOKEN, 1, 50, 2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2&page_size=50"), expect.any(Object)
    );
  });
});

describe("fetchMovementStatisticsByFarmIds", () => {
  it("returns empty object for empty ids", async () => {
    expect(await fetchMovementStatisticsByFarmIds(TOKEN, [])).toEqual({});
    expect(await fetchMovementStatisticsByFarmIds(TOKEN, null)).toEqual({});
  });
  it("fetches with dates when provided", async () => {
    mockFetchOk({ farm1: {} });
    await fetchMovementStatisticsByFarmIds(TOKEN, [1, 2], "2020-01-01", "2021-12-31");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("start_date=2020-01-01"), expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("end_date=2021-12-31"), expect.any(Object)
    );
  });
});

describe("fetchMovementStatisticsByEnterpriseIds", () => {
  it("returns empty object for empty ids", async () => {
    expect(await fetchMovementStatisticsByEnterpriseIds(TOKEN, [])).toEqual({});
  });
  it("fetches with enterprise ids", async () => {
    mockFetchOk({ ent1: {} });
    const result = await fetchMovementStatisticsByEnterpriseIds(TOKEN, [1, 2]);
    expect(result).toEqual({ ent1: {} });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("statistics-by-enterpriseid?ids=1,2"), expect.any(Object)
    );
  });
});

describe("searchAdmByName", () => {
  it("calls correct endpoint", async () => {
    mockFetchOk([{ id: 1, label: "Bogotá" }]);
    const result = await searchAdmByName(TOKEN, "Bogotá", "adm1");
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("adm3/by-label?label=Bogot%C3%A1"), expect.any(Object)
    );
  });
});

describe("fetchAdm3DetailsByIds", () => {
  it("returns empty array for empty/non-array ids", async () => {
    expect(await fetchAdm3DetailsByIds(TOKEN, [])).toEqual([]);
    expect(await fetchAdm3DetailsByIds(TOKEN, null)).toEqual([]);
    expect(await fetchAdm3DetailsByIds(TOKEN, "not-array")).toEqual([]);
  });
  it("fetches for valid ids", async () => {
    mockFetchOk([{ id: 1 }]);
    const result = await fetchAdm3DetailsByIds(TOKEN, [1, 2, 3]);
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("adm3/by-ids?ids=1,2,3"), expect.any(Object)
    );
  });
});

describe("fetchAdm3RisksByAnalysisAndAdm3", () => {
  it("returns empty array for missing params", async () => {
    expect(await fetchAdm3RisksByAnalysisAndAdm3(TOKEN, null, [1])).toEqual([]);
    expect(await fetchAdm3RisksByAnalysisAndAdm3(TOKEN, 1, [])).toEqual([]);
    expect(await fetchAdm3RisksByAnalysisAndAdm3(TOKEN, 1, null)).toEqual([]);
  });
  it("posts with valid params", async () => {
    mockFetchOk([{ risk: true }]);
    const result = await fetchAdm3RisksByAnalysisAndAdm3(TOKEN, 1, [10, 20]);
    expect(result).toHaveLength(1);
  });
});

describe("fetchAdm3RiskByAdm3AndType", () => {
  it("returns empty object for empty adm3Ids", async () => {
    expect(await fetchAdm3RiskByAdm3AndType(TOKEN, [], "annual")).toEqual({});
  });
  it("throws for invalid type", async () => {
    await expect(
      fetchAdm3RiskByAdm3AndType(TOKEN, [1], "invalid_type")
    ).rejects.toThrow("El parámetro 'type' debe ser 'annual' o 'cumulative'");
  });
  it("accepts 'annual' type", async () => {
    mockFetchOk({ data: true });
    expect(await fetchAdm3RiskByAdm3AndType(TOKEN, [1], "annual")).toEqual({ data: true });
  });
  it("accepts 'cumulative' type", async () => {
    mockFetchOk({ data: true });
    expect(await fetchAdm3RiskByAdm3AndType(TOKEN, [1], "cumulative")).toEqual({ data: true });
  });
  it("accepts 'atd' type", async () => {
    mockFetchOk({ data: true });
    expect(await fetchAdm3RiskByAdm3AndType(TOKEN, [1], "atd")).toEqual({ data: true });
  });
  it("accepts 'nad' type", async () => {
    mockFetchOk({ data: true });
    expect(await fetchAdm3RiskByAdm3AndType(TOKEN, [1], "nad")).toEqual({ data: true });
  });
  it("includes value_chain in body when provided", async () => {
    mockFetchOk({});
    await fetchAdm3RiskByAdm3AndType(TOKEN, [1], "annual", "ganaderia");
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.value_chain).toBe("livestock");
  });
});

describe("fetchRiskGlobal", () => {
  it("throws when entityType is missing", async () => {
    await expect(fetchRiskGlobal(TOKEN, null, [1])).rejects.toThrow("entityType es requerido");
  });
  it("returns empty object for empty ids", async () => {
    expect(await fetchRiskGlobal(TOKEN, "farm", [])).toEqual({});
  });
  it("sends analysisIds in payload when provided", async () => {
    mockFetchOk({ global_risk: true });
    await fetchRiskGlobal(TOKEN, "farm", [1], { analysisIds: [10] });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.analysis_ids).toEqual([10]);
    expect(body.deforestation_ids).toBeUndefined();
  });
  it("sends deforestationIds when analysisIds not provided", async () => {
    mockFetchOk({});
    await fetchRiskGlobal(TOKEN, "farm", [1], { deforestationIds: [5] });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.deforestation_ids).toEqual([5]);
  });
  it("sends type when neither analysisIds nor deforestationIds", async () => {
    mockFetchOk({});
    await fetchRiskGlobal(TOKEN, "farm", [1], { type: "annual" });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.type).toBe("annual");
  });
  it("throws when no type, analysisIds, or deforestationIds", async () => {
    await expect(fetchRiskGlobal(TOKEN, "farm", [1], {})).rejects.toThrow(
      "Debes enviar type o analysisIds o deforestationIds"
    );
  });
});

describe("fetchSuppliersByEnterpriseIds", () => {
  it("returns empty object for empty ids", async () => {
    expect(await fetchSuppliersByEnterpriseIds(TOKEN, [])).toEqual({});
    expect(await fetchSuppliersByEnterpriseIds(TOKEN)).toEqual({});
  });
  it("fetches suppliers for valid ids", async () => {
    mockFetchOk({ 1: [{ id: "supplier1" }] });
    const result = await fetchSuppliersByEnterpriseIds(TOKEN, [1, 2]);
    expect(result).toEqual({ 1: [{ id: "supplier1" }] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("suppliers/by-enterprise?ids=1,2"), expect.any(Object)
    );
  });
});

describe("fetchEnums", () => {
  it("throws when enumName is missing", async () => {
    await expect(fetchEnums(TOKEN, "")).rejects.toThrow("enumName es requerido");
    await expect(fetchEnums(TOKEN, null)).rejects.toThrow("enumName es requerido");
  });
  it("fetches enums for valid name", async () => {
    mockFetchOk(["SIT_CODE", "GEOFARMER_ID"]);
    const result = await fetchEnums(TOKEN, "source");
    expect(result).toEqual(["SIT_CODE", "GEOFARMER_ID"]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("enums/?enum_name=source"), expect.any(Object)
    );
  });
});

describe("API error handling", () => {
  it("includes detail from error response in error message", async () => {
    mockFetchError(400, "ID no válido");
    await expect(fetchEnterprises(TOKEN)).rejects.toThrow("ID no válido");
  });
  it("throws generic message when error response has no detail", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 500, json: async () => ({}),
    });
    await expect(fetchEnterprises(TOKEN)).rejects.toThrow("Error al cargar empresas");
  });
  it("handles non-JSON error responses gracefully", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 500, json: async () => { throw new Error("not JSON"); },
    });
    await expect(fetchEnterprises(TOKEN)).rejects.toThrow("Error al cargar empresas");
  });
});
