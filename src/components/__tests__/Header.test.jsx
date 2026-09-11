jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import Header from "../Header";

const NAV = [
  "Alertas nacionales",
  "Alertas de predio",
  "Alertas de empresa",
  "Dashboard",
  "Reporte",
];

// validatedPayload.user_db is what the backend returns after validating the token.
const auth = (overrides = {}) => ({
  userInfo: null,
  token: null,
  login: jest.fn(),
  logout: jest.fn(),
  validatedPayload: null,
  ...overrides,
});

const asAdmin = (extra = {}) =>
  auth({ token: "t", validatedPayload: { user_db: { admin: true } }, ...extra });

const withPermissions = (permissions, extra = {}) =>
  auth({
    token: "t",
    validatedPayload: { user_db: { admin: false, permissions } },
    ...extra,
  });

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePathname.mockReturnValue("/");
    useAuth.mockReturnValue(auth());
  });

  describe("branding", () => {
    it("renders the logo and the product name", () => {
      render(<Header />);

      expect(screen.getByAltText("Logo Ganabosques")).toBeInTheDocument();
      expect(screen.getByText("Ganabosques")).toBeInTheDocument();
    });

    it("links the brand back to the home page", () => {
      render(<Header />);
      expect(screen.getByRole("link", { name: /Ganabosques/ })).toHaveAttribute("href", "/");
    });
  });

  describe("permission gating", () => {
    it("disables every nav item for an anonymous visitor", () => {
      render(<Header />);

      for (const name of NAV) {
        // Two renderings exist (desktop and mobile markup), so all are checked.
        const items = screen.getAllByTitle("Requiere permisos");
        expect(items.length).toBeGreaterThan(0);
        expect(screen.getAllByText(name)[0]).toHaveAttribute("title", "Requiere permisos");
      }
    });

    it("renders no nav links at all without a token", () => {
      render(<Header />);

      for (const name of NAV) {
        expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
      }
    });

    it("enables every nav item for an admin", () => {
      useAuth.mockReturnValue(asAdmin());
      render(<Header />);

      for (const name of NAV) {
        expect(screen.getByRole("link", { name })).toBeInTheDocument();
      }
    });

    it("enables only the items the permissions allow", () => {
      useAuth.mockReturnValue(
        withPermissions([{ action: "front_farms", options: ["read"] }])
      );
      render(<Header />);

      expect(screen.getByRole("link", { name: "Alertas de predio" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    });

    it("treats front_report as the gate for both Dashboard and Reporte", () => {
      useAuth.mockReturnValue(
        withPermissions([{ action: "front_report", options: ["read"] }])
      );
      render(<Header />);

      expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Reporte" })).toBeInTheDocument();
    });

    it("blocks items when the permission lacks the read option", () => {
      useAuth.mockReturnValue(
        withPermissions([{ action: "front_farms", options: ["write"] }])
      );
      render(<Header />);

      expect(screen.queryByRole("link", { name: "Alertas de predio" })).not.toBeInTheDocument();
    });

    it("blocks everything when the payload carries no user_db", () => {
      useAuth.mockReturnValue(auth({ token: "t", validatedPayload: {} }));
      render(<Header />);

      expect(screen.queryByRole("link", { name: "Reporte" })).not.toBeInTheDocument();
    });
  });

  describe("active route", () => {
    it("highlights the link of the current path", () => {
      usePathname.mockReturnValue("/reporte");
      useAuth.mockReturnValue(asAdmin());
      render(<Header />);

      expect(screen.getByRole("link", { name: "Reporte" })).toHaveClass("font-semibold");
    });

    it("does not highlight the other links", () => {
      usePathname.mockReturnValue("/reporte");
      useAuth.mockReturnValue(asAdmin());
      render(<Header />);

      expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("font-semibold");
    });
  });

  describe("anonymous session", () => {
    it("offers a login button", () => {
      render(<Header />);
      expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
    });

    it("starts the login flow on click", async () => {
      const user = userEvent.setup();
      const value = auth();
      useAuth.mockReturnValue(value);
      render(<Header />);

      await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

      expect(value.login).toHaveBeenCalledTimes(1);
    });
  });

  describe("user initials", () => {
    it.each([
      [{ given_name: "Victor", family_name: "Hernandez" }, "VH"],
      [{ given_name: "Victor" }, "VI"],
      [{ name: "Victor Hernandez" }, "VI"],
      [{ name: "Victor", family_name: "Hernandez" }, "VH"],
      [{ preferred_username: "vhernandez" }, "VH"],
      [{}, "U"],
    ])("renders %p as %s", (userInfo, expected) => {
      useAuth.mockReturnValue(asAdmin({ userInfo }));
      render(<Header />);

      expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
    });

    it("falls back to SL when there is no user info", () => {
      useAuth.mockReturnValue(asAdmin({ userInfo: null }));
      render(<Header />);

      expect(screen.queryByText("SL")).not.toBeInTheDocument();
    });
  });

  describe("user dropdown", () => {
    const signedIn = () =>
      asAdmin({
        userInfo: { given_name: "Victor", family_name: "Hernandez", email: "v@cgiar.org" },
      });

    it("stays closed until the avatar is clicked", () => {
      useAuth.mockReturnValue(signedIn());
      render(<Header />);

      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    });

    it("shows the name and email when opened", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(signedIn());
      render(<Header />);

      await user.click(screen.getByText("VH"));

      expect(screen.getByText("Victor")).toBeInTheDocument();
      expect(screen.getByText("v@cgiar.org")).toBeInTheDocument();
    });

    it("falls back to the username when there is no given name", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(asAdmin({ userInfo: { preferred_username: "vhernandez" } }));
      render(<Header />);

      await user.click(screen.getByText("VH"));

      expect(screen.getByText("vhernandez")).toBeInTheDocument();
    });

    it("falls back to 'Usuario' when nothing identifies the account", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(asAdmin({ userInfo: { email: "x@y.z" } }));
      render(<Header />);

      await user.click(screen.getByText("U"));

      expect(screen.getByText("Usuario")).toBeInTheDocument();
    });

    it("renders an empty email when the account has none", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(asAdmin({ userInfo: { given_name: "Victor" } }));
      render(<Header />);

      await user.click(screen.getByText("VI"));

      expect(screen.getByText("Victor")).toBeInTheDocument();
    });

    it("logs out and closes from the dropdown", async () => {
      const user = userEvent.setup();
      const value = signedIn();
      useAuth.mockReturnValue(value);
      render(<Header />);

      await user.click(screen.getByText("VH"));
      await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

      expect(value.logout).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    });

    it("closes when clicking outside", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(signedIn());
      render(<Header />);

      await user.click(screen.getByText("VH"));
      expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    });

    it("toggles closed on a second avatar click", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(signedIn());
      render(<Header />);

      await user.click(screen.getByText("VH"));
      await user.click(screen.getByText("VH"));

      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    });
  });

  describe("mobile menu", () => {
    const hamburger = () => {
      const buttons = screen.getAllByRole("button");
      return buttons[0];
    };

    it("stays closed initially", () => {
      useAuth.mockReturnValue(asAdmin());
      render(<Header />);

      expect(screen.getAllByRole("link", { name: "Reporte" })).toHaveLength(1);
    });

    it("duplicates the nav items when opened", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(asAdmin());
      render(<Header />);

      await user.click(hamburger());

      expect(screen.getAllByRole("link", { name: "Reporte" })).toHaveLength(2);
    });

    it("closes when a mobile nav link is used", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue(asAdmin());
      render(<Header />);

      await user.click(hamburger());
      await user.click(screen.getAllByRole("link", { name: "Reporte" })[1]);

      expect(screen.getAllByRole("link", { name: "Reporte" })).toHaveLength(1);
    });

    it("shows the login entry for an anonymous visitor", async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(hamburger());

      expect(screen.getAllByText("Iniciar sesión")).toHaveLength(2);
    });

    it("starts the login flow and closes the menu", async () => {
      const user = userEvent.setup();
      const value = auth();
      useAuth.mockReturnValue(value);
      render(<Header />);

      await user.click(hamburger());
      await user.click(screen.getAllByText("Iniciar sesión")[1]);

      expect(value.login).toHaveBeenCalledTimes(1);
      expect(screen.getAllByText("Iniciar sesión")).toHaveLength(1);
    });

    it("shows the signed-in user and logs out", async () => {
      const user = userEvent.setup();
      const value = asAdmin({ userInfo: { given_name: "Victor", family_name: "Hernandez" } });
      useAuth.mockReturnValue(value);
      render(<Header />);

      await user.click(hamburger());
      expect(screen.getByText("Victor")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

      expect(value.logout).toHaveBeenCalledTimes(1);
    });

    it("shows disabled mobile entries without permissions", async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(hamburger());

      expect(screen.getAllByTitle("Requiere permisos").length).toBe(NAV.length * 2);
    });
  });
});
