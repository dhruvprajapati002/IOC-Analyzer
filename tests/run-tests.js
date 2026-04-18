#!/usr/bin/env node

/**
 * Test Runner Script
 * Executes tests in proper order with clear output
 */

import { execSync } from 'child_process';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`▶️  ${description}`, colors.bright);
  log('='.repeat(60), colors.cyan);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`\n✅ ${description} - PASSED`, colors.green);
    return true;
  } catch (error) {
    log(`\n❌ ${description} - FAILED`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🧪 IOC Analysis Platform - Test Suite', colors.bright + colors.cyan);
  log('========================================\n', colors.cyan);

  const results = {
    passed: 0,
    failed: 0,
  };

  // 1. Unit Tests (Core Logic)
  if (runCommand('npx jest tests/unit --coverage', '1️⃣  UNIT TESTS - Core Engine Logic')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // 2. Integration Tests (Mocked Services)
  if (runCommand('npx jest tests/integration', '2️⃣  INTEGRATION TESTS - Service Integration')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // 3. API Tests (Backend Endpoints)
  if (runCommand('npx jest tests/api', '3️⃣  API TESTS - Backend Endpoints')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('📊 TEST SUMMARY', colors.bright);
  log('='.repeat(60), colors.cyan);
  log(`✅ Passed: ${results.passed}`, colors.green);
  log(`❌ Failed: ${results.failed}`, colors.red);
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed!', colors.green + colors.bright);
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', colors.yellow);
    process.exit(1);
  }
}

main().catch(err => {
  log(`\n💥 Test runner crashed: ${err.message}`, colors.red);
  process.exit(1);
});
