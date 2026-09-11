import { render, screen } from "@testing-library/react";
import UnauthorizedPage from "../Unauthorized";

describe("UnauthorizedPage", () => {
  it("states that the user is not authorized", () => {
    render(<UnauthorizedPage />);
    expect(screen.getByRole("heading", { name: "No estás autorizado" })).toBeInTheDocument();
  });

  it("explains the missing permissions", () => {
    render(<UnauthorizedPage />);
    expect(
      screen.getByText("No tienes permisos para acceder a este recurso.")
    ).toBeInTheDocument();
  });

  it("offers a link back to the home page", () => {
    render(<UnauthorizedPage />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    expect(screen.getByText("Volver al inicio")).toBeInTheDocument();
  });

  it("renders the illustration with alt text", () => {
    render(<UnauthorizedPage />);
    expect(screen.getByAltText("No autorizado")).toBeInTheDocument();
  });
});
