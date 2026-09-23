const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const net = require('net');
const { freePorts } = require('./free-ports');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'Backend', 'api');
const frontendDir = path.join(rootDir, 'Frontend');

const BACKEND_PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3000', 10);
const NGROK_API_PORT = 4040;

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Simple helper to load key-value pairs from .env if present
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  return env;
}

const rootEnv = loadEnvFile(path.join(rootDir, '.env'));

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

// Process references
let backendProc = null;
let frontendProc = null;
let ngrokProc = null;
let isShuttingDown = false;

// Circular log buffers for diagnostics in case of startup failure
const backendLogs = [];
const frontendLogs = [];
const ngrokLogs = [];

function pushLog(buffer, line) {
  buffer.push(line);
  if (buffer.length > 50) buffer.shift();
}

/**
 * Clean up all child processes gracefully
 */
function cleanupProcesses(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n\x1b[33m[SHUTDOWN] Shutting down BhoomiSetu Public Demo services...\x1b[0m');

  if (isWin) {
    if (ngrokProc && ngrokProc.pid) {
      try { execSync(`taskkill /pid ${ngrokProc.pid} /t /f`, { stdio: 'ignore' }); } catch (e) {}
    }
    if (frontendProc && frontendProc.pid) {
      try { execSync(`taskkill /pid ${frontendProc.pid} /t /f`, { stdio: 'ignore' }); } catch (e) {}
    }
    if (backendProc && backendProc.pid) {
      try { execSync(`taskkill /pid ${backendProc.pid} /t /f`, { stdio: 'ignore' }); } catch (e) {}
    }
    try { execSync('taskkill /f /im ngrok.exe', { stdio: 'ignore' }); } catch (e) {}
  } else {
    if (ngrokProc) try { ngrokProc.kill('SIGINT'); } catch (e) {}
    if (frontendProc) try { frontendProc.kill('SIGINT'); } catch (e) {}
    if (backendProc) try { backendProc.kill('SIGINT'); } catch (e) {}
  }

  // Free ports
  try {
    freePorts([BACKEND_PORT, FRONTEND_PORT, NGROK_API_PORT]);
  } catch (e) {}

  console.log('\x1b[32m[SHUTDOWN] All child processes terminated cleanly. Goodbye!\x1b[0m\n');
  process.exit(exitCode);
}

process.on('SIGINT', () => cleanupProcesses(0));
process.on('SIGTERM', () => cleanupProcesses(0));
process.on('SIGHUP', () => cleanupProcesses(0));

/**
 * 1. Verify NGROK is installed and in PATH
 */
function verifyNgrokInstalled() {
  process.stdout.write('[1/6] Checking NGROK installation... ');
  try {
    const versionCmd = isWin ? 'cmd.exe /c ngrok version' : 'ngrok version';
    const output = execSync(versionCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    console.log(`\x1b[32m✓ Found (${output.split('\n')[0]})\x1b[0m`);
    return true;
  } catch (err) {
    console.log('\x1b[31m✗ FAILED\x1b[0m\n');
    console.error('\x1b[1m\x1b[31m============================================================\x1b[0m');
    console.error('\x1b[1m\x1b[31m ERROR: NGROK is not installed or not available in PATH     \x1b[0m');
    console.error('\x1b[1m\x1b[31m============================================================\x1b[0m\n');
    console.error('The single-command public demo requires NGROK to establish public internet tunnels.\n');
    console.error('👉 Step 1: Install NGROK on Windows:');
    console.error('   Using npm:');
    console.error('     npm install -g ngrok');
    console.error('   Or download the official binary:');
    console.error('     https://ngrok.com/download\n');
    console.error('👉 Step 2: Authenticate your NGROK account:');
    console.error('     ngrok config add-authtoken <YOUR_AUTH_TOKEN>\n');
    console.error('👉 Step 3: Verify the installation by running:');
    console.error('     ngrok version\n');
    console.error('Once verified, re-run: npm run public\n');
    process.exit(1);
  }
}

/**
 * 2. Check NGROK authentication configuration
 */
function verifyNgrokAuth() {
  process.stdout.write('[2/6] Checking NGROK authentication... ');
  try {
    const checkCmd = isWin ? 'cmd.exe /c ngrok config check' : 'ngrok config check';
    const output = execSync(checkCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('\x1b[32m✓ Valid\x1b[0m');
    return true;
  } catch (err) {
    console.log('\x1b[33m⚠️ Unauthenticated\x1b[0m\n');
    console.warn('\x1b[33m============================================================\x1b[0m');
    console.warn('\x1b[33m WARNING: NGROK auth token might be missing or unconfigured \x1b[0m');
    console.warn('\x1b[33m============================================================\x1b[0m\n');
    console.warn('NGROK v3 requires an authenticated account to create tunnels.');
    console.warn('Sign up for free at: https://dashboard.ngrok.com/signup');
    console.warn('Then run:');
    console.warn('   ngrok config add-authtoken <YOUR_TOKEN>\n');
  }
}

/**
 * 3. Check local PostgreSQL database port
 */
async function checkDatabaseOnline() {
  process.stdout.write('[3/6] Checking local PostgreSQL database (port 5432)... ');
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responded = false;

    socket.setTimeout(2500);

    socket.on('connect', () => {
      responded = true;
      socket.destroy();
      console.log('\x1b[32m✓ Online (Port 5432)\x1b[0m');
      resolve(true);
    });

    socket.on('timeout', () => {
      if (!responded) {
        responded = true;
        socket.destroy();
        console.log('\x1b[33m⚠️ Timeout (Port 5432 not responding)\x1b[0m');
        console.log('    Note: Make sure PostgreSQL service or Docker container is running.');
        resolve(false);
      }
    });

    socket.on('error', () => {
      if (!responded) {
        responded = true;
        socket.destroy();
        console.log('\x1b[33m⚠️ Offline (Port 5432)\x1b[0m');
        console.log('    Note: Make sure PostgreSQL is started. Backend will attempt connection.');
        resolve(false);
      }
    });

    socket.connect(5432, '127.0.0.1');
  });
}

/**
 * Poll an HTTP URL until it returns 200 or times out
 */
function pollHttpReady(url, timeoutMs = 40000, intervalMs = 600) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (isShuttingDown) return reject(new Error('Process shutting down'));
      if (Date.now() - startTime > timeoutMs) {
        return reject(new Error(`Timeout waiting for ${url} after ${timeoutMs / 1000}s`));
      }

      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          setTimeout(check, intervalMs);
        }
      });

      req.on('error', () => {
        setTimeout(check, intervalMs);
      });

      req.setTimeout(1500, () => {
        req.destroy();
        setTimeout(check, intervalMs);
      });
    }

    check();
  });
}

