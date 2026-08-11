FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --spider --quiet http://127.0.0.1:8080/api/health || exit 1

CMD ["sh", "-c", "npm run db:migrate:local:built && npx wrangler dev --config dist/lol_skill_lab/wrangler.json --local --persist-to /app/.wrangler --ip 0.0.0.0 --port 8080"]
