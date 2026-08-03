ARG NODE_BASE_IMAGE=node:22-bookworm
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
FROM ${NODE_BASE_IMAGE} AS runner
WORKDIR /inventory-app
ENV NODE_ENV=production
COPY --from=builder /inventory-app/public ./public
COPY --from=builder /inventory-app/.next/standalone ./
COPY --from=builder /inventory-app/.next/static ./.next/static
COPY --from=builder /inventory-app/prisma ./prisma
COPY --from=builder /inventory-app/node_modules ./node_modules
EXPOSE 3220
CMD ["sh","-c","npx prisma db push && node server.js"]
