jest.mock("leaflet", () => ({
  icon: jest.fn((opts) => ({ ...opts, _type: "leaflet-icon" })),
}));

jest.mock("@/components/shared", () => ({
  TYPE_ALIASES: {
    COLLECTIONCENTER: "COLLECTION_CENTER",
    CENTRO_ACOPIO: "COLLECTION_CENTER",
    "CENTRO DE ACOPIO": "COLLECTION_CENTER",
    ACOPIO: "COLLECTION_CENTER",
    PLANTA: "SLAUGHTERHOUSE",
    FERIA: "CATTLE_FAIR",
    EMPRESA: "ENTERPRISE",
    FINCA: "FARM",
    SLAUGHTERHOUSE_ID: "SLAUGHTERHOUSE",
    PRODUCTIONUNIT_ID: "FARM",
  },
  ENTERPRISE_TYPES: {
    FARM: "Finca",
    COLLECTION_CENTER: "Centro de acopio",
    SLAUGHTERHOUSE: "Planta de beneficio",
    CATTLE_FAIR: "Feria ganadera",
    ENTERPRISE: "Empresa",
  },
}));

import {
  ARROW_CONFIG, ENTERPRISE_BASES, normalizeType, getEnterpriseBase, getTypeLabel,
  createIcon, getEnterpriseIcon, getFarmIcon, calculateDistance, calculateAngle,
  interpolatePoints, getArrowSpacing, getIconSize, getGeojsonName,
} from "../mapUtils";

describe("ARROW_CONFIG", () => {
  it("has expected structure", () => {
    expect(ARROW_CONFIG.ROTATION_ADJUSTMENT).toBe(180);
    expect(ARROW_CONFIG.ANIMATION_DURATION).toBe("1.5s");
    expect(ARROW_CONFIG.ICON_SIZES).toHaveProperty("HIGH_ZOOM");
    expect(ARROW_CONFIG.ZOOM_THRESHOLDS).toHaveProperty("HIGH");
    expect(ARROW_CONFIG.SPACING).toHaveProperty("HIGH_ZOOM");
  });
});

describe("ENTERPRISE_BASES", () => {
  it("maps canonical types to icon base names", () => {
    expect(ENTERPRISE_BASES.SLAUGHTERHOUSE).toBe("planta");
    expect(ENTERPRISE_BASES.COLLECTION_CENTER).toBe("acopio");
    expect(ENTERPRISE_BASES.CATTLE_FAIR).toBe("feria");
    expect(ENTERPRISE_BASES.ENTERPRISE).toBe("empresa");
    expect(ENTERPRISE_BASES.FARM).toBe("finca");
  });
});

describe("normalizeType", () => {
  it("returns 'ENTERPRISE' for falsy input", () => {
    expect(normalizeType(null)).toBe("ENTERPRISE");
    expect(normalizeType("")).toBe("ENTERPRISE");
    expect(normalizeType(undefined)).toBe("ENTERPRISE");
  });
  it("normalizes known aliases", () => {
    expect(normalizeType("PLANTA")).toBe("SLAUGHTERHOUSE");
    expect(normalizeType("FERIA")).toBe("CATTLE_FAIR");
    expect(normalizeType("COLLECTIONCENTER")).toBe("COLLECTION_CENTER");
  });
  it("handles case insensitivity via toUpperCase", () => {
    expect(normalizeType("planta")).toBe("SLAUGHTERHOUSE");
    expect(normalizeType("finca")).toBe("FARM");
  });
  it("replaces hyphens with underscores", () => {
    expect(normalizeType("COLLECTION-CENTER")).toBe("COLLECTION_CENTER");
  });
  it("returns uppercased value for unknown types", () => {
    expect(normalizeType("custom")).toBe("CUSTOM");
  });
});

describe("getEnterpriseBase", () => {
  it("returns correct base name for known types", () => {
    expect(getEnterpriseBase("FARM")).toBe("finca");
    expect(getEnterpriseBase("SLAUGHTERHOUSE")).toBe("planta");
    expect(getEnterpriseBase("PLANTA")).toBe("planta");
  });
  it("returns 'empresa' for unknown types", () => {
    expect(getEnterpriseBase("UNKNOWN")).toBe("empresa");
  });
  it("returns 'empresa' for null", () => {
    expect(getEnterpriseBase(null)).toBe("empresa");
  });
});

describe("getTypeLabel", () => {
  it("returns Spanish label for known types", () => {
    expect(getTypeLabel("FARM")).toBe("Finca");
    expect(getTypeLabel("PLANTA")).toBe("Planta de beneficio");
  });
  it("returns original type for unknown types", () => {
    expect(getTypeLabel("MYSTERY")).toBe("MYSTERY");
  });
});

describe("createIcon", () => {
  it("calls L.icon with correct params", () => {
    const L = require("leaflet");
    createIcon("/test.png", "my-class");
    expect(L.icon).toHaveBeenCalledWith({
      iconUrl: "/test.png", iconSize: [42, 57],
      iconAnchor: [21, 57], popupAnchor: [0, -36], className: "my-class",
    });
  });
});

describe("getEnterpriseIcon", () => {
  it("creates icon with enterprise base path", () => {
    const icon = getEnterpriseIcon("FARM");
    expect(icon.iconUrl).toBe("/finca.png");
    expect(icon.className).toBe("enterprise-marker");
  });
});

describe("getFarmIcon", () => {
  it("creates farm icon with correct path", () => {
    const icon = getFarmIcon();
    expect(icon.iconUrl).toBe("/finca.png");
    expect(icon.className).toBe("farm-marker");
  });
});

