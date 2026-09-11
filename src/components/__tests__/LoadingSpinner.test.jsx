import { render, screen } from "@testing-library/react";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("shows the default message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("shows a custom message", () => {
    render(<LoadingSpinner message="Consultando predios" />);
    expect(screen.getByText("Consultando predios")).toBeInTheDocument();
  });

  it("renders the spinner image with alt text", () => {
    render(<LoadingSpinner />);
    expect(screen.getByAltText("Cargando...")).toBeInTheDocument();
  });

  it("covers the viewport so it blocks interaction while loading", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toHaveClass("fixed", "inset-0");
  });
});
