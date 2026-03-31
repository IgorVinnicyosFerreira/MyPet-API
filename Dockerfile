FROM node:24.13.1

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \
&& rm -rf /var/lib/apt/lists/*


# Use corepack to enable pnpm (matches packageManager pnpm@10.x)
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# instala Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH

# Copy package manifests and lockfile first for better caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy project files
COPY . .

EXPOSE 3333

CMD ["pnpm", "dev"]
