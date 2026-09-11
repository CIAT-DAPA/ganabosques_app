// The concrete maps pull in react-leaflet, which ships ESM only, so they are
// replaced by markers that just report which one was chosen.
jest.mock("../maps/EnterpriseRiskMap", () => () => <div>enterprise-map</div>);
jest.mock("../maps/FarmRiskMap", () => () => <div>farm-map</div>);
jest.mock("../maps/NationalRiskMap", () => () => <div>national-map</div>);
jest.mock("../maps/DashboardMap", () => () => <div>dashboard-map</div>);

import { render, screen } from "@testing-library/react";
import Map from "../Map";

describe("Map", () => {
  it("renders the dashboard map when dashboardRisk is set", () => {
    render(<Map dashboardRisk />);
    expect(screen.getByText("dashboard-map")).toBeInTheDocument();
  });

  it("renders the enterprise map when enterpriseRisk is set", () => {
    render(<Map enterpriseRisk />);
    expect(screen.getByText("enterprise-map")).toBeInTheDocument();
  });

  it("renders the farm map when farmRisk is set", () => {
    render(<Map farmRisk />);
    expect(screen.getByText("farm-map")).toBeInTheDocument();
  });

  it("renders the national map when nationalRisk is set", () => {
    render(<Map nationalRisk />);
    expect(screen.getByText("national-map")).toBeInTheDocument();
  });

  it("falls back to the national map with no props", () => {
    render(<Map />);
    expect(screen.getByText("national-map")).toBeInTheDocument();
  });

  describe("precedence between flags", () => {
    it("dashboard wins over every other flag", () => {
      render(<Map dashboardRisk enterpriseRisk farmRisk nationalRisk />);

      expect(screen.getByText("dashboard-map")).toBeInTheDocument();
      expect(screen.queryByText("enterprise-map")).not.toBeInTheDocument();
    });

    it("enterprise wins over farm and national", () => {
      render(<Map enterpriseRisk farmRisk nationalRisk />);

      expect(screen.getByText("enterprise-map")).toBeInTheDocument();
      expect(screen.queryByText("farm-map")).not.toBeInTheDocument();
    });

    it("farm wins over national", () => {
      render(<Map farmRisk nationalRisk />);

      expect(screen.getByText("farm-map")).toBeInTheDocument();
      expect(screen.queryByText("national-map")).not.toBeInTheDocument();
    });
  });

  it("renders exactly one map", () => {
    const { container } = render(<Map farmRisk />);
    expect(container.querySelectorAll("div")).toHaveLength(1);
  });
});
