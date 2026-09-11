import { render, screen } from "@testing-library/react";
import RiskLegend from "../Legend";

const ALL_TYPES = [
  "Finca",
  "Centro de acopio",
  "Planta de beneficio",
  "Feria ganadera",
  "Empresa",
];

describe("RiskLegend", () => {
  describe("by default", () => {
    it("shows both the risk levels and the type list", () => {
      render(<RiskLegend />);

      expect(screen.getByText("Tipo de alerta")).toBeInTheDocument();
      expect(screen.getByText("Tipo")).toBeInTheDocument();
    });

    it("lists the two risk levels", () => {
      render(<RiskLegend />);

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
      expect(screen.getByText("Con alerta")).toBeInTheDocument();
    });

    it("lists every enterprise type", () => {
      render(<RiskLegend />);

      for (const label of ALL_TYPES) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it("renders an icon per type", () => {
      render(<RiskLegend />);

      for (const label of ALL_TYPES) {
        expect(screen.getByAltText(label)).toBeInTheDocument();
      }
    });
  });

  describe("in enterprise mode", () => {
    it("hides the risk level block", () => {
      render(<RiskLegend enterpriseRisk />);
      expect(screen.queryByText("Tipo de alerta")).not.toBeInTheDocument();
    });

    // The enterprise map never draws farms, so that entry would be misleading.
    it("drops 'Finca' from the type list", () => {
      render(<RiskLegend enterpriseRisk />);

      expect(screen.queryByText("Finca")).not.toBeInTheDocument();
      expect(screen.getByText("Empresa")).toBeInTheDocument();
    });
  });

  describe("in national mode", () => {
    it("hides the type block", () => {
      render(<RiskLegend nationalRisk />);
      expect(screen.queryByText("Tipo")).not.toBeInTheDocument();
    });

    it("keeps the risk levels", () => {
      render(<RiskLegend nationalRisk />);

      expect(screen.getByText("Tipo de alerta")).toBeInTheDocument();
      expect(screen.getByText("Con alerta")).toBeInTheDocument();
    });
  });

  it("renders nothing meaningful when both modes are on", () => {
    render(<RiskLegend enterpriseRisk nationalRisk />);

    expect(screen.queryByText("Tipo de alerta")).not.toBeInTheDocument();
    expect(screen.queryByText("Tipo")).not.toBeInTheDocument();
  });
});
