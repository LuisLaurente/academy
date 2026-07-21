FROM node:24-alpine

ENV HUSKY=0
WORKDIR /workspace

RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "dev:web"]