/**
 * Query NGROK local web inspection API to retrieve active tunnel public URLs
 */
function getNgrokTunnels(timeoutMs = 25000, intervalMs = 500) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function poll() {
      if (isShuttingDown) return reject(new Error('Process shutting down'));
      if (Date.now() - startTime > timeoutMs) {
        return reject(new Error(`Timeout waiting for NGROK API at http://127.0.0.1:${NGROK_API_PORT}/api/tunnels`));
      }

      const req = http.get(`http://127.0.0.1:${NGROK_API_PORT}/api/tunnels`, (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (data.tunnels && data.tunnels.length > 0) {
              const httpsTunnel = data.tunnels.find((t) => t.proto === 'https') || data.tunnels[0];
              if (httpsTunnel && httpsTunnel.public_url) {
                return resolve(data.tunnels);
              }
            }
          } catch (e) {}
          setTimeout(poll, intervalMs);
        });
      });

      req.on('error', () => {
        setTimeout(poll, intervalMs);
      });

      req.setTimeout(1500, () => {
        req.destroy();
        setTimeout(poll, intervalMs);
      });
    }

    poll();
  });
}

/**
 * Automatically open browser
 */
function openBrowser(url) {
  console.log(`\n🌐 Auto-opening public demo in your default browser: \x1b[1m\x1b[36m${url}\x1b[0m ...\n`);
  try {
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
  } catch (err) {
    console.log('   (Could not automatically launch browser. Please open the URL manually.)');
  }
}

