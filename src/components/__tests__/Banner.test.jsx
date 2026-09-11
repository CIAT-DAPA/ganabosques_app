import { render, screen } from "@testing-library/react";
import Banner from "../Banner";

describe("Banner", () => {
  it("renders the title and the text", () => {
    render(<Banner image="/hero.png" title="Alertas de predios" text="Consulta el riesgo" />);

    expect(screen.getByRole("heading", { name: "Alertas de predios" })).toBeInTheDocument();
    expect(screen.getByText("Consulta el riesgo")).toBeInTheDocument();
  });

  it("uses the given image as the background", () => {
    const { container } = render(<Banner image="/hero.png" title="T" text="D" />);

    const hero = container.querySelector('[style*="background-image"]');
    expect(hero).toHaveStyle({ backgroundImage: "url('/hero.png')" });
  });

  it("renders with no props at all", () => {
    expect(() => render(<Banner />)).not.toThrow();
  });

  it("renders the heading as an h2", () => {
    render(<Banner image="/hero.png" title="Alertas" text="D" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Alertas");
  });
});
