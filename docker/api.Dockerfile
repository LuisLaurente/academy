FROM node:24-alpine

ENV HUSKY=0
WORKDIR /workspace

RUN apk add --no-cache openssl
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile && pnpm prisma:generate

EXPOSE 3001
CMD ["pnpm", "dev:api"]
