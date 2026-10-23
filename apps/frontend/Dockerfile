FROM node:24-alpine

RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY e2e/package.json ./e2e/

RUN pnpm install --frozen-lockfile --filter bis-frontend...

COPY apps/frontend ./apps/frontend

WORKDIR /repo/apps/frontend

EXPOSE 5173

CMD ["pnpm", "dev"]
