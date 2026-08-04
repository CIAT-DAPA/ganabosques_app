# GanaBosques App

![GitHub release](https://img.shields.io/github/v/release/CIAT-DAPA/ganabosques_app)
![GitHub tag](https://img.shields.io/github/v/tag/CIAT-DAPA/ganabosques_app)

## 📌 Descripción
GanaBosques App es la interfaz web pública del ecosistema GanaBosques. Está construida con Next.js 15.3.6 sobre React 19.2.1, usa Tailwind CSS para la capa visual, Leaflet para cartografía interactiva, ApexCharts para gráficas y Keycloak para autenticación. Su lógica principal se concentra en un conjunto de pantallas, contextos y servicios que centralizan la sesión, el consumo de la API de GanaBosques y la visualización de alertas, mapas y reportes.

La aplicación está pensada para navegación guiada: la página de inicio presenta el producto, el header controla el acceso según permisos, los módulos de alerta muestran mapas especializados y la sección de reportes consolida la consulta y exportación de resultados. La comunicación con el backend se encapsula en [src/services/apiService.js](src/services/apiService.js), mientras que la configuración pública vive en [src/services/config.js](src/services/config.js).

## 🎯 Rol en el ecosistema
Este componente funciona como la capa de consulta y visualización del ecosistema GanaBosques. Su misión es exponer a usuarios autenticados una vista operativa de las alertas de deforestación y del movimiento asociado a cadenas productivas, con filtros, mapas, tablas y gráficas pensadas para exploración y descarga de información.

En la arquitectura general, esta app recibe credenciales desde Keycloak, valida el token contra la API de GanaBosques, consulta datos geoespaciales y de riesgo desde los servicios backend y devuelve interfaces interactivas para vereda, predio, empresa y reportes. En términos prácticos:

- Recibe sesiones autenticadas mediante Keycloak y conserva el estado de usuario, token y payload validado en el cliente.
- Consulta la API de GanaBosques para validar token y recuperar información de alertas, riesgo, movimiento y entidades relacionadas.
- Renderiza mapas con Leaflet, tablas paginadas y gráficas con ApexCharts.
- Restringe pantallas y enlaces según permisos como `front_adm`, `front_farms`, `front_enterprise` y `front_report`.
- Permite exportar resultados mediante generación de PDF, CSV y vistas resumidas para descarga.

## 🏗️ Estructura del proyecto
```text
ganabosques_app/
├── .github/
│   └── workflows/
│       └── pipeline.yaml
├── pipelines/
│   └── pipeline-test.yml
├── public/
│   ├── adm3ids.csv
│   ├── bosque.png
│   ├── logo.png
│   ├── logobyg.png
│   ├── triste.png
│   └── otros recursos gráficos e imágenes
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.jsx
│   │   ├── page.jsx
│   │   ├── acercade/
│   │   │   └── page.jsx
│   │   ├── alertaempresas/
│   │   │   └── page.jsx
│   │   ├── alertapredios/
│   │   │   └── page.jsx
│   │   ├── alertasnacionales/
│   │   │   └── page.jsx
│   │   ├── dashboard/
│   │   │   └── page.jsx
│   │   └── reporte/
│   │       └── page.jsx
│   ├── components/
│   │   ├── maps/
│   │   │   ├── ArrowLayer.jsx
│   │   │   ├── BaseMap.jsx
│   │   │   ├── DashboardMap.jsx
│   │   │   ├── EnterpriseMovementLayers.jsx
│   │   │   ├── EnterpriseRiskMap.jsx
│   │   │   ├── FarmMovementLayers.jsx
│   │   │   ├── FarmNavigationHelpers.jsx
│   │   │   ├── FarmRiskLayers.jsx
│   │   │   ├── FarmRiskMap.jsx
│   │   │   ├── NationalNavigationHelpers.jsx
│   │   │   ├── NationalRiskLayers.jsx
│   │   │   └── NationalRiskMap.jsx
│   │   ├── shared/
│   │   │   ├── ExpandableCodeCell.jsx
│   │   │   ├── InfoTooltip.jsx
│   │   │   ├── RiskChip.jsx
│   │   │   ├── SortIcon.jsx
│   │   │   ├── VerificationChip.jsx
│   │   │   └── index.js
│   │   ├── Adm3HistoricalRisk.jsx
│   │   ├── Adm3RiskTable.jsx
│   │   ├── Banner.jsx
│   │   ├── CustomSelect.jsx
│   │   ├── DownloadPdfButton.jsx
│   │   ├── EnterpriseChart.jsx
│   │   ├── EnterpriseRiskTable.jsx
│   │   ├── FarmRiskTable.jsx
│   │   ├── FilterBar.jsx
│   │   ├── FilterChips.jsx
│   │   ├── FilterSelects.jsx
│   │   ├── FloatingDownloadMenu.jsx
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── Legend.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Map.jsx
│   │   ├── MovementChart.jsx
│   │   ├── MultiPeriodSelect.jsx
│   │   ├── RiskDataTable.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Toast.jsx
│   │   └── Unauthorized.jsx
│   ├── contexts/
│   │   └── MapFiltersContext.jsx
│   ├── hooks/
│   │   ├── useAdm3Details.js
│   │   ├── useAdm3Risk.js
│   │   ├── useAuth.js
│   │   ├── useDeforestationAnalysis.js
│   │   ├── useEnterpriseMovementStats.js
│   │   ├── useFarmPolygons.js
│   │   ├── useFarmRisk.js
│   │   ├── useFilterBarLogic.js
│   │   ├── useFilteredMovement.js
│   │   ├── useFilterState.js
│   │   ├── useLoadingState.js
│   │   ├── useMapState.js
│   │   └── useMovementStats.js
│   ├── services/
│   │   ├── apiService.js
│   │   ├── config.js
│   │   ├── tokenService.js
│   │   └── __tests__/
│   │       ├── apiService.test.js
│   │       ├── config.test.js
│   │       └── tokenService.test.js
│   └── utils/
│       ├── chartUtils.js
│       ├── exportCSV.js
│       ├── formatUtils.js
│       ├── index.js
│       ├── mapUtils.js
│       ├── permissions.js
│       ├── tableStyles.js
│       └── __tests__/
│           ├── chartUtils.test.js
│           ├── formatUtils.test.js
│           ├── mapUtils.test.js
│           └── tableStyles.test.js
├── .env.example
├── Dockerfile
├── DOCKER_GUIDE.md
├── eslint.config.mjs
├── jest.config.js
├── Jenkinsfile
├── jsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
└── tailwind.config.js
```

> Nota: `.env`, `.next/`, `node_modules/`, cachés de build, reportes temporales y logs locales son artefactos de ejecución y no forman parte del código fuente.

## ⚙️ Requisitos
- Node.js 22.X (runtime usado en el Dockerfile y en el despliegue por contenedor)
- npm
- Dependencias clave declaradas en [package.json](package.json):
	- next 15.3.6
	- react 19.2.1
	- react-dom 19.2.1
	- tailwindcss 4
	- react-leaflet 5.0.0-rc.2
	- keycloak-js 26.2.0
	- axios 1.11.0
	- apexcharts 5.3.2
	- react-apexcharts 1.7.0
	- html2canvas 1.4.1
	- html2pdf.js 0.14.0
	- jspdf 4.2.1
	- jspdf-autotable 5.0.8
	- proj4 2.19.10
	- reproject 1.2.7

## 🔐 Variables de entorno
Las variables públicas consumidas por el código están centralizadas en [src/services/config.js](src/services/config.js) y se documentan también en [.env.example](.env.example). No se incluyen variables de infraestructura del servidor como puertos o nombres de host de despliegue, porque no forman parte del contrato funcional de la app.

| Variable | Ejemplo | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://ganaapi.alliance.cgiar.org/` | Base URL de la API de GanaBosques que consumen `tokenService` y `apiService`. |
| `NEXT_PUBLIC_KEYCLOAK_URL` | `https://your-keycloak-instance.com` | URL del servidor Keycloak usado por `keycloak-js` para iniciar sesión y renovar sesión. |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `your-realm` | Realm de Keycloak donde está registrado el cliente de esta app. |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `your-client-id` | Client ID de Keycloak que identifica este frontend. |
| `NEXT_PUBLIC_GEOSERVER_URL` | `https://your-geoserver-instance.com` | URL base de GeoServer para la visualización de capas y recursos geoespaciales. |

## 🚀 Instalación
Este proyecto puede ejecutarse en dos modos: localmente con npm, o en contenedor Docker. En ambos casos debes partir de las variables públicas de la app y de la disponibilidad de la API, Keycloak y GeoServer.

### Entorno local
Para este modo necesitas Node.js 22.X, npm y acceso a la configuración pública de la app. El flujo local está pensado para desarrollo diario y pruebas rápidas.

```bash
git clone https://github.com/CIAT-DAPA/ganabosques_app.git
cd ganabosques_app
npm ci
```

Antes de arrancar, copia [.env.example](.env.example) a `.env` y ajusta los valores según tu entorno local.

### Con Docker
Si prefieres un entorno reproducible, la construcción y ejecución en contenedor están documentadas en [DOCKER_GUIDE.md](DOCKER_GUIDE.md). Esa guía explica cómo se inyectan las variables públicas en tiempo de build y cómo queda empaquetado el frontend.

## ▶️ Ejecutar el proyecto
Una vez instaladas las dependencias y configurado el entorno, puedes levantar la aplicación en desarrollo con:

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

### Producción
Para producción, el flujo real del proyecto es construir primero y arrancar después:

```bash
npm run build
npm start
```

El `Dockerfile` usa `npm start` sobre `node:22-alpine` y expone el puerto 3000. En Jenkins, el pipeline arranca el proceso con PM2 como `gana` y define `PORT=5000 NODE_ENV=production` antes de ejecutar `npm start`.

## 📡 Pantallas principales
| Ruta / Pantalla | Uso principal |
| --- | --- |
| `/` | Página de inicio con hero, acceso a la exploración y navegación según sesión. |
| `/acercade` | Información institucional del proyecto, propósito, alcance y socios. |
| `/alertasnacionales` | Mapa de alertas nacionales de deforestación con acceso controlado por permiso `front_adm/read`. |
| `/alertapredios` | Mapa y consulta de alertas por predio, protegido por `front_farms/read`. |
| `/alertaempresas` | Vista de alertas asociadas a empresas y su cadena de proveeduría, protegida por `front_enterprise/read`. |
| `/dashboard` | Tablero con datos tabulados y mapa para consulta operativa, protegido por `front_report/read`. |
| `/reporte` | Generación y exportación de reportes por vereda, finca o empresa, protegido por `front_report/read`. |

## 🔒 Autenticación
La autenticación se implementa en el cliente mediante `keycloak-js` dentro de [src/hooks/useAuth.js](src/hooks/useAuth.js). El proveedor crea la instancia de Keycloak con `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM` y `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`, y la inicializa con `check-sso` para detectar sesión activa sin forzar redirección inmediata.

Si el usuario está autenticado, la app guarda `token`, `tokenParsed`, `userInfo` y el payload validado contra backend. El `access_token` se valida con [src/services/tokenService.js](src/services/tokenService.js) llamando a `auth/token/validate` sobre `NEXT_PUBLIC_API_URL`. Solo se habilita el acceso a pantallas protegidas cuando el payload devuelto confirma permisos o cuando `user_db.admin` es verdadero.

El flujo también renueva el token cada 30 segundos con `updateToken(60)`, obtiene información de usuario con `loadUserInfo()` y ejecuta logout con redirección a la raíz de la app. El header usa `hasPermission` desde [src/utils/permissions.js](src/utils/permissions.js) para mostrar u ocultar enlaces según `front_adm`, `front_farms`, `front_enterprise` y `front_report`.

## 🧪 Testing
El comando usado por los pipelines es:

```bash
npm test
```

La cobertura funcional actual se concentra en pruebas para configuración, validación de token, helpers de API, formatos, mapas, tablas y utilidades de gráficas. El workflow de GitHub Actions y el pipeline de Azure DevOps instalan dependencias con `npm ci` y luego ejecutan `npm test`.

## 👥 Mantenedores / Licencia
Mantenedores: [CIAT-DAPA](https://github.com/CIAT-DAPA) / Alliance Bioversity-CIAT.

- [CIAT-DAPA](https://github.com/CIAT-DAPA)
- [Alliance Bioversity-CIAT](https://alliancebioversityciat.org/)
- [stevensotelo](https://github.com/stevensotelo)
- [victor-993](https://github.com/victor-993)

