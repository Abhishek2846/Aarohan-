const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'Backend', 'api');
const frontendDir = path.join(rootDir, 'Frontend');

console.log('\n========================================');
console.log('   Aarohan Full Workspace Build     ');
console.log('========================================\n');

try {
  console.log('📦 [1/2] Building NestJS Backend...');
  execSync('npm run build', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ Backend build complete.\n');

  console.log('📦 [2/2] Building Next.js Frontend...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log('✅ Frontend build complete.\n');

  console.log('🎉 Full Aarohan Workspace Build Succeeded!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
