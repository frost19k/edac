#!/usr/bin/env bun

/**
 * Context Reference Validator (TypeScript/Bun version)
 * Validates that all context references follow the strict convention.
 * Exit codes:
 *   0 = Pass (warnings are allowed)
 *   1 = Fail (errors found)
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { MIRROR_DIR } from '../registry/dependency-resolution';

// Colors
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

let errors = 0;
let warnings = 0;

function relPath(file: string): string {
  return relative(REPO_ROOT, file);
}

function readLines(file: string): string[] {
  return readFileSync(file, 'utf-8').split('\n');
}

function collectFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return globSync(join('**', '*.md'), { cwd: dir, absolute: true }).sort();
}

function hasDynamicVar(line: string): boolean {
  return /@\$[^0-9]|@\$\{/.test(line);
}

function findDynamicVarLines(file: string): string[] {
  const lines = readLines(file);
  const matches: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (hasDynamicVar(lines[i])) {
      matches.push(`${i + 1}:${lines[i]}`);
      if (matches.length >= 3) break;
    }
  }
  return matches;
}

// Agent/Command non-standard reference check.
// Mirrors the bash grep chain:
//   grep -E '@[^~$]' | grep -v '@\.opencode/context/' | grep -v '@AGENTS\.md' |
//   grep -v '@\.cursorrules' | grep -v '@\$[0-9]' | grep -v '^#' |
//   grep -v 'email' [| grep -v 'mailto' for agents]
function isNonStandardAgentOrCommandRef(line: string, includeMailto: boolean): boolean {
  if (!/@[^~$]/.test(line)) return false;
  if (/^#/.test(line)) return false;
  if (/@\.opencode\/context\//.test(line)) return false;
  if (/@AGENTS\.md/.test(line)) return false;
  if (/@\.cursorrules/.test(line)) return false;
  if (/@\$[0-9]/.test(line)) return false;
  if (/email/.test(line)) return false;
  if (includeMailto && /mailto/.test(line)) return false;
  return true;
}

function findNonStandardAgentRefLines(file: string): string[] {
  const lines = readLines(file);
  const matches: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isNonStandardAgentOrCommandRef(lines[i], true)) {
      matches.push(lines[i]);
      if (matches.length >= 2) break;
    }
  }
  return matches;
}

function hasNonStandardCommandRef(file: string): boolean {
  return readLines(file).some((line) => isNonStandardAgentOrCommandRef(line, false));
}

function isNonStandardContextRef(line: string): boolean {
  if (!/@/.test(line)) return false;
  if (/^#/.test(line)) return false;
  if (/@\.opencode\/context\//.test(line)) return false;
  if (/email/.test(line)) return false;
  return true;
}

function hasNonStandardContextRef(file: string): boolean {
  return readLines(file).some((line) => isNonStandardContextRef(line));
}

function hasShellCommandWithPath(line: string): boolean {
  return /!`.*\.opencode\/context/.test(line);
}

function checkAgents(): void {
  console.log('Checking agent files...');
  const dir = join(REPO_ROOT, MIRROR_DIR, 'agents');
  for (const file of collectFiles(dir)) {
    const rel = relPath(file);

    const dynamicLines = findDynamicVarLines(file);
    if (dynamicLines.length > 0) {
      console.log(`${colors.red}❌${colors.reset} Dynamic context reference in: ${rel}`);
      for (const line of dynamicLines) {
        console.log(`   ${line}`);
      }
      errors++;
    }

    const nonStandardLines = findNonStandardAgentRefLines(file);
    if (nonStandardLines.length > 0) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Non-standard reference in: ${rel}`);
      for (const line of nonStandardLines) {
        console.log(`   ${line}`);
      }
      warnings++;
    }
  }
}

function checkCommands(): void {
  console.log('Checking command files...');
  const dir = join(REPO_ROOT, MIRROR_DIR, 'commands');
  for (const file of collectFiles(dir)) {
    const rel = relPath(file);

    const dynamicLines = findDynamicVarLines(file);
    if (dynamicLines.length > 0) {
      console.log(`${colors.red}❌${colors.reset} Dynamic context reference in: ${rel}`);
      for (const line of dynamicLines) {
        console.log(`   ${line}`);
      }
      errors++;
    }

    if (hasNonStandardCommandRef(file)) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Non-standard reference in: ${rel}`);
      warnings++;
    }
  }
}

function checkContexts(): void {
  console.log('Checking context files...');
  const dir = join(REPO_ROOT, MIRROR_DIR, 'context');
  for (const file of collectFiles(dir)) {
    const rel = relPath(file);

    const dynamicLines = findDynamicVarLines(file);
    if (dynamicLines.length > 0) {
      console.log(`${colors.red}❌${colors.reset} Dynamic context reference in: ${rel}`);
      for (const line of dynamicLines) {
        console.log(`   ${line}`);
      }
      errors++;
    }

    if (hasNonStandardContextRef(file)) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Context file has non-standard reference: ${rel}`);
      warnings++;
    }
  }
}

function checkShellCommands(): void {
  console.log('Checking for shell commands with paths...');
  const dir = join(REPO_ROOT, MIRROR_DIR);
  for (const file of collectFiles(dir)) {
    const rel = relPath(file);
    const lines = readLines(file);
    for (const line of lines) {
      if (hasShellCommandWithPath(line)) {
        console.log(`${colors.blue}ℹ️${colors.reset}  Shell command with path in: ${rel}`);
        console.log('   (Will be transformed during installation)');
        break; // one notice per file, matching original grep behavior
      }
    }
  }
}

function main(): void {
  console.log('🔍 Validating context references...');
  console.log('');

  // Check if mirror directory exists
  const mirrorDir = join(REPO_ROOT, MIRROR_DIR);
  if (!existsSync(mirrorDir)) {
    console.log(`${colors.red}❌${colors.reset} No ${MIRROR_DIR} directory found`);
    console.log('   Run this script from the repository root');
    process.exit(1);
  }

  checkAgents();
  checkCommands();
  checkContexts();
  checkShellCommands();

  // Summary
  console.log('');
  console.log('==========================================');
  if (errors > 0) {
    console.log(`${colors.red}❌${colors.reset} Validation failed with ${errors} error(s) and ${warnings} warning(s)`);
    console.log('');
    console.log('Errors must be fixed before installation.');
    console.log('All context references must use: @.opencode/context/{category}/{file}.md');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${colors.yellow}⚠️${colors.reset}  Validation passed with ${warnings} warning(s)`);
    console.log('');
    console.log('Warnings indicate non-standard references that may not work correctly.');
    console.log('Consider updating them to use: @.opencode/context/{category}/{file}.md');
    process.exit(0);
  } else {
    console.log(`${colors.green}✅${colors.reset} All validations passed!`);
    console.log('');
    console.log('All context references follow the correct convention.');
    process.exit(0);
  }
}

main();
