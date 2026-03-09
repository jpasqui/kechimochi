/**
 * WebdriverIO configuration for kechimochi e2e tests.
 */

import os from 'os';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { prepareTestDir, cleanupTestDir } from './helpers/setup.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Unique ID for this test run
const RUN_ID = process.env.TEST_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const LOGS_DIR = path.join(__dirname, 'logs', `test_run_${RUN_ID}`);

let tauriDriver: ChildProcess;
let tauriDriverExit = false;

function closeTauriDriver() {
  tauriDriverExit = true;
  tauriDriver?.kill();
}

// Ensure tauri-driver is closed even on unexpected exits
function onShutdown(fn: () => void) {
  const cleanup = () => {
    try { fn(); } finally { process.exit(); }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

onShutdown(() => { closeTauriDriver(); });

export const config: WebdriverIO.Config = {
  // ==================
  // Runner Configuration
  // ==================
  runner: 'local',
  hostname: '127.0.0.1',
  port: 4444,
  autoCompileOpts: {
    tsNodeOpts: {
      project: path.resolve(__dirname, '..', 'tsconfig.json'),
    },
  },

  // ==================
  // Specs
  // ==================
  specs: [
    path.join(__dirname, 'specs', '**', '*.spec.ts'),
  ],

  // ==================
  // Capabilities
  // ==================
  maxInstances: 1,
  capabilities: [{
    maxInstances: 1,
    'tauri:options': {
      application: path.resolve(
        __dirname, '..', 'src-tauri', 'target', 'debug', 'kechimochi'
      ),
    },
  }],

  // ==================
  // Test Configuration
  // ==================
  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  // ==================
  // Services
  // ==================
  services: [
    // Visual regression testing
    ['visual', {
      baselineFolder: path.join(__dirname, 'screenshots', 'baseline'),
      formatImageName: '{tag}',
      screenshotPath: path.join(LOGS_DIR, 'visual', 'actual'),
      savePerInstance: false,
      autoSaveBaseline: true,
      blockOutStatusBar: false,
      blockOutToolBar: false,
      clearRuntimeFolder: true,
    }],
    // OCR text recognition
    ['ocr', {
      contrast: 0.25,
      imagesFolder: path.join(LOGS_DIR, 'ocr'),
    }],
  ],

  // ==================
  // Hooks
  // ==================

  /**
   * Prepare the isolated test data directory before any session starts.
   */
  onPrepare: async () => {
    // Ensure logs directory exists
    const { mkdirSync } = await import('fs');
    mkdirSync(LOGS_DIR, { recursive: true });
    process.env.TEST_RUN_ID = RUN_ID;

    const testDir = prepareTestDir();
    console.log(`[e2e] Test run ID: ${RUN_ID}`);
    console.log(`[e2e] Logs directory: ${LOGS_DIR}`);
    console.log(`[e2e] Test data directory: ${testDir}`);
    // Set on the parent process -- inherited by workers
    process.env.KECHIMOCHI_DATA_DIR = testDir;
  },

  /**
   * Spawn tauri-driver right before each WebDriver session.
   * This is the correct hook per the official Tauri docs.
   */
  beforeSession: async () => {
    const testDir = process.env.KECHIMOCHI_DATA_DIR;
    console.log(`[e2e] Spawning tauri-driver with KECHIMOCHI_DATA_DIR=${testDir}`);
    tauriDriver = spawn(
      'tauri-driver',
      [],
      {
        stdio: [null, process.stdout, process.stderr],
        env: {
          ...process.env,
          KECHIMOCHI_DATA_DIR: testDir,
          RUST_LOG: 'info',
          TAURI_DEBUG: '1'
        },
      }
    );
    // Give tauri-driver a moment to start the WebDriver server
    console.log('[e2e] Waiting for tauri-driver to initialize...');
    const { execSync } = await import('child_process');
    try { execSync('sleep 2'); } catch { }

    tauriDriver.on('error', (error: Error) => {
      console.error('[e2e] tauri-driver error:', error);
      process.exit(1);
    });

    tauriDriver.on('exit', (code: number | null) => {
      if (!tauriDriverExit) {
        console.error('[e2e] tauri-driver exited unexpectedly with code:', code);
        process.exit(1);
      }
    });
  },

  /**
   * Kill tauri-driver after each session ends.
   */
  afterSession: () => {
    closeTauriDriver();
  },

  /**
   * After each test, capture screenshot on failure.
   */
  afterTest: async (test, _context, { passed }) => {
    if (!passed) {
      const sanitizedTitle = (test.title || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const failDir = path.join(LOGS_DIR, 'failures');
      const { mkdirSync } = await import('fs');
      mkdirSync(failDir, { recursive: true });
      await browser.saveScreenshot(path.join(failDir, `${sanitizedTitle}.png`));
    }
  },

  /**
   * Clean up the temp test directory after the full run.
   */
  onComplete: () => {
    const testDir = process.env.KECHIMOCHI_DATA_DIR;
    if (testDir) {
      cleanupTestDir(testDir);
      console.log(`[e2e] Cleaned up test directory: ${testDir}`);
    }
  },
};
