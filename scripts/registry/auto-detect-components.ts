#!/usr/bin/env bun

/**
 * Auto-Detect Components Script (TypeScript/Bun version)
 *
 * Scans the EDAC src/ mirror for new components not present in registry.json,
 * validates existing entries, fixes stale paths, removes deleted components,
 * and performs lightweight security checks on component files.
 *
 * Exit codes:
 *   0 = success (even if new components were found but not added)
 *   1 = registry file missing or not valid JSON / unrecoverable error
 */

import {
  existsSync,
  lstatSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import {
  buildComponentMap,
  componentExists,
  MIRROR_DIR,
  parseDependency,
  resolveCategory,
} from './dependency-resolution';
import type { ComponentRef } from './dependency-resolution';

// Colors
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  magenta: '\x1b[0;35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// Configuration
const REGISTRY_FILE = 'registry.json';
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MIRROR_ROOT = join(REPO_ROOT, MIRROR_DIR);
const METADATA_FILE = join(MIRROR_ROOT, 'metadata.json');

// CLI flags
let AUTO_ADD = false;
let DRY_RUN = false;
let VALIDATE_EXISTING = true;
let SECURITY_CHECK = true;

// Counters
let TOTAL_FIXED = 0;
let TOTAL_REMOVED = 0;
let TOTAL_SECURITY_ISSUES = 0;

// Result collections
interface NewComponent {
  compType: string;
  id: string;
  name: string;
  description: string;
  relPath: string;
  compCategory: string;
  tags: string;
  dependencies: string;
}

interface FixedComponent {
  compType: keyof Registry['components'];
  index: number;
  id: string;
  name: string;
  oldPath: string;
  newPath: string;
}

interface RemovedComponent {
  compType: keyof Registry['components'];
  id: string;
  name: string;
  path: string;
}

interface SecurityIssue {
  relPath: string;
  issues: string[];
}

const NEW_COMPONENTS: NewComponent[] = [];
const FIXED_COMPONENTS: FixedComponent[] = [];
const REMOVED_COMPONENTS: RemovedComponent[] = [];
const SECURITY_ISSUES: SecurityIssue[] = [];

// Types
interface Component {
  id: string;
  name: string;
  type: string;
  path: string;
  description?: string;
  tags?: string[];
  dependencies?: string[];
  category?: string;
  [key: string]: unknown;
}

interface Registry {
  version: string;
  schema_version: string;
  repository: string;
  categories: Record<string, string>;
  metadata?: {
    lastUpdated?: string;
    [key: string]: unknown;
  };
  components: {
    agents?: Component[];
    subagents?: Component[];
    commands?: Component[];
    tools?: Component[];
    plugins?: Component[];
    contexts?: Component[];
    config?: Component[];
    skills?: Component[];
  };
}

interface MetadataEntry {
  id?: string;
  name?: string;
  category?: string;
  type?: string;
  tags?: string[];
  dependencies?: string[];
}

interface MetadataFile {
  agents?: Record<string, MetadataEntry>;
}

// Utility Functions
function printHeader(): void {
  console.log(`${colors.cyan}${colors.bold}`);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║           Auto-Detect Components v2.0.0 (TypeScript)          ║');
  console.log('║           Enhanced with Security & Validation                 ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
}

function printSuccess(msg: string): void {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function printError(msg: string): void {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function printWarning(msg: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function printInfo(msg: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

function printSecurity(msg: string): void {
  console.log(`${colors.magenta}🔒${colors.reset} ${msg}`);
}

function usage(): void {
  console.log('Usage: bun run scripts/registry/auto-detect-components.ts [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  -a, --auto-add          Automatically add new components to registry');
  console.log('  -d, --dry-run           Show what would be changed without modifying registry');
  console.log('  -s, --skip-validation   Skip validation of existing registry entries');
  console.log('  -n, --no-security       Skip security checks on component files');
  console.log('  -h, --help              Show this help message');
  console.log('');
  console.log('Features:');
  console.log('  • Detects new components in the EDAC src/ directory');
  console.log('  • Validates existing registry entries');
  console.log('  • Auto-fixes typos and wrong paths');
  console.log('  • Removes entries for deleted components');
  console.log('  • Performs security checks (permissions, secrets, path validation)');
  console.log('');
  process.exit(0);
}

// Security Functions
function checkFileSecurity(file: string): string[] {
  const issues: string[] = [];
  const isMarkdown = file.endsWith('.md');
  const stats = statSync(file);
  const mode = stats.mode & 0o777;

  if (isMarkdown) {
    // Markdown files should not be executable.
    if (mode & 0o111) {
      issues.push('Markdown file should not be executable');
    }

    const content = readFileSync(file, 'utf-8');
    const realKeyPattern = /(sk-proj-[a-zA-Z0-9]{40,}|ghp_[a-zA-Z0-9]{36,}|xox[baprs]-[a-zA-Z0-9-]{10,})/;
    if (realKeyPattern.test(content)) {
      issues.push('Potential real API key detected');
    }
  } else {
    // Non-markdown files should not be overly permissive.
    if (mode > 0o664) {
      issues.push('File has overly permissive permissions');
    }

    const content = readFileSync(file, 'utf-8');
    const secretPattern = /(password|secret|api[_-]?key|token|credential|private[_-]?key).*[=:].*[a-zA-Z0-9]{20,}/i;
    if (secretPattern.test(content)) {
      issues.push('Potential hardcoded secrets detected');
    }
  }

  return issues;
}

function runSecurityChecks(): void {
  if (!SECURITY_CHECK) {
    return;
  }

  printInfo('Running security checks...');
  console.log('');

  const categories = ['agent', 'command', 'tool', 'plugin', 'context'];

  for (const category of categories) {
    const categoryDir = join(MIRROR_ROOT, `${category}s`);

    if (!existsSync(categoryDir)) {
      continue;
    }

    const files = globSync(join(categoryDir, '**', '*.md'), { nodir: true });

    for (const file of files) {
      const relPath = relative(REPO_ROOT, file);

      // Skip excluded directories.
      if (
        relPath.includes('/node_modules/') ||
        relPath.includes('/tests/') ||
        relPath.includes('/docs/')
      ) {
        continue;
      }

      // Skip symlinks (backward-compatibility links).
      if (lstatSync(file).isSymbolicLink()) {
        continue;
      }

      const issues = checkFileSecurity(file);
      if (issues.length > 0) {
        TOTAL_SECURITY_ISSUES++;
        SECURITY_ISSUES.push({ relPath, issues });
        printSecurity(`Security issue in: ${relPath}`);
        for (const issue of issues) {
          console.log(`  - ${issue}`);
        }
        console.log('');
      }
    }
  }

  if (TOTAL_SECURITY_ISSUES === 0) {
    printSuccess('No security issues found');
    console.log('');
  }
}

// Path Validation and Fixing
function findSimilarPath(wrongPath: string): string | null {
  const dir = dirname(wrongPath);
  const filename = basename(wrongPath);

  // First, try to find an exact filename match in the base category directory.
  const baseDir = dir.split('/')[0];
  const baseDirPath = join(MIRROR_ROOT, baseDir);

  if (existsSync(baseDirPath)) {
    const candidates = globSync(join(baseDirPath, '**', filename), { nodir: true });
    for (const candidate of candidates) {
      const candidateName = basename(candidate);
      if (candidateName === filename) {
        return relative(MIRROR_ROOT, candidate);
      }
    }
  }

  // Fallback: search for similar names in the original directory and the whole mirror.
  const searchDirs = [join(MIRROR_ROOT, dir), MIRROR_ROOT];

  for (const searchDir of searchDirs) {
    if (!existsSync(searchDir)) {
      continue;
    }

    const candidates = globSync(join(searchDir, '**', '*.md'), { nodir: true });
    for (const candidate of candidates) {
      const candidateName = basename(candidate);
      if (
        candidateName.includes(filename) ||
        filename.includes(candidateName)
      ) {
        return relative(MIRROR_ROOT, candidate);
      }
    }
  }

  return null;
}

function validateExistingEntries(registry: Registry): void {
  if (!VALIDATE_EXISTING) {
    return;
  }

  printInfo('Validating existing registry entries...');
  console.log('');

  const componentTypes = Object.keys(registry.components) as Array<
    keyof Registry['components']
  >;

  for (const compType of componentTypes) {
    const components = registry.components[compType];
    if (!components) {
      continue;
    }

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const { id, name, path } = component;

      if (!path) {
        continue;
      }

      const fullPath = join(MIRROR_ROOT, path);

      if (!existsSync(fullPath)) {
        printWarning(`Component file not found: ${name} (${path})`);

        const similarPath = findSimilarPath(path);
        if (similarPath) {
          printInfo(`Found similar path: ${similarPath}`);

          if (AUTO_ADD && !DRY_RUN) {
            component.path = similarPath;
            printSuccess(`Fixed path for ${name}: ${path} → ${similarPath}`);
            TOTAL_FIXED++;
          } else {
            FIXED_COMPONENTS.push({
              compType,
              index: i,
              id,
              name,
              oldPath: path,
              newPath: similarPath,
            });
            console.log(`  Would fix: ${path} → ${similarPath}`);
          }
        } else {
          // No similar path found — mark for removal.
          if (AUTO_ADD && !DRY_RUN) {
            components.splice(i, 1);
            i--;
            printSuccess(`Removed deleted component: ${name}`);
            TOTAL_REMOVED++;
          } else {
            REMOVED_COMPONENTS.push({ compType, id, name, path });
            console.log(`  Would remove: ${name} (deleted)`);
          }
        }
        console.log('');
      }
    }
  }
}

// Component Detection
function extractMetadataFromFile(file: string): {
  id: string;
  name: string;
  description: string;
  tags: string;
  dependencies: string;
} {
  const filename = basename(file, '.md');
  const id = filename.toLowerCase().replace(/ /g, '-');

  let name = '';
  let description = '';
  let tags = '';
  let dependencies = '';

  const content = readFileSync(file, 'utf-8');

  // Try to extract from frontmatter (YAML).
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split(/\r?\n/);

    // Description
    for (const line of lines) {
      if (line.startsWith('description:')) {
        description = line
          .slice('description:'.length)
          .trim()
          .replace(/^["']|["']$/g, '');
        break;
      }
    }

    // Tags — handles inline arrays and multi-line lists.
    let inTags = false;
    for (const line of lines) {
      if (line.startsWith('tags:')) {
        const rest = line.slice('tags:'.length).trim();
        const closeIndex = rest.indexOf(']');
        if (rest.startsWith('[') && closeIndex !== -1) {
          tags = rest
            .slice(1, closeIndex)
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
            .join(',');
          inTags = false;
        } else {
          inTags = true;
        }
      } else if (inTags) {
        if (/^\s*- /.test(line)) {
          const tag = line.replace(/^\s*- /, '').trim();
          tags = tags ? `${tags},${tag}` : tag;
        } else if (!/^\s/.test(line) && line.trim() !== '') {
          inTags = false;
        }
      }
    }

    // Dependencies — handles inline arrays and multi-line lists.
    let inDeps = false;
    for (const line of lines) {
      if (line.startsWith('dependencies:')) {
        const rest = line.slice('dependencies:'.length).trim();
        const closeIndex = rest.indexOf(']');
        if (rest.startsWith('[') && closeIndex !== -1) {
          dependencies = rest
            .slice(1, closeIndex)
            .split(',')
            .map(d =>
              d
                .trim()
                .replace(/^["']|["']$/g, '')
                .replace(/#.*/, '')
                .trim()
            )
            .filter(Boolean)
            .join(',');
          inDeps = false;
        } else {
          inDeps = true;
        }
      } else if (inDeps) {
        if (/^\s*- /.test(line)) {
          const dep = line
            .replace(/^\s*- /, '')
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/#.*/, '')
            .trim();
          if (dep && !dep.startsWith('#')) {
            dependencies = dependencies ? `${dependencies},${dep}` : dep;
          }
        } else if (/^\s*#/.test(line) || line.trim() === '') {
          continue;
        } else if (!/^\s/.test(line) && line.trim() !== '') {
          inDeps = false;
        }
      }
    }
  }

  // Fallback description from the first markdown heading.
  if (!description) {
    const headingMatch = content.match(/^# (.+)$/m);
    if (headingMatch) {
      description = headingMatch[1].trim();
    }
  }

  // Generate name from filename (title-case each word).
  name = filename
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  // Merge metadata from src/metadata.json when available.
  if (existsSync(METADATA_FILE)) {
    try {
      const metadataFile = JSON.parse(
        readFileSync(METADATA_FILE, 'utf-8')
      ) as MetadataFile;
      const metadataEntry = metadataFile.agents?.[id];

      if (metadataEntry) {
        if (metadataEntry.name) {
          name = metadataEntry.name;
        }
        if (!tags && metadataEntry.tags && metadataEntry.tags.length > 0) {
          tags = metadataEntry.tags.join(',');
        }
        if (
          !dependencies &&
          metadataEntry.dependencies &&
          metadataEntry.dependencies.length > 0
        ) {
          dependencies = metadataEntry.dependencies.join(',');
        }
      }
    } catch {
      // Ignore malformed metadata.json — frontmatter values remain authoritative.
    }
  }

  return { id, name, description, tags, dependencies };
}

function detectComponentType(path: string): string {
  if (path.startsWith('agents/subagents/') || path.includes('/agents/subagents/')) return 'subagent';
  if (path.startsWith('agents/') || path.includes('/agents/')) return 'agent';
  if (path.startsWith('commands/') || path.includes('/commands/')) return 'command';
  if (path.startsWith('tools/') || path.includes('/tools/')) return 'tool';
  if (path.startsWith('plugins/') || path.includes('/plugins/')) return 'plugin';
  if (path.startsWith('context/') || path.includes('/context/')) return 'context';
  return 'unknown';
}

function extractCategoryFromPath(path: string): string {
  if (path.startsWith('agents/subagents/') || path.includes('/agents/subagents/')) {
    const after = path.includes('/agents/subagents/')
      ? path.split('/agents/subagents/')[1]
      : path.slice('agents/subagents/'.length);
    const segment = after.split('/')[0];
    return segment && !segment.endsWith('.md') ? segment : 'standard';
  }

  if (path.startsWith('agents/') || path.includes('/agents/')) {
    const after = path.includes('/agents/')
      ? path.split('/agents/')[1]
      : path.slice('agents/'.length);
    const segment = after.split('/')[0];
    return segment && !segment.endsWith('.md') ? segment : 'standard';
  }

  return 'standard';
}

function getRegistryKey(type: string): keyof Registry['components'] {
  if (type === 'config') return 'config';
  return `${type}s` as keyof Registry['components'];
}

function checkNewComponentDependencies(
  depsStr: string,
  componentName: string,
  componentMap: Map<string, ComponentRef>
): void {
  if (!depsStr) {
    return;
  }

  const deps = depsStr
    .split(',')
    .map(d => d.trim())
    .filter(Boolean);

  for (const dep of deps) {
    const parsed = parseDependency(dep);
    if (!parsed) {
      console.log(
        `    ⚠ Invalid dependency format: ${dep} (expected type:id)`
      );
      continue;
    }

    if (!resolveCategory(parsed.type)) {
      console.log(`    ⚠ Unknown dependency type: ${dep}`);
      continue;
    }

    if (!componentExists(dep, componentMap)) {
      console.log(`    ⚠ Dependency not found in registry: ${dep}`);
    }
  }
}

function scanForNewComponents(registry: Registry): void {
  printInfo('Scanning for new components...');
  console.log('');

  const registryPaths = new Set<string>();
  for (const category of Object.keys(registry.components)) {
    const components = registry.components[
      category as keyof Registry['components']
    ];
    if (components) {
      for (const c of components) {
        if (c.path) {
          registryPaths.add(c.path);
        }
      }
    }
  }

  const componentMap = buildComponentMap(registry.components);
  const categories = ['agent', 'command', 'tool', 'plugin', 'context'];

  for (const category of categories) {
    const categoryDir = join(MIRROR_ROOT, `${category}s`);

    if (!existsSync(categoryDir)) {
      continue;
    }

    const files = globSync(join(categoryDir, '**', '*.md'), { nodir: true });

    for (const file of files) {
      const relPath = relative(MIRROR_ROOT, file);

      // Skip symlinks.
      if (lstatSync(file).isSymbolicLink()) {
        continue;
      }

      // Skip node_modules, tests, docs, templates, README, and index files.
      if (
        relPath.includes('/node_modules/') ||
        relPath.includes('/tests/') ||
        relPath.includes('/docs/') ||
        relPath.includes('/template') ||
        relPath.endsWith('README.md') ||
        relPath.endsWith('index.md')
      ) {
        continue;
      }

      if (!registryPaths.has(relPath)) {
        const metadata = extractMetadataFromFile(file);
        const compType = detectComponentType(relPath);
        const compCategory = extractCategoryFromPath(relPath);

        if (compType === 'unknown') {
          continue;
        }

        NEW_COMPONENTS.push({
          compType,
          ...metadata,
          relPath,
          compCategory,
        });

        printWarning(`New ${compType}: ${metadata.name} (${metadata.id})`);
        console.log(`  Path: ${relPath}`);
        console.log(`  Category: ${compCategory}`);
        if (metadata.description) {
          console.log(`  Description: ${metadata.description}`);
        }
        if (metadata.tags) {
          console.log(`  Tags: ${metadata.tags}`);
        }
        if (metadata.dependencies) {
          console.log(`  Dependencies: ${metadata.dependencies}`);
        }

        if (metadata.dependencies) {
          checkNewComponentDependencies(
            metadata.dependencies,
            metadata.name,
            componentMap
          );
        }

        console.log('');
      }
    }
  }
}

function addComponentToRegistry(registry: Registry, newComp: NewComponent): void {
  const registryKey = getRegistryKey(newComp.compType);
  const components = registry.components[registryKey] ?? [];

  const component: Component = {
    id: newComp.id,
    name: newComp.name,
    type: newComp.compType,
    path: newComp.relPath,
    description: newComp.description || `Component: ${newComp.name}`,
    tags: newComp.tags
      ? newComp.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [],
    dependencies: newComp.dependencies
      ? newComp.dependencies.split(',').map(d => d.trim()).filter(Boolean)
      : [],
    category: newComp.compCategory,
  };

  components.push(component);
  registry.components[registryKey] = components;

  printSuccess(
    `Added ${newComp.compType}: ${newComp.name} (category: ${newComp.compCategory})`
  );
}

function writeRegistryAtomically(registry: Registry): void {
  const registryPath = join(REPO_ROOT, REGISTRY_FILE);
  const tempPath = `${registryPath}.tmp`;
  const content = JSON.stringify(registry, null, 2);

  writeFileSync(tempPath, content, 'utf-8');
  renameSync(tempPath, registryPath);
}

function loadRegistry(): Registry {
  const registryPath = join(REPO_ROOT, REGISTRY_FILE);

  if (!existsSync(registryPath)) {
    printError(`Registry file not found: ${REGISTRY_FILE}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(registryPath, 'utf-8');
    return JSON.parse(content) as Registry;
  } catch (error) {
    printError('Registry file is not valid JSON');
    console.error(error);
    process.exit(1);
  }
}

function printSummary(): void {
  console.log('');
  console.log(
    `${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(
    `${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log('');

  console.log(
    `Security Issues:    ${colors.magenta}${TOTAL_SECURITY_ISSUES}${colors.reset}`
  );
  console.log(`Fixed Paths:        ${colors.green}${TOTAL_FIXED}${colors.reset}`);
  console.log(`Removed Components: ${colors.red}${TOTAL_REMOVED}${colors.reset}`);
  console.log(
    `New Components:     ${colors.yellow}${NEW_COMPONENTS.length}${colors.reset}`
  );
  console.log('');

  // Show pending fixes if in dry-run mode.
  if (DRY_RUN && FIXED_COMPONENTS.length > 0) {
    console.log(`${colors.bold}Pending Path Fixes:${colors.reset}`);
    for (const entry of FIXED_COMPONENTS) {
      console.log(`  • ${entry.name}: ${entry.oldPath} → ${entry.newPath}`);
    }
    console.log('');
  }

  // Show pending removals if in dry-run mode.
  if (DRY_RUN && REMOVED_COMPONENTS.length > 0) {
    console.log(`${colors.bold}Pending Removals:${colors.reset}`);
    for (const entry of REMOVED_COMPONENTS) {
      console.log(`  • ${entry.name} (${entry.path})`);
    }
    console.log('');
  }
}

// Main
function main(): void {
  // Parse arguments
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-a':
      case '--auto-add':
        AUTO_ADD = true;
        break;
      case '-d':
      case '--dry-run':
        DRY_RUN = true;
        break;
      case '-s':
      case '--skip-validation':
        VALIDATE_EXISTING = false;
        break;
      case '-n':
      case '--no-security':
        SECURITY_CHECK = false;
        break;
      case '-h':
      case '--help':
        usage();
        break;
      default:
        console.log(`Unknown option: ${arg}`);
        usage();
    }
  }

  printHeader();

  const registry = loadRegistry();

  runSecurityChecks();
  validateExistingEntries(registry);
  scanForNewComponents(registry);

  printSummary();

  const hasPendingChanges =
    NEW_COMPONENTS.length > 0 ||
    FIXED_COMPONENTS.length > 0 ||
    REMOVED_COMPONENTS.length > 0 ||
    TOTAL_FIXED > 0 ||
    TOTAL_REMOVED > 0;

  if (!hasPendingChanges) {
    printSuccess('Registry is up to date!');

    if (TOTAL_SECURITY_ISSUES > 0) {
      console.log('');
      printWarning(
        `Please review and fix the ${TOTAL_SECURITY_ISSUES} security issue(s) found`
      );
    }

    process.exit(0);
  }

  // Add components or report next steps.
  if (AUTO_ADD && !DRY_RUN) {
    if (NEW_COMPONENTS.length > 0) {
      printInfo('Adding new components to registry...');
      console.log('');

      let added = 0;
      for (const newComp of NEW_COMPONENTS) {
        addComponentToRegistry(registry, newComp);
        added++;
      }

      console.log('');
      printSuccess(`Added ${added} component(s) to registry`);
    }

    // Update timestamp.
    if (!registry.metadata) {
      registry.metadata = {};
    }
    registry.metadata.lastUpdated = new Date().toISOString().split('T')[0];

    writeRegistryAtomically(registry);
  } else if (DRY_RUN) {
    printInfo('Dry run mode - no changes made to registry');
    console.log('');
    console.log('Run without --dry-run to apply these changes');
  } else {
    printInfo('Run with --auto-add to apply these changes to registry');
    console.log('');
    console.log('Or manually update registry.json');
  }

  // Final security warning.
  if (TOTAL_SECURITY_ISSUES > 0) {
    console.log('');
    printWarning(
      `${TOTAL_SECURITY_ISSUES} security issue(s) require attention`
    );
  }

  process.exit(0);
}

main();
