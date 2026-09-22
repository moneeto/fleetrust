# No se ejecutó en esta sandbox (Docker no tiene daemon disponible acá);
# queda como plantilla lista para una máquina con Docker real.
FROM node:20-slim AS build
WORKDIR /repo
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspace=apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build --workspace=apps/api

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
EXPOSE 5001
CMD ["node", "dist/index.js"]
