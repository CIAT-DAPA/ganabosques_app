jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Home from "../page";

const FEATURES = [
  "Riesgo nacional",
  "Riesgo de predios",
  "Riesgo de empresas",
  "Reportes",
];

describe("Home", () => {
  let push;
  let login;

  beforeEach(() => {
    jest.clearAllMocks();
    document.title = "";
    push = jest.fn();
    login = jest.fn();
    useRouter.mockReturnValue({ push });
    useAuth.mockReturnValue({ userInfo: null, login });
  });

  describe("hero", () => {
    it("sets the document title", () => {
      render(<Home />);
      expect(document.title).toBe("Ganabosques");
    });

    it("renders the split brand heading", () => {
      render(<Home />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("GanaBosques");
    });

    it("renders the hero image with alt text", () => {
      render(<Home />);
      expect(screen.getByAltText("Imagen aérea del bosque")).toBeInTheDocument();
    });

    it("renders the explore call to action", () => {
      render(<Home />);
      expect(screen.getByRole("button", { name: "Explorar" })).toBeInTheDocument();
    });
  });

  describe("the explore button", () => {
    it("starts the login flow for an anonymous visitor", async () => {
      const user = userEvent.setup();
      render(<Home />);

      await user.click(screen.getByRole("button", { name: "Explorar" }));

      expect(login).toHaveBeenCalledTimes(1);
      expect(push).not.toHaveBeenCalled();
    });

    it("navigates to the national alerts for a signed-in user", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({ userInfo: { preferred_username: "vhernandez" }, login });
      render(<Home />);

      await user.click(screen.getByRole("button", { name: "Explorar" }));

      expect(push).toHaveBeenCalledWith("/alertasnacionales");
      expect(login).not.toHaveBeenCalled();
    });
  });

  describe("features", () => {
    it("renders a card per feature", () => {
      render(<Home />);

      for (const title of FEATURES) {
        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      }
    });

    it("renders a description under each feature", () => {
      render(<Home />);

      expect(
        screen.getByText(/Explora el nivel de riesgo de deforestación en Colombia por vereda/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Genera reportes en diferentes escalas/)).toBeInTheDocument();
    });

    // A separator sits between cards, so there is one fewer than the cards.
    it("renders one separator fewer than there are features", () => {
      const { container } = render(<Home />);

      const separators = container.querySelectorAll(".hidden.lg\\:flex");
      expect(separators).toHaveLength(FEATURES.length - 1);
    });
  });
});
