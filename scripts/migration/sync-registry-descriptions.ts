#!/usr/bin/env bun

/**
 * Sync registry.json context descriptions to match frontmatter descriptions.
 *
 * For each context entry in registry.json, reads the corresponding file's
 * YAML frontmatter `description` field and updates the registry entry's
 * `description` to match. Reports changes; applies with --apply flag.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json');
const SRC_DIR = join(REPO_ROOT, 'src');

interface RegistryEntry {
  id: string;
  name: string;
  type: string;
  path: string;
  description: string;
  tags: string[];
  dependencies: string[];
  category: string;
}

interface Registry {
  version: string;
  schema_version: string;
  repository: string;
  components: {
    agents: RegistryEntry[];
    subagents: RegistryEntry[];
    commands: RegistryEntry[];
    tools: RegistryEntry[];
    plugins: RegistryEntry[];
    contexts: RegistryEntry[];
    skills: RegistryEntry[];
    [key: string]: RegistryEntry[];
  };
  profiles: Record<string, unknown>;
  metadata: {
    lastUpdated: string;
    schemaVersion: string;
  };
}

function extractFrontmatterDescription(filePath: string): string | null {
  const content = readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  // Match description: "text" or description: text
  const descMatch = fm.match(/^description:\s*(?:"([^"]*)"|(.+))$/m);
  if (!descMatch) return null;

  return descMatch[1] ?? descMatch[2]?.trim() ?? null;
}

function main(): void {
  const apply = process.argv.includes('--apply');
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as Registry;

  const contexts = registry.components.contexts;
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const changes: Array<{ id: string; path: string; oldDesc: string; newDesc: string }> = [];

  for (const entry of contexts) {
    const fullPath = join(SRC_DIR, entry.path);

    let newDesc: string | null;
    try {
      newDesc = extractFrontmatterDescription(fullPath);
    } catch {
      console.log(`  ✗ File not found: ${entry.path} (${entry.id})`);
      notFound++;
      continue;
    }

    if (newDesc === null) {
      console.log(`  ⚠ No frontmatter description: ${entry.path} (${entry.id})`);
      skipped++;
      continue;
    }

    if (entry.description === newDesc) {
      skipped++;
      continue;
    }

    changes.push({
      id: entry.id,
      path: entry.path,
      oldDesc: entry.description,
      newDesc,
    });

    console.log(`  ~ ${entry.id}:`);
    console.log(`      old: ${entry.description}`);
    console.log(`      new: ${newDesc}`);

    if (apply) {
      entry.description = newDesc;
    }
    updated++;
  }

  if (apply && updated > 0) {
    registry.metadata.lastUpdated = '2026-08-13';
    writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
    console.log(`\n✓ Applied ${updated} description updates + metadata.lastUpdated → 2026-08-13`);
  } else {
    console.log(`\nDry run: ${updated} would update, ${skipped} already synced, ${notFound} not found`);
    console.log('Run with --apply to make changes.');
  }
}

main();
