FROM oven/bun:1-alpine AS base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run deploy-commands

CMD ["bun", "run", "index.js"]
