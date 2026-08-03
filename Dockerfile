FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GEOSERVER_URL
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID

RUN sh -c ' \
    for v in NEXT_PUBLIC_API_URL NEXT_PUBLIC_GEOSERVER_URL NEXT_PUBLIC_KEYCLOAK_URL NEXT_PUBLIC_KEYCLOAK_REALM NEXT_PUBLIC_KEYCLOAK_CLIENT_ID; do \
      eval val=\${$v}; \
      if [ -z "$val" ]; then unset "$v"; echo "→ $v vacío, se usará el del .env"; \
      else echo "→ $v tomado del --build-arg"; fi; \
    done; \
    npm run build'

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
