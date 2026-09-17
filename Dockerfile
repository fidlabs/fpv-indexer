FROM node:24-alpine AS base

RUN apk update \
  && apk upgrade --no-cache \
  && apk add --no-cache openssl \
  && rm -rf /var/cache/apk/*

WORKDIR /app


FROM base AS builder

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Not existing database to shut up prisma during types generation
RUN DATABASE_URL="postgresql://not:existing@localhost:5432/database" npm run schema:emit
RUN npm run build


FROM base AS runtime

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && npm run start:prod"]
