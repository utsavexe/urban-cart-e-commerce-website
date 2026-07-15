const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const seedPath = path.join(__dirname, 'seed.ts');

if (fs.existsSync(seedPath)) {
  execSync('pnpm tsx prisma/seed.ts', { stdio: 'inherit' });
} else {
  console.error('❌ Seed file not found at:', seedPath);
  process.exit(1);
}
