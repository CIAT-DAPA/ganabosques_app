"use client";
import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import Keycloak from "keycloak-js";
import { validateToken } from "@/services/tokenService";

const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenParsed, setTokenParsed] = useState(null);
  const [validatedPayload, setValidatedPayload] = useState(null);
  const isRun = useRef(false);
  const keycloak = useRef(null);

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak.current = new Keycloak({
      url: "https://ganausers.alliance.cgiar.org",
      realm: "GanaBosques",
      clientId: "GanabosquesWeb",
    });

    keycloak.current
      .init({ onLoad: "check-sso" })
      .then((authenticated) => {
        if (authenticated) {
          setToken(keycloak.current.token);
          setTokenParsed(keycloak.current.tokenParsed);
          keycloak.current.loadUserInfo().then(setUserInfo);

          // Validate token with backend
          const validate = async () => {
            const validation = await validateToken(keycloak.current.token);
            if (validation.valid) {
              setValidatedPayload(validation.payload);
            }
          };
          validate();
        }
      })
      .catch((error) => {
        console.error("Error inicializando Keycloak:", error);
      });
  }, []);

  // Token refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (keycloak.current) {
        keycloak.current
          .updateToken(60)
          .then((refreshed) => {
            if (refreshed) {
              setToken(keycloak.current.token);
              setTokenParsed(keycloak.current.tokenParsed);
            }
          })
          .catch(() => {
            console.warn("No se pudo actualizar el token, cerrando sesión");
          });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const login = () => {
    keycloak.current.login();
  };

  const logout = () => {
    keycloak.current.logout({ redirectUri: window.location.origin });
    setUserInfo(null);
    setToken(null);
    setTokenParsed(null);
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      userInfo,
      token,
      tokenParsed,
      login,
      logout,
      validatedPayload,
    }),
    [userInfo, token, tokenParsed, validatedPayload]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
