"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
import Keycloak from "keycloak-js";

const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenParsed, setTokenParsed] = useState(null);
  const isRun = useRef(false);
  const keycloak = useRef(null);

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak.current = new Keycloak({
      url: "http://localhost:8080",
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
        }
      })
      .catch((error) => {
        console.error("Error inicializando Keycloak:", error);
      });
  }, []);

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
            logout();
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

  const contextValue = {
    userInfo,
    token,
    tokenParsed,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
