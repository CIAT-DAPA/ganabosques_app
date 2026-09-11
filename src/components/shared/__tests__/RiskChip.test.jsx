import { render, screen } from "@testing-library/react";
import RiskChip from "../RiskChip";
import { COLOR_RISK, COLOR_OK } from "@/utils";

describe("RiskChip", () => {
  it("reads 'Con alerta' when there is risk", () => {
    render(<RiskChip hasRisk />);
    expect(screen.getByText("Con alerta")).toBeInTheDocument();
  });

  it("reads 'Sin alerta' when there is no risk", () => {
    render(<RiskChip hasRisk={false} />);
    expect(screen.getByText("Sin alerta")).toBeInTheDocument();
  });

  it("treats a missing hasRisk as no risk", () => {
    render(<RiskChip />);
    expect(screen.getByText("Sin alerta")).toBeInTheDocument();
  });

  it("paints the risk colour when there is risk", () => {
    render(<RiskChip hasRisk />);
    expect(screen.getByText("Con alerta")).toHaveStyle({ backgroundColor: COLOR_RISK });
  });

  it("paints the ok colour when there is no risk", () => {
    render(<RiskChip hasRisk={false} />);
    expect(screen.getByText("Sin alerta")).toHaveStyle({ backgroundColor: COLOR_OK });
  });

  it("exposes the title as a tooltip", () => {
    render(<RiskChip hasRisk title="Alerta Directa" />);
    expect(screen.getByTitle("Alerta Directa")).toBeInTheDocument();
  });

  it("renders without a title", () => {
    render(<RiskChip hasRisk />);
    expect(screen.getByText("Con alerta")).not.toHaveAttribute("title");
  });

  // Truthy non-boolean values reach this chip from the API payloads.
  it("treats a truthy non-boolean value as risk", () => {
    render(<RiskChip hasRisk={1} />);
    expect(screen.getByText("Con alerta")).toBeInTheDocument();
  });

  it("keeps the label on a single line", () => {
    render(<RiskChip hasRisk />);
    expect(screen.getByText("Con alerta")).toHaveStyle({ whiteSpace: "nowrap" });
  });
});