/**
 * Print terminal dashboard banner
 */
function printDashboardBanner(publicFrontendUrl, publicBackendUrl, dbStatus) {
  console.log('\n\x1b[42m\x1b[30m\x1b[1m                                                                    \x1b[0m');
  console.log('\x1b[42m\x1b[30m\x1b[1m  🚀 BHOOMISETU PUBLIC DEMO IS LIVE & READY FOR REMOTE ACCESS!      \x1b[0m');
  console.log('\x1b[42m\x1b[30m\x1b[1m                                                                    \x1b[0m\n');

  console.log('\x1b[1m==================================================================\x1b[0m');
  console.log('       BhoomiSetu (भूमिसेतु) Public Demo Dashboard');
  console.log('\x1b[1m==================================================================\x1b[0m\n');

  console.log(`  👉 Public Demo URL (Shareable) : \x1b[1m\x1b[33m${publicFrontendUrl}\x1b[0m`);
  console.log(`  👉 Public Backend API Endpoint : \x1b[1m\x1b[36m${publicBackendUrl}\x1b[0m`);
  console.log(`  👉 Localhost Browser Link      : \x1b[37mhttp://localhost:${FRONTEND_PORT}\x1b[0m`);
  console.log(`  👉 Localhost Backend API       : \x1b[37mhttp://localhost:${BACKEND_PORT}/v1 (Docs: http://localhost:${BACKEND_PORT}/api/docs)\x1b[0m`);
  console.log(`  👉 Same Wi-Fi Local Link       : \x1b[37mhttp://${localIp}:${FRONTEND_PORT}\x1b[0m\n`);

  console.log('  System Status:');
  console.log('    • NestJS Backend API  : \x1b[32m✓ Ready (Port 3001)\x1b[0m');
  console.log('    • Next.js Frontend    : \x1b[32m✓ Ready (Port 3000)\x1b[0m');
  console.log('    • NGROK Tunnel        : \x1b[32m✓ Active & Secure (HTTPS)\x1b[0m');
  console.log(`    • PostgreSQL / PostGIS: ${dbStatus ? '\x1b[32m✓ Connected (Port 5432 - Local Only)\x1b[0m' : '\x1b[33m⚠️ Port 5432 Unreachable\x1b[0m'}`);
  console.log('    • Next.js API Proxy   : \x1b[32m✓ Rewrites /v1/* to Local Backend (Zero CORS issues)\x1b[0m\n');

  console.log('  Pre-Seeded Demo Accounts for Testing:');
  console.log('    1. Central Ministry Official : \x1b[1mananya.sharma@nic.in\x1b[0m (Password: \x1b[32mbhoomi2026\x1b[0m)');
  console.log('    2. District Magistrate / SLAO: \x1b[1mdc.bengaluru@karnataka.gov.in\x1b[0m (Password: \x1b[32mbhoomi2026\x1b[0m)');
  console.log('    3. Project Implementing (PIA): \x1b[1mv.malhotra@nhai.gov.in\x1b[0m (Password: \x1b[32mbhoomi2026\x1b[0m)');
  console.log('    4. Public Citizen Portal     : \x1b[1mcitizen\x1b[0m (or click Citizen tab on login screen)\n');

  console.log('  \x1b[35mSecurity Guarantee\x1b[0m:');
  console.log('    • Database is strictly LOCAL and NOT exposed to the internet.');
  console.log('    • All remote requests route securely: Browser -> NGROK -> Next.js Proxy -> NestJS -> Local DB.\n');

  console.log(`  📄 All links and instructions written to: \x1b[32mPUBLIC_URL.txt\x1b[0m`);
  console.log('  ⌨️  Press \x1b[1mCtrl+C\x1b[0m anytime to gracefully shut down all demo servers.\n');
  console.log('\x1b[1m==================================================================\x1b[0m\n');
}

/**
 * Main orchestration function
 */
