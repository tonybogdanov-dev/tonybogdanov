ARG BASE_PLATFORM=linux/arm64/v8

FROM --platform=$BASE_PLATFORM node:24 AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY patches ./patches
RUN npm ci

FROM deps AS build

COPY tsconfig.json vite.config.ts tailwind.config.ts index.html ./
COPY config.base.ts config.node.ts config.browser.ts ./
COPY config ./config
COPY src ./src
COPY public ./public
RUN npx tsc && npx vite build

FROM --platform=$BASE_PLATFORM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=48 --max-semi-space-size=2" \
    UV_THREADPOOL_SIZE=2 \
    MALLOC_ARENA_MAX=2

COPY package.json server.js check-env.js ./
COPY src/api ./src/api
COPY --from=build /app/.dist ./.dist

EXPOSE 3000
CMD ["node", "server.js"]
