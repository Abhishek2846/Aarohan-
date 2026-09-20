const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const localtunnel = require('localtunnel');
const { freePorts } = require('./free-ports');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'Backend', 'api');
const frontendDir = path.join(rootDir, 'Frontend');

const BACKEND_PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3000', 10);

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

let frontendTunnel = null;
let backendTunnel = null;

async function startPublicDemo() {
  console.log('\n==================================================');
  console.log('       BhoomiSetu Public Remote Demo Mode      ');
  console.log('==================================================\n');
  console.log('Starting NestJS Backend and Next.js Frontend...\n');

  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  let publicFrontendUrl = `http://${localIp}:${FRONTEND_PORT}`;
  let publicBackendUrl = `http://${localIp}:${BACKEND_PORT}/v1`;

  // Write initial shareable IP URL to PUBLIC_URL.txt
  const publicUrlFile = path.join(rootDir, 'PUBLIC_URL.txt');
  const initialContent = `==================================================\n  BHOOMISETU SHAREABLE DEMO LINKS\n==================================================\n\n1. Same Wi-Fi / Local Network Link :\n   http://${localIp}:${FRONTEND_PORT}\n\n2. Public Internet Link : Initializing...\n`;
  fs.writeFileSync(publicUrlFile, initialContent, 'utf8');

  // Spawn Backend Process with CORS allowed for all origins
  const backendProc = spawn(npmCmd, ['run', 'start:dev'], {
    cwd: backendDir,
    shell: true,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
    },
  });

  // Spawn Frontend Process configured with local IP API URL
  const frontendProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    env: {
      ...process.env,
      PORT: String(FRONTEND_PORT),
      NEXT_PUBLIC_API_URL: publicBackendUrl,
    },
  });

  let browserOpened = false;
  function openBrowser(url) {
    if (browserOpened) return;
    browserOpened = true;
    console.log(`\n🚀 Auto-opening local browser to ${url} ...\n`);
    const platform = process.platform;
    if (platform === 'win32') exec(`start ${url}`);
    else if (platform === 'darwin') exec(`open ${url}`);
    else exec(`xdg-open ${url}`);
  }

  setTimeout(() => {
    openBrowser(`http://localhost:${FRONTEND_PORT}`);
  }, 3500);

  let tunnelInitialized = false;

  async function initializeTunnels() {
    if (tunnelInitialized) return;
    tunnelInitialized = true;
    console.log('\n⌛ Servers active! Establishing live public internet tunnel...\n');
    try {
      frontendTunnel = await localtunnel({ port: FRONTEND_PORT, local_host: '127.0.0.1' });
      publicFrontendUrl = frontendTunnel.url;

      backendTunnel = await localtunnel({ port: BACKEND_PORT, local_host: '127.0.0.1' });
      publicBackendUrl = `${backendTunnel.url}/v1`;

      const fileContent = `==================================================\n  BHOOMISETU SHAREABLE DEMO LINKS\n==================================================\n\n1. Same Wi-Fi / Local Network Link :\n   http://${localIp}:${FRONTEND_PORT}\n\n2. Public Internet Tunnel Link :\n   ${publicFrontendUrl}\n\nShare either of the links above with anyone on any PC or mobile device!\n`;
      fs.writeFileSync(publicUrlFile, fileContent, 'utf8');

      printFinalBanner(true);
    } catch (err) {
      console.log('⚠️ Tunnel error, using local network IP mode.');
      printFinalBanner(false);
    }
  }

  function printFinalBanner(isPublic) {
    console.log('\n\x1b[42m\x1b[30m\x1b[1m                                                            \x1b[0m');
    console.log('\x1b[42m\x1b[30m\x1b[1m  🚀 BHOOMISETU APP IS LIVE AND READY FOR REMOTE DEMO!      \x1b[0m');
    console.log('\x1b[42m\x1b[30m\x1b[1m                                                            \x1b[0m\n');
    if (isPublic && frontendTunnel) {
      console.log(`  👉 Public Internet Link (Anywhere) : \x1b[1m\x1b[33m${publicFrontendUrl}\x1b[0m`);
    }
    console.log(`  👉 Same Wi-Fi Other PC             : \x1b[1m\x1b[36mhttp://${localIp}:${FRONTEND_PORT}\x1b[0m`);
    console.log(`  📄 All links saved in root file    : \x1b[32mPUBLIC_URL.txt\x1b[0m`);
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
          initializeTunnels();
        }
      }
    });
  }

  backendProc.stdout.on('data', (data) => prefixOutput(data, 'BACKEND', '36'));
  backendProc.stderr.on('data', (data) => prefixOutput(data, 'BACKEND', '31'));

  frontendProc.stdout.on('data', (data) => prefixOutput(data, 'FRONTEND', '32'));
  frontendProc.stderr.on('data', (data) => prefixOutput(data, 'FRONTEND', '33'));

  function killProcesses() {
    console.log('\nShutting down public demo servers and closing tunnels...');
    if (frontendTunnel) frontendTunnel.close();
    if (backendTunnel) backendTunnel.close();
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
}

startPublicDemo();
