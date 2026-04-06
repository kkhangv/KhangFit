const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Run vite directly from node_modules (no npx needed)
const viteBin = path.join(projectRoot, 'node_modules', '.bin', 'vite');
require('child_process').execSync(
  `"${process.execPath}" "${viteBin}" dev --port 5173`,
  { stdio: 'inherit' }
);
