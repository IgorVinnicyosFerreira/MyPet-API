FROM node:24.13.1

WORKDIR /usr/src/app

# Use corepack to enable pnpm (matches packageManager pnpm@10.x)
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy package manifests and lockfile first for better caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy project files
COPY . .

EXPOSE 3333

CMD ["pnpm", "dev"]
