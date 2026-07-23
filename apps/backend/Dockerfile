FROM node:24-bookworm-slim AS toolchain

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

WORKDIR /app

FROM toolchain AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY tsconfig.base.json ./
COPY apps/backend apps/backend
COPY packages/shared packages/shared

RUN pnpm --filter @orion/backend db:generate
RUN pnpm --filter @orion/backend build

FROM toolchain AS runner

ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=3001
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=node:node /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=node:node /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=builder --chown=node:node /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=node:node /app/apps/backend/src/database/prisma/prisma-client.factory.ts ./apps/backend/src/database/prisma/prisma-client.factory.ts
COPY --from=builder --chown=node:node /app/apps/backend/dist ./apps/backend/dist

USER node

EXPOSE 3001

CMD ["node", "apps/backend/dist/main.js"]
