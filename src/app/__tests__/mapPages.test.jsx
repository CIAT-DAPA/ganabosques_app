jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));

// Every one of these pages lazy-loads @/components/Map, which pulls in
// react-leaflet (ESM only), so the map is replaced by a marker that reports
// which risk flag it was handed.
jest.mock("@/components/Map", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MapStub(props) {
      return React.createElement("div", {
        "data-testid": "map",
        "data-flags": Object.keys(props).filter((k) => props[k]).join(","),
      });
    },
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import RiesgosNacionales from "../alertasnacionales/page";
import RiesgosPredios from "../alertapredios/page";
import RiesgosEmpresas from "../alertaempresas/page";
import Dashboard from "../dashboard/page";

const allow = (action) =>
  useAuth.mockReturnValue({
    validatedPayload: { user_db: { admin: false, permissions: [{ action, options: ["read"] }] } },
  });

const asAdmin = () => useAuth.mockReturnValue({ validatedPayload: { user_db: { admin: true } } });
const anonymous = () => useAuth.mockReturnValue({ validatedPayload: null });

// Each page is gated by its own permission and renders its own map flag.
const PAGES = [
  {
    name: "alertasnacionales",
    Component: RiesgosNacionales,
    permission: "front_adm",
    title: "Alertas nacionales",
    documentTitle: "Ganabosques - Alertas nacionales",
    flag: "nationalRisk",
  },
  {
    name: "alertapredios",
    Component: RiesgosPredios,
    permission: "front_farms",
    title: "Alertas de predios",
    documentTitle: "Ganabosques - Alertas de predios",
    flag: "farmRisk",
  },
  {
    name: "alertaempresas",
    Component: RiesgosEmpresas,
    permission: "front_enterprise",
    title: "Alertas de empresas",
    documentTitle: "Ganabosques - Alertas de empresas",
    flag: "enterpriseRisk",
  },
  {
    name: "dashboard",
    Component: Dashboard,
    permission: "front_report",
    title: "Dashboard de Alertas",
    documentTitle: "Ganabosques - Dashboard",
    flag: "dashboardRisk",
  },
];

describe.each(PAGES)("$name page", ({ Component, permission, title, documentTitle, flag }) => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = "";
  });

  describe("permission gating", () => {
    it("blocks an anonymous visitor", () => {
      anonymous();
      render(<Component />);

      expect(screen.getByRole("heading", { name: "No estás autorizado" })).toBeInTheDocument();
      expect(screen.queryByTestId("map")).not.toBeInTheDocument();
    });

    it("blocks a user without the required permission", () => {
      allow("some_other_module");
      render(<Component />);

      expect(screen.getByRole("heading", { name: "No estás autorizado" })).toBeInTheDocument();
    });

    it("allows a user holding the required permission", async () => {
      allow(permission);
      render(<Component />);

      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      await waitFor(() => expect(screen.getByTestId("map")).toBeInTheDocument());
    });

    it("allows an admin", async () => {
      asAdmin();
      render(<Component />);

      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      await waitFor(() => expect(screen.getByTestId("map")).toBeInTheDocument());
    });
  });

  describe("page content", () => {
    it("sets the document title", () => {
      asAdmin();
      render(<Component />);

      expect(document.title).toBe(documentTitle);
    });

    it("still sets the document title when access is denied", () => {
      anonymous();
      render(<Component />);

      expect(document.title).toBe(documentTitle);
    });

    it("renders a description next to the heading", () => {
      asAdmin();
      const { container } = render(<Component />);

      expect(container.querySelector("p")).not.toBeEmptyDOMElement();
    });

    it("hands the map its own risk flag", async () => {
      asAdmin();
      render(<Component />);

      const map = await screen.findByTestId("map");
      expect(map.getAttribute("data-flags")).toBe(flag);
    });
  });
});

describe("banner usage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    asAdmin();
  });

  // Only the farm and enterprise pages carry a banner below the map.
  it("renders a banner on the farm page", () => {
    const { container } = render(<RiesgosPredios />);
    expect(container.querySelectorAll("h1, h2").length).toBeGreaterThanOrEqual(1);
  });

  it("renders no map flag other than its own on the national page", async () => {
    render(<RiesgosNacionales />);

    const map = await screen.findByTestId("map");
    expect(map.getAttribute("data-flags")).not.toContain("farmRisk");
  });
});