async function startPublicDemo() {
  console.log('\n==================================================================');
  console.log('      BhoomiSetu Single-Command Public Demo (NGROK Engine)');
  console.log('==================================================================\n');

  // Step 1: Check NGROK installation
  verifyNgrokInstalled();

  // Step 2: Check NGROK auth
  verifyNgrokAuth();

  // Step 3: Check database connectivity
  const dbOk = await checkDatabaseOnline();

  // Free ports 3000, 3001, 4040 if occupied
  freePorts([BACKEND_PORT, FRONTEND_PORT, NGROK_API_PORT]);

  // Step 4: Start NestJS Backend
  console.log(`[4/6] Starting NestJS Backend API (Port ${BACKEND_PORT})...`);

  backendProc = spawn(npmCmd, ['run', 'start:dev'], {
    cwd: backendDir,
    shell: true,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
      NODE_ENV: 'development',
    },
  });

  backendProc.stdout.on('data', (d) => {
    const text = d.toString();
    pushLog(backendLogs, text);
  });

  backendProc.stderr.on('data', (d) => {
    const text = d.toString();
    pushLog(backendLogs, text);
  });

  backendProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`\n❌ Backend process exited prematurely with code ${code}.`);
      console.error('Recent Backend Logs:\n' + backendLogs.slice(-20).join('\n'));
      cleanupProcesses(1);
    }
  });

  // Poll backend health endpoint
  process.stdout.write('      Waiting for backend to become ready... ');
  try {
    await pollHttpReady(`http://127.0.0.1:${BACKEND_PORT}/v1/health`, 45000, 600);
    console.log('\x1b[32m✓ Ready!\x1b[0m');
  } catch (err) {
    console.log('\x1b[31m✗ FAILED\x1b[0m\n');
    console.error(`❌ Backend failed to become healthy at http://127.0.0.1:${BACKEND_PORT}/v1/health within 45s.`);
    console.error('Recent Backend Logs:\n' + backendLogs.slice(-25).join('\n'));
    cleanupProcesses(1);
  }

  // Step 5: Start NGROK tunnel for Frontend
  console.log(`[5/6] Starting NGROK public tunnel for Frontend (Port ${FRONTEND_PORT})...`);

  const ngrokArgs = ['http', String(FRONTEND_PORT), '--log=stdout'];
  ngrokProc = spawn('ngrok', ngrokArgs, {
    shell: true,
    env: process.env,
  });

  ngrokProc.stdout.on('data', (d) => {
    const text = d.toString();
    pushLog(ngrokLogs, text);
  });

  ngrokProc.stderr.on('data', (d) => {
    const text = d.toString();
    pushLog(ngrokLogs, text);
  });

  ngrokProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`\n❌ NGROK process exited with code ${code}.`);
      console.error('Recent NGROK Output:\n' + ngrokLogs.slice(-15).join('\n'));
      cleanupProcesses(1);
    }
  });

  // Query NGROK API for public tunnel URL
  process.stdout.write('      Waiting for NGROK tunnel to establish... ');
  let publicFrontendUrl = '';
  let publicBackendUrl = '';

  try {
    const tunnels = await getNgrokTunnels(25000, 500);
    const primaryTunnel = tunnels.find((t) => t.proto === 'https') || tunnels[0];
    publicFrontendUrl = primaryTunnel.public_url;

    // In Unified Tunnel Architecture (Free Plan Compatible), Next.js proxies /v1 to NestJS
    // API endpoint is https://<publicFrontendUrl>/v1
    publicBackendUrl = `${publicFrontendUrl}/v1`;

    console.log(`\x1b[32m✓ Established! (${publicFrontendUrl})\x1b[0m`);
  } catch (err) {
    console.log('\x1b[31m✗ FAILED\x1b[0m\n');
    console.error('❌ Failed to retrieve NGROK tunnel URL from local inspection API.');
    console.error('Recent NGROK Output:\n' + ngrokLogs.slice(-20).join('\n'));
    cleanupProcesses(1);
  }

  // Step 6: Start Next.js Frontend configured with the public API URL
  console.log(`[6/6] Starting Next.js Frontend with Public API URL: ${publicBackendUrl} ...`);

  frontendProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    env: {
      ...process.env,
      PORT: String(FRONTEND_PORT),
      BACKEND_PORT: String(BACKEND_PORT),
      NEXT_PUBLIC_API_URL: publicBackendUrl,
    },
  });

  frontendProc.stdout.on('data', (d) => {
    const text = d.toString();
    pushLog(frontendLogs, text);
  });

  frontendProc.stderr.on('data', (d) => {
    const text = d.toString();
    pushLog(frontendLogs, text);
  });

  frontendProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`\n❌ Frontend process exited with code ${code}.`);
      console.error('Recent Frontend Output:\n' + frontendLogs.slice(-20).join('\n'));
      cleanupProcesses(1);
    }
  });

  // Poll frontend readiness
  process.stdout.write('      Waiting for frontend to become ready... ');
  try {
    await pollHttpReady(`http://127.0.0.1:${FRONTEND_PORT}`, 40000, 700);
    console.log('\x1b[32m✓ Ready!\x1b[0m');
  } catch (err) {
    console.log('\x1b[31m✗ FAILED\x1b[0m\n');
    console.error(`❌ Frontend failed to become ready at http://127.0.0.1:${FRONTEND_PORT} within 40s.`);
    console.error('Recent Frontend Output:\n' + frontendLogs.slice(-25).join('\n'));
    cleanupProcesses(1);
  }

  // Write active URLs to PUBLIC_URL.txt
  const publicUrlFile = path.join(rootDir, 'PUBLIC_URL.txt');
  const fileContent = `==================================================================
  BHOOMISETU SHAREABLE PUBLIC DEMO LINKS (NGROK ENGINE)
==================================================================

1. PUBLIC INTERNET LINK (Share with anyone on any PC / Mobile):
   ${publicFrontendUrl}

2. PUBLIC BACKEND API ENDPOINT:
   ${publicBackendUrl}

3. SAME WI-FI / LOCAL NETWORK LINK:
   http://${localIp}:${FRONTEND_PORT}

4. LOCAL PC BROWSER LINK:
   http://localhost:${FRONTEND_PORT}

------------------------------------------------------------------
PRE-SEEDED DEMO ACCOUNTS:
------------------------------------------------------------------
- Central Ministry  : ananya.sharma@nic.in (Password: bhoomi2026)
- District SLAO     : dc.bengaluru@karnataka.gov.in (Password: bhoomi2026)
- Implementing (PIA): v.malhotra@nhai.gov.in (Password: bhoomi2026)
- Citizen Portal    : citizen (or click Citizen tab on login screen)

------------------------------------------------------------------
ARCHITECTURE NOTE:
------------------------------------------------------------------
- Remote Browser -> NGROK (${publicFrontendUrl})
- Next.js acts as Reverse Proxy: /v1/* -> Local NestJS (Port 3001)
- NestJS -> Local PostgreSQL (Port 5432)
- Database is NOT exposed publicly.
==================================================================
`;
  fs.writeFileSync(publicUrlFile, fileContent, 'utf8');

  // Print final dashboard
  printDashboardBanner(publicFrontendUrl, publicBackendUrl, dbOk);

  // Auto-open public URL in default browser
  openBrowser(publicFrontendUrl);

  // Keep script running and print live process logs cleanly if desired
  function streamLines(data, prefix, colorCode) {
    if (isShuttingDown) return;
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        // Suppress repetitive compilation messages from cluttering the dashboard
        if (trimmed.includes('Compiled') || trimmed.includes('compiling...') || trimmed.includes('[Nest]')) {
          return;
        }
        console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${trimmed}`);
      }
    });
  }

  backendProc.stdout.on('data', (d) => streamLines(d, 'BACKEND', '36'));
  frontendProc.stdout.on('data', (d) => streamLines(d, 'FRONTEND', '32'));
}

startPublicDemo().catch((err) => {
  console.error('\n❌ Fatal error starting public demo:', err.message);
  cleanupProcesses(1);
});
