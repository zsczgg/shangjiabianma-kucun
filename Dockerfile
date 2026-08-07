ARG NODE_BASE_IMAGE=node:22-bookworm
ARG RUNTIME_BASE_IMAGE=node:22-bookworm-slim
FROM ${NODE_BASE_IMAGE} AS deps
WORKDIR /inventory-app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
FROM ${NODE_BASE_IMAGE} AS builder
WORKDIR /inventory-app
ENV NODE_ENV=production
COPY --from=deps /inventory-app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build
FROM ${RUNTIME_BASE_IMAGE} AS runner
WORKDIR /inventory-app
ENV NODE_ENV=production \
    PORT=3220 \
    HOSTNAME=0.0.0.0 \
    TZ=Asia/Shanghai
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /inventory-app/public ./public
COPY --from=builder /inventory-app/.next/standalone ./
COPY --from=builder /inventory-app/.next/static ./.next/static
COPY --from=builder /inventory-app/prisma ./prisma
COPY --from=builder /inventory-app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /inventory-app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /inventory-app/node_modules/@prisma/engines-version ./node_modules/@prisma/engines-version
COPY --from=builder /inventory-app/node_modules/@prisma/debug ./node_modules/@prisma/debug
COPY --from=builder /inventory-app/node_modules/@prisma/fetch-engine ./node_modules/@prisma/fetch-engine
COPY --from=builder /inventory-app/node_modules/@prisma/get-platform ./node_modules/@prisma/get-platform
RUN mkdir -p ./node_modules/.bin \
    && ln -s ../prisma/build/index.js ./node_modules/.bin/prisma
EXPOSE 3220
ENTRYPOINT []
CMD ["sh","-c","npx prisma db push --skip-generate && node server.js"]
