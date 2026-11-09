FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@10.34.9
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @sarvin/api --frozen-lockfile
COPY apps/api apps/api
COPY docs/contracts/api.d.ts docs/contracts/api.d.ts
RUN pnpm --filter @sarvin/api build
RUN pnpm --filter @sarvin/api deploy --legacy --prod /out

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3001
COPY --from=build --chown=node:node /out ./
# Deploy respects ignore files; copy compiled output explicitly.
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
