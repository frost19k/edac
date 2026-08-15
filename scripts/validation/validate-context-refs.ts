#!/usr/bin/env bun

/**
 * Context Reference Validator (TypeScript/Bun)
 *
 * Validates that all context references follow the strict convention:
 *   @.opencode/context/{category}/{file}.md
 *
 * Uses remark (mdast AST) to distinguish prose from code blocks, inline code,
 * and link URLs. Only prose `text` nodes are checked for non-standard
 * references — code blocks (`code`), inline code (`inlineCode`), and HTML
 * (`html`) are structurally skipped by the AST, eliminating false positives
 * from CSS at-rules, npm version specifiers, JSDoc tags, and domain
 * identifiers that happen to contain `@`.
 *
 * A context reference is identified by `@` followed by a path (at least one
 * `/`). Domain identifiers (`@critical_rules`), CSS at-rules (`@media`), and
 * email addresses lack a path and are ignored. The canonical form
 * `@.opencode/context/...` is excluded; everything else with a path is a
 * non-standard reference (warning).
 *
 * Dynamic variable references (`@$VAR`, `@${VAR}`) are checked at line level
 * (errors) since they may appear in any content type and cannot be resolved
 * at install time.
 *
 * Exit codes:
 *   0 = Pass (warnings are allowed)
 *   1 = Fail (errors found)
 */

import { existsSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { globSync } from 'glob';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { MIRROR_DIR } from '../registry/dependency-resolution';
import { colors, REPO_ROOT } from '../registry/shared';

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

// --- Dynamic variable detection (line-level, error) ---

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

// --- Non-standard reference detection (AST-based, warning) ---

/**
 * Strip YAML frontmatter (agent/command files) before parsing.
 * Context files use HTML comments, not frontmatter — this is a no-op for them.
 */
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return match ? content.slice(match[0].length) : content;
}

/**
 * A context reference contains a path: `@` followed by word/dot/hyphen chars
 * followed by `/`. This matches `@core/workflows.md` and
 * `@.opencode/context/core/workflows.md` but not `@media`, `@critical_rules`,
 * `@AGENTS.md`, `@.cursorrules`, or email addresses (which lack a `/` after
 * the `@` token).
 */
const REF_PATTERN = /@[\w.-]+\/[\w./-]*/g;

interface NonStandardRef {
  line: number;
  match: string;
}

function findNonStandardRefs(file: string): NonStandardRef[] {
  const content = readFileSync(file, 'utf-8');
  const body = stripFrontmatter(content);
  const results: NonStandardRef[] = [];

  try {
    const tree = remark().parse(body);

    visit(tree, 'text', (node) => {
      // `text` nodes are prose by definition — code blocks are `code` nodes,
      // inline code is `inlineCode`, HTML is `html`, link URLs are on `link`
      // nodes (not in child text). This structural discrimination eliminates
      // the false-positive classes the line-based regex produced.
      const text = node.value;
      if (!text.includes('@')) return;

      const line = node.position?.start.line ?? 0;

      REF_PATTERN.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = REF_PATTERN.exec(text)) !== null) {
        const ref = m[0];
        // Exclude the canonical convention
        if (ref.startsWith('@.opencode/context/')) continue;
        results.push({ line, match: ref });
      }
    });
  } catch {
    // If remark fails to parse, fall back to no results — the dynamic var
    // check and other validators still run. Report nothing to avoid noise.
  }

  return results;
}

// --- Shell command detection (line-level, info) ---

function hasShellCommandWithPath(line: string): boolean {
  return /!`.*\.opencode\/context/.test(line);
}

// --- Check functions ---

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

    const refs = findNonStandardRefs(file);
    if (refs.length > 0) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Non-standard reference in: ${rel}`);
      for (const ref of refs) {
        console.log(`   line ${ref.line}: ${ref.match}`);
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

    const refs = findNonStandardRefs(file);
    if (refs.length > 0) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Non-standard reference in: ${rel}`);
      for (const ref of refs) {
        console.log(`   line ${ref.line}: ${ref.match}`);
      }
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

    const refs = findNonStandardRefs(file);
    if (refs.length > 0) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Context file has non-standard reference: ${rel}`);
      for (const ref of refs) {
        console.log(`   line ${ref.line}: ${ref.match}`);
      }
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
