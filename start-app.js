import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

console.log(`${colors.bright}${colors.green}Starting LeafSnap Discover Application...${colors.reset}`);

// Define the commands to start backend and frontend
const backendDir = path.join(__dirname, 'plant-species-recognition', 'backend');
const frontendDir = __dirname;

// Start Backend (Python Flask)
console.log(`${colors.blue}Starting Backend Server...${colors.reset}`);
const backendProcess = spawn('python', ['app.py'], {
  cwd: backendDir,
  shell: true,
  stdio: 'pipe'
});

backendProcess.stdout.on('data', (data) => {
  console.log(`${colors.cyan}[Backend] ${colors.reset}${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
  console.error(`${colors.yellow}[Backend Error] ${colors.reset}${data.toString().trim()}`);
});

// Start Frontend (Vite)
console.log(`${colors.blue}Starting Frontend Server...${colors.reset}`);
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'pipe'
});

frontendProcess.stdout.on('data', (data) => {
  console.log(`${colors.green}[Frontend] ${colors.reset}${data.toString().trim()}`);
});

frontendProcess.stderr.on('data', (data) => {
  console.error(`${colors.yellow}[Frontend Error] ${colors.reset}${data.toString().trim()}`);
});

// Handle process termination
const killProcesses = () => {
  console.log(`\n${colors.bright}${colors.yellow}Shutting down servers...${colors.reset}`);
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
};

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);

console.log(`${colors.bright}${colors.green}
-------------------------------------------------------------------------
🌿 LeafSnap Discover is starting up!
-------------------------------------------------------------------------
Access the application at: http://localhost:8080
Backend API is available at: http://localhost:8001
-------------------------------------------------------------------------
Press Ctrl+C to shut down both servers
-------------------------------------------------------------------------${colors.reset}
`); 