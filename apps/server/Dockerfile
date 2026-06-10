FROM oven/bun:1-slim AS base
WORKDIR /app
# frozen-lockfile validation requires every workspace member's package.json
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production
COPY packages/shared packages/shared
COPY apps/server apps/server
ENV NODE_ENV=production
USER bun
EXPOSE 3000
CMD ["bun", "run", "apps/server/src/index.ts"]
