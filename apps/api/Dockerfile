FROM node:22.22.0-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @superman/api build

FROM node:22.22.0-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 8787
CMD ["node", "dist/server.js"]
