# Guía de Docker - Ganabosques App

## Descripción general

Este proyecto se despliega con un solo Dockerfile multi-stage para producción. La guía no cubre Docker Compose ni un flujo de desarrollo con contenedores; la referencia oficial para variables locales es `.env.example`.

Importante: al ser una aplicación Next.js, las variables `NEXT_PUBLIC_*` se incrustan en el bundle JavaScript en **tiempo de build**, no en tiempo de ejecución. Por eso, a diferencia de otros servicios del proyecto (como el web admin en Flask), aquí las variables se pasan al construir la imagen (`docker build`), no al levantar el contenedor (`docker run`).

## Dockerfile

El Dockerfile actual usa tres etapas:

- `deps`: instala dependencias con `npm ci`
- `builder`: copia el código fuente, recibe las variables `NEXT_PUBLIC_*` como `ARG` y ejecuta `npm run build`
- `runner`: ejecuta la aplicación con `node:22-alpine`, `NODE_ENV=production`, `PORT=3000` y `npm start`

### Cómo se resuelven las variables en el build

El stage `builder` declara un `ARG` por cada variable pública. Si no se pasa ese argumento al construir la imagen, la variable queda sin valor en el entorno del build y Next.js la toma automáticamente desde el archivo `.env` copiado al contexto (por el `COPY . .`). Si sí se pasa el argumento, ese valor tiene prioridad sobre lo que haya en el `.env`.

En resumen:

- **No pasas `--build-arg`** → se usa el valor del `.env` presente en la raíz del proyecto al momento del build.
- **Sí pasas `--build-arg`** → ese valor sobrescribe al del `.env` para esa variable puntual.

## Inicio rápido

### 1. Preparar variables de entorno

Antes de construir la imagen, crea un archivo `.env` a partir de `.env.example` en la raíz del proyecto y ajusta los valores necesarios. Este archivo debe existir en el contexto del build (junto al Dockerfile) para que sirva como fuente de valores por defecto.

### 2. Construir la imagen

**Usando únicamente el `.env`** (sin pasar argumentos):

```bash
docker build -t ganabosques-app:latest .
```

**Pasando valores explícitos** (sobrescriben al `.env` solo para esas variables):

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://ganaapi.alliance.cgiar.org/ \
  --build-arg NEXT_PUBLIC_KEYCLOAK_URL=https://ganausers.alliance.cgiar.org \
  --build-arg NEXT_PUBLIC_KEYCLOAK_REALM=GanaBosques \
  --build-arg NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=GanabosquesWeb \
  --build-arg NEXT_PUBLIC_GEOSERVER_URL=https://ganageo.alliance.cgiar.org \
  -t ganabosques-app:latest .
```

Se pueden pasar solo algunas variables como argumento; las que no se indiquen seguirán tomándose del `.env`.

### 3. Ejecutar el contenedor

```bash
docker run -d \
  --name ganabosques-app \
  -p 3000:3000 \
  ganabosques-app:latest
```

No es necesario (ni tiene efecto) pasar `-e` o `--env-file` con las variables `NEXT_PUBLIC_*` en este paso, ya que quedaron incrustadas en el bundle durante el build.

### 4. Probar la aplicación

```bash
curl http://localhost:3000
```

## Variables de entorno

La aplicación usa estas variables públicas desde `src/services/config.js`:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL de la API backend | `http://localhost:8000/` |
| `NEXT_PUBLIC_KEYCLOAK_URL` | URL del servidor Keycloak | `""` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Realm de Keycloak | `""` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Client ID de Keycloak | `""` |
| `NEXT_PUBLIC_GEOSERVER_URL` | URL base de GeoServer | `http://localhost:8081` |

También se usa `NODE_ENV=production` dentro del contenedor y `PORT=3000` para el servidor de Next.js.

## Contenido de `.env.example`

El archivo `.env.example` debe servir como plantilla para la configuración local y de Docker. Su contenido esperado es:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_KEYCLOAK_URL`
- `NEXT_PUBLIC_KEYCLOAK_REALM`
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`
- `NEXT_PUBLIC_GEOSERVER_URL`

## Buenas prácticas

- Mantén el archivo `.env` fuera del control de versiones.
- Verifica que `NEXT_PUBLIC_GEOSERVER_URL` apunte al GeoServer correcto antes de construir la imagen.
- Si cambias cualquier variable `NEXT_PUBLIC_*` (ya sea en el `.env` o vía `--build-arg`), **reconstruye la imagen**: al estar incrustadas en el bundle, no basta con reiniciar el contenedor.
- Si vas a distribuir distintas versiones para distintos ambientes (dev/staging/producción), construye una imagen por ambiente, o usa `--build-arg` en el pipeline de CI/CD correspondiente para inyectar los valores correctos en cada caso.

## Solución de problemas

Si la aplicación no responde, revisa los logs del contenedor con `docker logs ganabosques` y valida que el puerto 3000 no esté ocupado en tu máquina.

Si alguna URL (API, Keycloak, GeoServer) parece incorrecta una vez desplegada, verifica qué valor quedó incrustado en el bundle:

```bash
docker run --rm ganabosques-app:latest sh -c "grep -r 'https://tu-dominio' /app/.next/static 2>/dev/null | head -1"
```

Si no aparece nada, probablemente el build tomó otro valor (revisa el `.env` usado en ese build o los `--build-arg` pasados) y toca reconstruir la imagen con el valor correcto.