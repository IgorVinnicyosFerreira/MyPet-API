export default {
  '*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}': ['biome check --staged'],
  '*.{ts,d.cts,d.mts,tsx}': [() => 'pnpm run typecheck'],
};
