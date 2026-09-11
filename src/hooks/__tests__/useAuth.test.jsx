// The keycloak-js mock builds its instance inside the factory because
// jest.mock is hoisted above the module declarations.
jest.mock("keycloak-js", () => {
  const instance = {
    init: jest.fn(),
    loadUserInfo: jest.fn(),
    updateToken: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    token: "keycloak-token",
    tokenParsed: { sub: "user-1" },
  };
  const ctor = jest.fn(() => instance);
  ctor.__instance = instance;
  return { __esModule: true, default: ctor };
});

jest.mock("@/services/tokenService", () => ({ validateToken: jest.fn() }));

jest.mock("@/services/config", () => ({
  KEYCLOAK_URL: "https://keycloak.example",
  KEYCLOAK_REALM: "ganabosques",
  KEYCLOAK_CLIENT_ID: "app-web",
}));

import { render, screen, renderHook, act, waitFor } from "@testing-library/react";
import Keycloak from "keycloak-js";
import { validateToken } from "@/services/tokenService";
import { AuthProvider, useAuth } from "../useAuth";
import { silenceConsoleError, silenceConsoleWarn } from "./helpers";

const kc = Keycloak.__instance;

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kc.token = "keycloak-token";
    kc.tokenParsed = { sub: "user-1" };
    kc.init.mockResolvedValue(false);
    kc.loadUserInfo.mockResolvedValue({ preferred_username: "vhernandez" });
    kc.updateToken.mockResolvedValue(false);
    validateToken.mockResolvedValue({ valid: false });
  });

  describe("outside the provider", () => {
    it("throws an explanatory error", () => {
      const spy = silenceConsoleError();
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used within an AuthProvider"
      );
      spy.mockRestore();
    });
  });

  describe("Keycloak initialization", () => {
    it("builds the client with the project configuration", async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(Keycloak).toHaveBeenCalledTimes(1));
      expect(Keycloak).toHaveBeenCalledWith({
        url: "https://keycloak.example",
        realm: "ganabosques",
        clientId: "app-web",
      });
    });

    it("initializes with check-sso", async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(kc.init).toHaveBeenCalledWith({ onLoad: "check-sso" }));
    });

    // The useRef guard keeps the effect from running twice under StrictMode and
    // opening two sessions against Keycloak.
    it("does not initialize again on later renders", async () => {
      const { rerender } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(kc.init).toHaveBeenCalledTimes(1));

      rerender();
      rerender();

      expect(kc.init).toHaveBeenCalledTimes(1);
      expect(Keycloak).toHaveBeenCalledTimes(1);
    });

    it("logs the error when initialization fails", async () => {
      const spy = silenceConsoleError();
      kc.init.mockRejectedValue(new Error("keycloak down"));

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() =>
        expect(spy).toHaveBeenCalledWith("Error inicializando Keycloak:", expect.any(Error))
      );
      spy.mockRestore();
    });
  });

  describe("unauthenticated session", () => {
    it("leaves the context empty", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(kc.init).toHaveBeenCalled());

      expect(result.current.token).toBeNull();
      expect(result.current.tokenParsed).toBeNull();
      expect(result.current.userInfo).toBeNull();
      expect(result.current.validatedPayload).toBeNull();
    });

    it("does not load user info nor validate the token", async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(kc.init).toHaveBeenCalled());

      expect(kc.loadUserInfo).not.toHaveBeenCalled();
      expect(validateToken).not.toHaveBeenCalled();
    });
  });

  describe("authenticated session", () => {
    beforeEach(() => {
      kc.init.mockResolvedValue(true);
    });

    it("publishes the token and its parsed content", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.token).toBe("keycloak-token"));
      expect(result.current.tokenParsed).toEqual({ sub: "user-1" });
    });

    it("loads the user info", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() =>
        expect(result.current.userInfo).toEqual({ preferred_username: "vhernandez" })
      );
    });

    it("validates the token against the backend", async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(validateToken).toHaveBeenCalledWith("keycloak-token"));
    });

    it("publishes the validated payload when the backend accepts it", async () => {
      validateToken.mockResolvedValue({
        valid: true,
        payload: { admin: true, permissions: [] },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() =>
        expect(result.current.validatedPayload).toEqual({ admin: true, permissions: [] })
      );
    });

    it("publishes no payload when the backend rejects the token", async () => {
      validateToken.mockResolvedValue({ valid: false });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(validateToken).toHaveBeenCalled());
      expect(result.current.validatedPayload).toBeNull();
    });
  });

  describe("periodic token refresh", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("tries to refresh every 30 seconds with a 60 second margin", async () => {
      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(kc.updateToken).toHaveBeenCalledWith(60);
    });

    it("does not refresh before 30 seconds", async () => {
      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(29999);
      });

      expect(kc.updateToken).not.toHaveBeenCalled();
    });

    it("updates the token when Keycloak renewed it", async () => {
      kc.updateToken.mockImplementation(async () => {
        kc.token = "renewed-token";
        kc.tokenParsed = { sub: "user-1", iat: 2 };
        return true;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(result.current.token).toBe("renewed-token");
      expect(result.current.tokenParsed).toEqual({ sub: "user-1", iat: 2 });
    });

    it("leaves state alone when there was no renewal", async () => {
      kc.updateToken.mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(result.current.token).toBeNull();
    });

    it("warns on the console when the refresh fails", async () => {
      const spy = silenceConsoleWarn();
      kc.updateToken.mockRejectedValue(new Error("session expired"));

      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(spy).toHaveBeenCalledWith("No se pudo actualizar el token, cerrando sesión");
      spy.mockRestore();
    });

    it("stops the interval on unmount", async () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper });

      unmount();
      await act(async () => {
        jest.advanceTimersByTime(90000);
      });

      expect(kc.updateToken).not.toHaveBeenCalled();
    });
  });

  describe("login and logout", () => {
    it("login delegates to Keycloak", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(kc.init).toHaveBeenCalled());

      act(() => {
        result.current.login();
      });

      expect(kc.login).toHaveBeenCalledTimes(1);
    });

    it("logout delegates to Keycloak with the return url", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(kc.init).toHaveBeenCalled());

      act(() => {
        result.current.logout();
      });

      expect(kc.logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
    });

    it("logout clears the session state", async () => {
      kc.init.mockResolvedValue(true);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.token).toBe("keycloak-token"));

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.tokenParsed).toBeNull();
      expect(result.current.userInfo).toBeNull();
    });
  });

  describe("context value", () => {
    it("exposes the expected surface", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(kc.init).toHaveBeenCalled());

      expect(Object.keys(result.current).sort()).toEqual([
        "login",
        "logout",
        "token",
        "tokenParsed",
        "userInfo",
        "validatedPayload",
      ]);
    });

    // The value is memoized so the provider does not re-render the whole tree
    // on every one of its own renders.
    it("keeps the same reference while the state does not change", async () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(kc.init).toHaveBeenCalled());
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });
  });

  describe("AuthProvider", () => {
    it("renders its children", async () => {
      render(
        <AuthProvider>
          <p>protected content</p>
        </AuthProvider>
      );

      expect(screen.getByText("protected content")).toBeInTheDocument();
      await waitFor(() => expect(kc.init).toHaveBeenCalled());
    });
  });
});
