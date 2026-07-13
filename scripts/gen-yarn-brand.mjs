// Generates Yarn brand SVG + PNG assets. Run: npx tsx scripts/gen-yarn-brand.ts
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const result = spawnSync('npx', ['tsx', join(dir, 'gen-yarn-brand.ts')], {
  stdio: 'inherit',
  shell: true,
});
process.exit(result.status ?? 1);
