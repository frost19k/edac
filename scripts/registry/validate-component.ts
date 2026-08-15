#!/usr/bin/env bun

/**
 * Component Validation Script (TypeScript/Bun version)
 * Validates component structure and metadata for PRs.
 *
 * Exit codes:
 *   0 = pass (even with warnings)
 *   1 = fail (one or more errors)
 */

import { existsSync, readFileSync, lstatSync } from 'fs';
import { join, relative } from 'path';
import { globSync } from 'glob';
import { MIRROR_DIR } from './dependency-resolution';
import { colors, REPO_ROOT, printSuccess, printInfo } from './shared';

// Counters
let errors = 0;
let warnings = 0;

// Configuration
const REGISTRY_FILE = 'registry.json';

// Types
interface Registry {
  version: string;
  repository: string;
  components: Record<string, unknown>;
  profiles: Record<string, unknown>;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
}

// Utility functions
function printError(msg: string): void {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
  errors++;
}

function printWarning(msg: string): void {
  console.error(`${colors.yellow}⚠${colors.reset} ${msg}`);
  warnings++;
}

/**
 * Extract YAML-like frontmatter from a markdown file.
 * Returns the raw frontmatter content (without the --- delimiters) or null
 * when no well-formed frontmatter block is found.
 */
function extractFrontmatter(content: string): string | null {
  // Frontmatter must start at the very first line with ---
  if (!content.startsWith('---\n')) {
    return null;
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return null;
  }

  return content.slice(4, endIndex);
}

/**
 * Check whether the raw frontmatter text contains a line starting with
 * the given key followed by a colon (i.e., a top-level YAML field).
 * This is a string prefix match on raw text, not a parsed YAML lookup —
 * it will not detect nested (indented) keys.
 */
function frontmatterHasKey(frontmatter: string, key: string): boolean {
  for (const line of frontmatter.split('\n')) {
    if (line.startsWith(`${key}:`)) {
      return true;
    }
  }
  return false;
}

function validateMarkdownFrontmatter(filePath: string): void {
  const relPath = relative(REPO_ROOT, filePath);
  printInfo(`Validating ${relPath}`);

  const content = readFileSync(filePath, 'utf-8');
  const frontmatter = extractFrontmatter(content);

  if (frontmatter === null) {
    printWarning(`Missing frontmatter in ${relPath}`);
    return;
  }

  if (!frontmatterHasKey(frontmatter, 'description')) {
    printWarning(`Missing 'description' in frontmatter of ${relPath}`);
  } else {
    printSuccess('Has description');
  }

  // Agent files (under src/agents but not src/agents/subagents) require a mode.
  if (relPath.includes('/agents/') && !relPath.includes('/subagents/')) {
    if (!frontmatterHasKey(frontmatter, 'mode')) {
      printWarning(`Missing 'mode' in agent frontmatter of ${relPath}`);
    } else {
      printSuccess('Has mode');
    }
  }
}

function validateTypescriptFile(filePath: string): void {
  const relPath = relative(REPO_ROOT, filePath);
  printInfo(`Validating ${relPath}`);

  const content = readFileSync(filePath, 'utf-8');

  if (!content.includes('export')) {
    printWarning(`No exports found in ${relPath}`);
  } else {
    printSuccess('Has exports');
  }

  if (!/\/\*\*/.test(content)) {
    printWarning(`No JSDoc comments found in ${relPath}`);
  } else {
    printSuccess('Has documentation');
  }
}

function validateDirectoryStructure(): void {
  printInfo('Validating directory structure');

  const requiredDirs = [
    MIRROR_DIR,
    join(MIRROR_DIR, 'agents'),
    join(MIRROR_DIR, 'commands'),
    join(MIRROR_DIR, 'tools'),
  ];

  for (const dir of requiredDirs) {
    const fullPath = join(REPO_ROOT, dir);
    if (!existsSync(fullPath)) {
      printError(`Missing required directory: ${dir}`);
    } else {
      printSuccess(`Directory exists: ${dir}`);
    }
  }

  const categoryDirs = [
    join(MIRROR_DIR, 'agents', 'core'),
    join(MIRROR_DIR, 'agents', 'subagents'),
  ];

  let foundCategories = 0;
  for (const dir of categoryDirs) {
    const fullPath = join(REPO_ROOT, dir);
    if (existsSync(fullPath)) {
      foundCategories++;
    }
  }

  if (foundCategories > 0) {
    printSuccess(`Found ${foundCategories} category subdirectories`);
  } else {
    printWarning('No category subdirectories found (optional)');
  }
}

function validateRegistry(): void {
  printInfo('Validating registry.json');

  const registryPath = join(REPO_ROOT, REGISTRY_FILE);

  if (!existsSync(registryPath)) {
    printError('registry.json not found');
    return;
  }

  let registry: Registry;
  try {
    const content = readFileSync(registryPath, 'utf-8');
    registry = JSON.parse(content) as Registry;
  } catch {
    printError('registry.json is not valid JSON');
    return;
  }

  printSuccess('registry.json is valid JSON');

  const requiredFields: Array<keyof Registry> = [
    'version',
    'repository',
    'components',
    'profiles',
    'metadata',
  ];

  for (const field of requiredFields) {
    if (!(field in registry)) {
      printError(`Missing required field in registry.json: ${field}`);
    } else {
      printSuccess(`Has field: ${field}`);
    }
  }
}

function main(): void {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Component Validation                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  validateDirectoryStructure();
  console.log('');

  validateRegistry();
  console.log('');

  console.log('Validating markdown files...');
  const mdFiles = globSync(join(REPO_ROOT, MIRROR_DIR, '**/*.md'), {
    nodir: true,
  });
  for (const file of mdFiles) {
    // Skip symlinks, matching the original find -type f behavior.
    try {
      if (lstatSync(file).isSymbolicLink()) {
        continue;
      }
    } catch {
      printWarning(`Could not stat ${relative(REPO_ROOT, file)}, skipping`);
      continue;
    }
    validateMarkdownFrontmatter(file);
  }
  console.log('');

  console.log('Validating TypeScript files...');
  const tsFiles = globSync(join(REPO_ROOT, MIRROR_DIR, '**/*.ts'), {
    nodir: true,
  });
  for (const file of tsFiles) {
    validateTypescriptFile(file);
  }
  console.log('');

  console.log('════════════════════════════════════════════════════════════════');
  console.log('Validation Summary:');
  console.log(`  Errors:   ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log('════════════════════════════════════════════════════════════════');

  if (errors > 0) {
    console.log('');
    printError(`Validation failed with ${errors} error(s)`);
    process.exit(1);
  }

  if (warnings > 0) {
    console.log('');
    printWarning(`Validation passed with ${warnings} warning(s)`);
    process.exit(0);
  }

  console.log('');
  printSuccess('All validations passed!');
  process.exit(0);
}

main();
