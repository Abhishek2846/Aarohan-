const { execSync } = require('child_process');

function freePorts(ports = [3000, 3001]) {
  console.log(`[PRE-FLIGHT] Cleaning up ports ${ports.join(', ')} if occupied...`);
  for (const port of ports) {
    try {
      if (process.platform === 'win32') {
        // Run netstat to locate process listening on specified port
        const cmd = `netstat -ano | findstr :${port}`;
        let output = '';
        try {
          output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        } catch (e) {
          // No process listening on this port
          continue;
        }

        const lines = output.trim().split('\n');
        const pids = new Set();
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`) && parts[3] === 'LISTENING') {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && pid !== process.pid.toString()) {
              pids.add(pid);
            }
          }
        });

        pids.forEach((pid) => {
          try {
            console.log(`  → Terminating stale process PID ${pid} listening on port ${port}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch (e) {
            // Process may already have terminated
          }
        });
      } else {
        // macOS / Linux fallback
        try {
          execSync(`npx --no-install kill-port ${port}`, { stdio: 'ignore' });
        } catch (e) {
          // ignore error if port wasn't open
        }
      }
    } catch (err) {
      // Ignored
    }
  }
  console.log('[PRE-FLIGHT] Ports cleared successfully.\n');
}

module.exports = { freePorts };
