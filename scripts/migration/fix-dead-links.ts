#!/usr/bin/env bun

/**
 * Dead Cross-Link Repair Script
 *
 * Repairs bare-filename references to renamed/deleted/split files
 * across all context markdown files. These are NOT markdown links (the link
 * validator passes) — they're prose references, ASCII tree entries,
 * and table cells that mention filenames.
 *
 * Categories:
 * 1. Simple renames — mechanical find-and-replace
 * 2. Deleted files — remove the reference line or replace with a comment
 * 3. Split files — handled manually (context-aware)
 *
 * Historical references in CHANGELOG.md are preserved.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTEXT_DIR = join(REPO_ROOT, 'src', 'context');

// Simple renames: old basename → new basename
const RENAMES: Record<string, string> = {
  'navigation-design.md': 'navigation-design-basics.md',
  'mvi-principle.md': 'mvi.md',
  'scrollytelling-setup.md': 'building-scrollytelling-pages.md',
  'headphone-scrollytelling.md': 'scrollytelling-headphone.md',
  'animation-image-prompts.md': 'scroll-animation-prompts.md',
};

// Files that were renamed from README.md → navigation.md in the context system.
// Only replace when the reference is clearly about the context-system README,
// not a generic project README. We skip code blocks and CHANGELOG.md.
const README_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // In prose: "Update README.md" → "Update navigation.md"
  { pattern: /\bREADME\.md\b/g, replacement: 'navigation.md' },
];

// Deleted files — references to remove or replace
const DELETED_FILES = [
  'ui-navigation.md',
  'enhanced-task-schema.md',
  'compatibility-layer-workflow.md',
];

// Split files — these need manual handling
const SPLIT_FILES = ['templates.md', 'typescript.md'];

function main(): void {
  const files = globSync(join(CONTEXT_DIR, '**/*.md'), { nodir: true });
  let totalChanges = 0;
  const changedFiles: string[] = [];

  for (const file of files) {
    const relPath = file.replace(REPO_ROOT + '/', '');
    const content = readFileSync(file, 'utf-8');
    let modified = content;
    let fileChanges = 0;

    // Skip CHANGELOG.md — historical references stay
    if (relPath.endsWith('CHANGELOG.md')) continue;

    // 1. Apply simple renames
    for (const [oldName, newName] of Object.entries(RENAMES)) {
      const regex = new RegExp(oldName.replace(/\./g, '\\.'), 'g');
      const before = modified;
      modified = modified.replace(regex, newName);
      if (modified !== before) {
        const count = (before.match(regex) || []).length;
        fileChanges += count;
      }
    }

    // 2. Apply README.md → navigation.md (skip inside code blocks)
    // We need to be careful: only replace README.md when it's clearly
    // referring to the context-system navigation file, not a project README.
    // Heuristic: replace in files under context-system/ and operations/
    // where the context is about context file operations.
    if (relPath.includes('context-system/') || relPath.includes('core/guides/')) {
      // Split by code blocks and only replace outside them
      const parts = modified.split(/(```[\s\S]*?```)/g);
      for (let i = 0; i < parts.length; i += 2) {
        // Only process non-code-block parts (even indices)
        const before = parts[i];
        parts[i] = before.replace(/\bREADME\.md\b/g, 'navigation.md');
        if (parts[i] !== before) {
          fileChanges += (before.match(/\bREADME\.md\b/g) || []).length;
        }
      }
      modified = parts.join('');
    }

    // 3. Handle deleted file references
    // For ui-navigation.md: replace with a comment or remove the line
    // For enhanced-task-schema.md: remove or comment out
    // For compatibility-layer-workflow.md: remove the reference
    // These are context-sensitive, so we just flag them for manual review
    for (const deleted of DELETED_FILES) {
      const regex = new RegExp(deleted.replace(/\./g, '\\.'), 'g');
      if (regex.test(modified)) {
        const count = (modified.match(regex) || []).length;
        if (count > 0) {
          console.log(`  ⚠ ${relPath}: ${count} reference(s) to deleted ${deleted} (manual review needed)`);
        }
      }
    }

    // 4. Flag split-file references for manual review
    for (const split of SPLIT_FILES) {
      // Match the split file name but not the split-into files
      // e.g., templates.md but not templates-concept-example.md
      const regex = new RegExp(`\\b${split.replace(/\./g, '\\.')}\\b`, 'g');
      if (regex.test(modified)) {
        const count = (modified.match(regex) || []).length;
        if (count > 0) {
          console.log(`  ⚠ ${relPath}: ${count} reference(s) to split ${split} (manual review needed)`);
        }
      }
    }

    if (fileChanges > 0) {
      writeFileSync(file, modified);
      totalChanges += fileChanges;
      changedFiles.push(`${relPath} (${fileChanges} changes)`);
    }
  }

  console.log(`\nDone. ${totalChanges} replacements across ${changedFiles.length} files:`);
  for (const f of changedFiles) {
    console.log(`  ${f}`);
  }
}

main();
