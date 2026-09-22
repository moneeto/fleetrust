# No se ejecutó en esta sandbox (Docker no tiene daemon disponible acá);
# queda como plantilla lista para una máquina con Docker real.
FROM node:20-slim AS build
WORKDIR /repo
COPY package.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace=apps/web --include-workspace-root
COPY apps/web apps/web
RUN npm run build --workspace=apps/web

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/.next ./apps/web/.next
COPY --from=build /repo/apps/web/package.json ./apps/web/package.json
COPY --from=build /repo/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=build /repo/node_modules ./node_modules
WORKDIR /repo/apps/web
EXPOSE 5000
CMD ["npx", "next", "start", "-p", "5000"]
