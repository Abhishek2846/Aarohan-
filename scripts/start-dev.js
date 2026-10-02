const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { freePorts } = require('./free-ports');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'Backend', 'api');
const frontendDir = path.join(rootDir, 'Frontend');

const BACKEND_PORT = process.env.PORT || '3001';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '3000';

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIpAddress();

// Free ports 3000 and 3001 if occupied by leftover background processes
freePorts([BACKEND_PORT, FRONTEND_PORT]);

console.log('\n========================================');
console.log('      Aarohan Development Server     ');
console.log('========================================\n');
console.log(`Local PC Browser → http://localhost:${FRONTEND_PORT}`);
console.log(`Same Wi-Fi PC   → http://${localIp}:${FRONTEND_PORT}`);
console.log(`Backend API      → http://${localIp}:${BACKEND_PORT}/v1 (Docs: http://localhost:${BACKEND_PORT}/api/docs)\n`);
console.log('Starting NestJS Backend and Next.js Frontend in parallel...\n');

// Save local URLs into PUBLIC_URL.txt for easy reference
const publicUrlFile = path.join(rootDir, 'PUBLIC_URL.txt');
fs.writeFileSync(
  publicUrlFile,
  `==================================================\n  AAROHAN SHAREABLE DEMO LINKS\n==================================================\n\n1. Same Wi-Fi / Local Network Link :\n   http://${localIp}:${FRONTEND_PORT}\n\n2. Local Host Link :\n   http://localhost:${FRONTEND_PORT}\n\nBackend API URL : http://${localIp}:${BACKEND_PORT}/v1\n`,
  'utf8'
);

let browserOpened = false;

function openBrowser(url) {
  if (browserOpened) return;
  browserOpened = true;
  console.log(`\n🚀 Auto-opening default browser to ${url} ...\n`);
  const platform = process.platform;
  if (platform === 'win32') {
    exec(`start ${url}`);
  } else if (platform === 'darwin') {
    exec(`open ${url}`);
  } else {
    exec(`xdg-open ${url}`);
  }
}

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Spawn Backend Process
const backendProc = spawn(npmCmd, ['run', 'start:dev'], {
  cwd: backendDir,
  shell: true,
  env: { ...process.env, PORT: BACKEND_PORT, FRONTEND_URL: `http://${localIp}:${FRONTEND_PORT}` },
});

// Spawn Frontend Process
const frontendProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  env: { ...process.env, PORT: FRONTEND_PORT, NEXT_PUBLIC_API_URL: `http://${localIp}:${BACKEND_PORT}/v1` },
});

// Automatic browser launch after server readiness or 3.5-second fallback
setTimeout(() => {
  openBrowser(`http://localhost:${FRONTEND_PORT}`);
}, 3500);

function printFinalBanner() {
  console.log('\n\x1b[42m\x1b[30m\x1b[1m                                                            \x1b[0m');
  console.log('\x1b[42m\x1b[30m\x1b[1m  🚀 AAROHAN APPLICATION IS LIVE & READY ON PORT 3000!   \x1b[0m');
  console.log('\x1b[42m\x1b[30m\x1b[1m                                                            \x1b[0m\n');
  console.log(`  👉 Local Browser Link     : \x1b[1m\x1b[33mhttp://localhost:${FRONTEND_PORT}\x1b[0m`);
  console.log(`  👉 Same Wi-Fi Other PC    : \x1b[1m\x1b[36mhttp://${localIp}:${FRONTEND_PORT}\x1b[0m`);
  console.log(`  📄 Links saved in file    : \x1b[32mPUBLIC_URL.txt\x1b[0m in root folder`);
  console.log('\n\x1b[32m============================================================\x1b[0m\n');
}

function prefixOutput(data, prefix, colorCode) {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
      const cleanLine = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
      if (prefix === 'FRONTEND' && (
        cleanLine.toLowerCase().includes('ready') ||
        cleanLine.toLowerCase().includes('local:') ||
        cleanLine.includes('3000')
      )) {
        openBrowser(`http://localhost:${FRONTEND_PORT}`);
      }
      if (prefix === 'BACKEND' && cleanLine.includes('Nest application successfully started')) {
        setTimeout(printFinalBanner, 800);
      }
    }
  });
}

backendProc.stdout.on('data', (data) => prefixOutput(data, 'BACKEND', '36'));
backendProc.stderr.on('data', (data) => prefixOutput(data, 'BACKEND', '31'));

frontendProc.stdout.on('data', (data) => prefixOutput(data, 'FRONTEND', '32'));
frontendProc.stderr.on('data', (data) => prefixOutput(data, 'FRONTEND', '33'));

function killProcesses() {
  console.log('\n\nShutting down Aarohan development servers...');
  if (isWin) {
    if (backendProc.pid) exec(`taskkill /pid ${backendProc.pid} /t /f`);
    if (frontendProc.pid) exec(`taskkill /pid ${frontendProc.pid} /t /f`);
  } else {
    backendProc.kill('SIGINT');
    frontendProc.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);
