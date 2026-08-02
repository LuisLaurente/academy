# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile --ignore-scripts

ARG NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @learning-os/web build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

EXPOSE 3000

CMD ["pnpm", "--filter", "@learning-os/web", "start"]
