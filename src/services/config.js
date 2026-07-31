// API configuration
//export const API_URL = "http://localhost:8000/";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

export const KEYCLOAK_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "";

export const KEYCLOAK_REALM =
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "";

export const KEYCLOAK_CLIENT_ID =
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "";

export const GEOSERVER_URL = 
  process.env.NEXT_PUBLIC_GEOSERVER_URL || "http://localhost:8081";