describe("calculateDistance", () => {
  it("returns 0 for same coordinates", () => {
    expect(calculateDistance(0, 0, 0, 0)).toBe(0);
  });
  it("calculates approximate distance between known points", () => {
    const dist = calculateDistance(4.711, -74.0721, 3.4516, -76.532);
    expect(dist).toBeGreaterThan(250000);
    expect(dist).toBeLessThan(350000);
  });
  it("handles negative coordinates", () => {
    const dist = calculateDistance(-1, -1, -2, -2);
    expect(dist).toBeGreaterThan(0);
  });
});

describe("calculateAngle", () => {
  it("returns 0 for same coordinates", () => {
    expect(calculateAngle(0, 0, 0, 0)).toBe(0);
  });
  it("returns ~90 for due east", () => {
    const angle = calculateAngle(0, 0, 0, 10);
    expect(angle).toBeCloseTo(90, 0);
  });
  it("returns between 0 and 360", () => {
    const angle = calculateAngle(10, 20, 15, 25);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(360);
  });
});

describe("interpolatePoints", () => {
  it("returns start and end for 1 point", () => {
    const points = interpolatePoints(0, 0, 10, 10, 1);
    expect(points).toHaveLength(2);
    expect(points[0]).toEqual([0, 0]);
    expect(points[1]).toEqual([10, 10]);
  });
  it("returns correct number of intermediate points", () => {
    const points = interpolatePoints(0, 0, 10, 10, 4);
    expect(points).toHaveLength(5);
  });
  it("first point is start, last is end", () => {
    const points = interpolatePoints(1, 2, 3, 4, 3);
    expect(points[0]).toEqual([1, 2]);
    expect(points[3]).toEqual([3, 4]);
  });
  it("interpolates linearly", () => {
    const points = interpolatePoints(0, 0, 10, 20, 2);
    expect(points[1][0]).toBeCloseTo(5, 5);
    expect(points[1][1]).toBeCloseTo(10, 5);
  });
});

describe("getArrowSpacing", () => {
  it("returns HIGH_ZOOM spacing for zoom >= 14", () => {
    expect(getArrowSpacing(14)).toBe(ARROW_CONFIG.SPACING.HIGH_ZOOM);
    expect(getArrowSpacing(16)).toBe(ARROW_CONFIG.SPACING.HIGH_ZOOM);
  });
  it("returns MEDIUM_ZOOM spacing for zoom 12-13", () => {
    expect(getArrowSpacing(12)).toBe(ARROW_CONFIG.SPACING.MEDIUM_ZOOM);
    expect(getArrowSpacing(13)).toBe(ARROW_CONFIG.SPACING.MEDIUM_ZOOM);
  });
  it("returns LOW_ZOOM spacing for zoom 10-11", () => {
    expect(getArrowSpacing(10)).toBe(ARROW_CONFIG.SPACING.LOW_ZOOM);
    expect(getArrowSpacing(11)).toBe(ARROW_CONFIG.SPACING.LOW_ZOOM);
  });
  it("returns VERY_LOW_ZOOM spacing for zoom < 10", () => {
    expect(getArrowSpacing(9)).toBe(ARROW_CONFIG.SPACING.VERY_LOW_ZOOM);
    expect(getArrowSpacing(5)).toBe(ARROW_CONFIG.SPACING.VERY_LOW_ZOOM);
  });
});

describe("getIconSize", () => {
  it("returns HIGH_ZOOM size for zoom >= 12", () => {
    expect(getIconSize(12)).toBe(ARROW_CONFIG.ICON_SIZES.HIGH_ZOOM);
    expect(getIconSize(15)).toBe(ARROW_CONFIG.ICON_SIZES.HIGH_ZOOM);
  });
  it("returns MEDIUM_ZOOM size for zoom 10-11", () => {
    expect(getIconSize(10)).toBe(ARROW_CONFIG.ICON_SIZES.MEDIUM_ZOOM);
    expect(getIconSize(11)).toBe(ARROW_CONFIG.ICON_SIZES.MEDIUM_ZOOM);
  });
  it("returns LOW_ZOOM size for zoom < 10", () => {
    expect(getIconSize(9)).toBe(ARROW_CONFIG.ICON_SIZES.LOW_ZOOM);
    expect(getIconSize(5)).toBe(ARROW_CONFIG.ICON_SIZES.LOW_ZOOM);
  });
});

describe("getGeojsonName", () => {
  it("returns null for null/undefined input", () => {
    expect(getGeojsonName(null)).toBeNull();
    expect(getGeojsonName(undefined)).toBeNull();
  });
  it("extracts name from object", () => {
    expect(getGeojsonName({ name: "My Region" })).toBe("My Region");
  });
  it("extracts name from properties", () => {
    expect(getGeojsonName({ properties: { name: "Props Name" } })).toBe("Props Name");
  });
  it("extracts name from first feature", () => {
    const geojson = { features: [{ properties: { name: "Feature Name" } }] };
    expect(getGeojsonName(geojson)).toBe("Feature Name");
  });
  it("parses JSON string", () => {
    const json = JSON.stringify({ name: "Parsed Name" });
    expect(getGeojsonName(json)).toBe("Parsed Name");
  });
  it("returns null for invalid JSON string", () => {
    expect(getGeojsonName("not valid json{")).toBeNull();
  });
  it("returns null when no name found", () => {
    expect(getGeojsonName({ type: "FeatureCollection" })).toBeNull();
  });
});
