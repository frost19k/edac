#!/usr/bin/env bun

/**
 * Context File Frontmatter Migration Script
 *
 * Converts HTML comment headers to YAML frontmatter across all src/context markdown files.
 * Also performs mechanical hygiene: removes body metadata lines, normalizes section names,
 * cleans placeholder tokens, replaces OAC installer variables.
 *
 * All files are versioned as 1.0 and dated to the migration date — these are EDAC
 * context files, not OAC carryovers.
 *
 * Usage:
 *   bun run scripts/migration/context-frontmatter-migration.ts           # dry-run (default)
 *   bun run scripts/migration/context-frontmatter-migration.ts --apply   # apply changes
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTEXT_GLOB = join(REPO_ROOT, 'src', 'context', '**/*.md');
const TODAY = '2026-08-13';
const VERSION = '1.0';
const APPLY = process.argv.includes('--apply');

// Stats
let processed = 0;
let skipped = 0;
let flagged = 0;
const flaggedFiles: string[] = [];
const changes: string[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────

function yamlEscape(value: string): string {
  // Quote if the value contains characters that would break YAML parsing
  if (/[:\[\]\{\}#&\*!\|>'"%@`]/.test(value) || value.startsWith('-') || value.startsWith(' ') || value.endsWith(' ')) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function buildFrontmatter(description: string): string {
  return `---\ndescription: ${yamlEscape(description)}\nversion: ${VERSION}\nupdated: ${TODAY}\n---`;
}

function hasYamlFrontmatter(content: string): boolean {
  return content.startsWith('---\n');
}

function extractYamlFrontmatter(content: string): { frontmatter: string; body: string } | null {
  if (!content.startsWith('---\n')) return null;
  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) return null;
  return {
    frontmatter: content.slice(4, endIndex),
    body: content.slice(endIndex + 5),
  };
}

function hasHtmlComment(content: string): boolean {
  return /^<!-- Context:/.test(content) || /\n<!-- Context:/.test(content);
}

function extractHtmlComment(content: string): { comment: string; body: string } | null {
  const match = content.match(/^(<!-- Context:.*?-->)\n*/);
  if (!match) return null;
  return {
    comment: match[1],
    body: content.slice(match[0].length),
  };
}

function isPlaceholder(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === '[]') return true;
  if (/^\[.+\]$/.test(trimmed) && trimmed.length < 30) return true; // [1 sentence], [What this covers], etc.
  return false;
}

// ─── Purpose Extraction ───────────────────────────────────────────────────

interface PurposeResult {
  description: string;
  removeLine: string | null; // the exact line to remove from body (null = don't remove)
  source: string; // how the purpose was found
}

/**
 * Extract the file-level purpose from the body.
 * Looks for labeled purpose lines before the first ## heading,
 * then falls back to blockquote, ## Overview, or plain prose.
 */
function extractPurpose(body: string): PurposeResult | null {
  const lines = body.split('\n');

  // Find the H1 line
  let h1Index = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^# /.test(lines[i])) {
      h1Index = i;
      break;
    }
  }
  if (h1Index === -1) return null;

  // Find the first ## heading after H1
  let firstH2Index = -1;
  for (let i = h1Index + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      firstH2Index = i;
      break;
    }
  }

  // Search for labeled purpose lines between H1 and first ## (or end of file)
  const searchEnd = firstH2Index === -1 ? lines.length : firstH2Index;

  // Track code blocks — don't extract from inside fenced code blocks
  let inCodeBlock = false;

  for (let i = h1Index + 1; i < searchEnd; i++) {
    const line = lines[i];

    // Track fenced code blocks
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // **Purpose**: <text>  (also **Purpose:** variant)
    // **Scope**: <text>  (variant label)
    // **Orientation:** <text>  (variant label)
    // Use a single regex that handles all bold-labeled purpose variants
    let match = line.match(/^\*\*(?:Purpose|Scope|Orientation)[*:]+\s*(.+)$/);
    if (match) {
      const text = match[1].trim();
      if (!isPlaceholder(text)) {
        return { description: text, removeLine: line, source: line.startsWith('**Scope') ? 'scope' : line.startsWith('**Orientation') ? 'orientation' : 'purpose-bold' };
      }
    }

    // - **Purpose**: <text>  (list-item form)
    match = line.match(/^-\s+\*\*(?:Purpose|Scope|Orientation)[*:]+\s*(.+)$/);
    if (match) {
      const text = match[1].trim();
      if (!isPlaceholder(text)) {
        return { description: text, removeLine: line, source: 'purpose-list' };
      }
    }
  }

  // If no labeled purpose found, try blockquote after H1
  inCodeBlock = false;
  for (let i = h1Index + 1; i < searchEnd; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Blockquote: > <text> (but not > **Note** or > ⚠️)
    if (/^>\s+(?!.*\*\*Note\*\*|.*⚠️)(.+)/.test(line)) {
      const match = line.match(/^>\s+(.+)/);
      if (match) {
        const text = match[1].trim();
        // Skip if it's a metadata blockquote (What/When/Related)
        if (/^\*\*What\*\*/.test(text) || /^\*\*When\*\*/.test(text) || /^\*\*Related\*\*/.test(text)) {
          // Extract the "What" line as purpose
          const whatMatch = text.match(/^\*\*What[*:]+\s*(.+)$/);
          if (whatMatch) {
            return { description: whatMatch[1].trim(), removeLine: null, source: 'blockquote-what' };
          }
          continue;
        }
        if (!isPlaceholder(text) && text.length > 10) {
          return { description: text, removeLine: line, source: 'blockquote' };
        }
      }
    }
  }

  // Try ## Overview or ## Purpose + first paragraph
  // Search all ## headings, not just the first
  for (let h = 0; h < lines.length; h++) {
    if (!/^## (Overview|Purpose)/.test(lines[h])) continue;
    const source = /^## Overview/.test(lines[h]) ? 'overview' : 'purpose-section';
    for (let i = h + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '' || line === '---') continue;
      if (/^## /.test(line)) break; // next heading
      if (line.length > 10 && !isPlaceholder(line)) {
        return { description: line, removeLine: null, source };
      }
      break;
    }
  }

  // Try plain prose after H1 (first non-empty, non-metadata line before first ##)
  inCodeBlock = false;
  for (let i = h1Index + 1; i < searchEnd; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const trimmed = line.trim();
    if (trimmed === '' || trimmed === '---') continue;
    if (/^\*\*/.test(trimmed)) continue; // skip metadata lines like **Purpose**, **Last Updated**, etc.
    if (/^>/.test(trimmed)) continue; // skip blockquotes (already tried)
    if (/^#/.test(trimmed)) continue; // skip headings
    if (/^\|/.test(trimmed)) continue; // skip table rows
    if (/^-/.test(trimmed)) continue; // skip list items

    // First plain prose line
    if (trimmed.length > 10 && !isPlaceholder(trimmed)) {
      return { description: trimmed, removeLine: null, source: 'plain-prose' };
    }
    break;
  }

  return null; // no purpose found
}

// ─── Body Cleanup ──────────────────────────────────────────────────────────

/**
 * Remove body metadata lines that are subsumed into frontmatter.
 */
function cleanBody(body: string, removeLine: string | null): string {
  let lines = body.split('\n');
  const result: string[] = [];
  let prevWasBlank = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Remove the specific purpose line
    if (removeLine !== null && line === removeLine) continue;

    // Remove **Last Updated** lines
    if (/^\*\*Last Updated[*:]+\s*/.test(line)) continue;

    // Remove **Category** lines
    if (/^\*\*Category[*:]+\s*/.test(line)) continue;

    // Remove **Used by** lines
    if (/^\*\*Used by[*:]+\s*/.test(line)) continue;

    // Remove **Audience** lines (intl template files)
    if (/^\*\*Audience[*:]+\s*/.test(line)) continue;

    // Remove **Update When** lines (intl template files)
    if (/^\*\*Update When[*:]+\s*/.test(line)) continue;

    // Collapse multiple blank lines into one
    if (trimmed === '') {
      if (prevWasBlank) continue;
      prevWasBlank = true;
    } else {
      prevWasBlank = false;
    }

    result.push(line);
  }

  // Remove leading blank lines
  while (result.length > 0 && result[0].trim() === '') {
    result.shift();
  }

  // Remove trailing blank lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }

  return result.join('\n') + '\n';
}

/**
 * Normalize section names and replace tokens across the body.
 */
function normalizeBody(body: string): string {
  let lines = body.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    let processed = line;

    if (!inCodeBlock) {
      // Normalize ## Related variants → ## Related Files
      if (/^## Related\s*$/.test(line)) {
        processed = '## Related Files';
      } else if (/^## Related Context\s*$/.test(line)) {
        processed = '## Related Files';
      }

      // Replace OAC installer variable
      processed = processed.replace(/OPENCODE_INSTALL_DIR/g, 'EDAC_INSTALL_DIR');

      // Replace sanitized placeholder tokens
      processed = processed.replace(/__VG_PROXY_AUTH_URL_\w+__/g, 'https://example.com');
      processed = processed.replace(/__VG_EMAIL_\w+__/g, 'user@example.com');
    }

    result.push(processed);
  }

  return result.join('\n');
}

// ─── File Processing ──────────────────────────────────────────────────────

function processFile(filePath: string): void {
  const relPath = relative(REPO_ROOT, filePath);
  const content = readFileSync(filePath, 'utf-8');

  // Case 1: Already fully migrated (YAML frontmatter with all fields, no HTML comment)
  if (hasYamlFrontmatter(content)) {
    const parsed = extractYamlFrontmatter(content);
    if (parsed) {
      const hasAllFields = parsed.frontmatter.includes('description:') &&
                           parsed.frontmatter.includes('version:') &&
                           parsed.frontmatter.includes('updated:');
      const hasHtml = hasHtmlComment(parsed.body);

      if (hasAllFields && !hasHtml) {
        console.log(`  SKIP   ${relPath} (already migrated)`);
        skipped++;
        return;
      }

      // Partial YAML — fix it
      if (hasAllFields && hasHtml) {
        // Has YAML + HTML comment — remove HTML comment, normalize body
        const cleaned = cleanBody(parsed.body, null);
        const normalized = normalizeBody(cleaned);
        const newContent = `---\n${parsed.frontmatter}\n---\n\n${normalized}`;
        changes.push(`${relPath}: removed residual HTML comment`);
        if (APPLY) writeFileSync(filePath, newContent);
        console.log(`  FIX    ${relPath} (removed residual HTML comment)`);
        processed++;
        return;
      }

      // Has YAML but missing fields or has non-standard fields — rebuild frontmatter
      // Strip non-standard fields (id, name, etc.), keep description if present
      const fmLines = parsed.frontmatter.split('\n');
      const keptLines: string[] = [];
      let existingDescription: string | null = null;

      for (const fmLine of fmLines) {
        if (fmLine.startsWith('description:')) {
          existingDescription = fmLine.replace(/^description:\s*/, '');
          // Remove surrounding quotes if present
          if (existingDescription.startsWith('"') && existingDescription.endsWith('"')) {
            existingDescription = existingDescription.slice(1, -1);
          }
          keptLines.push(fmLine);
        } else if (fmLine.startsWith('version:') || fmLine.startsWith('updated:')) {
          // Skip — we'll re-add with correct values
        } else if (fmLine.startsWith('id:') || fmLine.startsWith('name:') || fmLine.startsWith('priority:') || fmLine.startsWith('context:')) {
          // Strip non-standard fields
          changes.push(`${relPath}: stripped non-standard field '${fmLine.split(':')[0]}'`);
        } else if (fmLine.trim() === '' || fmLine.startsWith('#')) {
          // Keep blank lines and comments
        } else {
          // Keep unknown fields
          keptLines.push(fmLine);
        }
      }

      // Get description: from existing YAML or extract from body
      let description = existingDescription;
      let removeLine: string | null = null;

      if (!description) {
        const purpose = extractPurpose(parsed.body);
        if (purpose) {
          description = purpose.description;
          removeLine = purpose.removeLine;
          changes.push(`${relPath}: extracted description (${purpose.source})`);
        }
      }

      if (!description) {
        flaggedFiles.push(relPath);
        console.log(`  FLAG   ${relPath} (no description found)`);
        flagged++;
        // Still write the file with a placeholder description
        description = 'TODO: add description';
      }

      const cleaned = cleanBody(parsed.body, removeLine);
      const normalized = normalizeBody(cleaned);
      // Remove any HTML comment from the body
      const noHtml = normalized.replace(/^(<!-- Context:.*?-->)\n*/m, '');
      const newFm = buildFrontmatter(description);
      const newContent = `${newFm}\n\n${noHtml}`;

      changes.push(`${relPath}: rebuilt frontmatter (stripped non-standard fields)`);
      if (APPLY) writeFileSync(filePath, newContent);
      console.log(`  MIGRATE ${relPath} (rebuilt frontmatter)`);
      processed++;
      return;
    }
  }

  // Case 2: Has HTML comment but no YAML — standard migration
  const htmlParsed = extractHtmlComment(content);
  if (htmlParsed) {
    let body = htmlParsed.body;

    // Check for an existing YAML block in the body (pilot migration files)
    // These have: HTML comment, then YAML block, then content
    let existingDescription: string | null = null;
    const yamlInBody = body.match(/^\s*---\n([\s\S]*?)\n---\n*/);
    if (yamlInBody) {
      const yamlContent = yamlInBody[1];
      const descMatch = yamlContent.match(/^description:\s*(.+)$/m);
      if (descMatch) {
        existingDescription = descMatch[1].trim();
        if (existingDescription.startsWith('"') && existingDescription.endsWith('"')) {
          existingDescription = existingDescription.slice(1, -1);
        }
      }
      // Remove the YAML block from the body
      body = body.slice(yamlInBody[0].length);
      changes.push(`${relPath}: removed existing YAML block from body`);
    }

    let description: string;
    let removeLine: string | null = null;
    let source = '';

    if (existingDescription) {
      description = existingDescription;
      source = 'existing-yaml';
      // Still need to find and remove the body **Purpose** line (it duplicates the YAML description)
      const purpose = extractPurpose(body);
      if (purpose && purpose.removeLine) {
        removeLine = purpose.removeLine;
      }
      changes.push(`${relPath}: using existing YAML description`);
    } else {
      const purpose = extractPurpose(body);
      if (purpose) {
        description = purpose.description;
        removeLine = purpose.removeLine;
        source = purpose.source;
        changes.push(`${relPath}: extracted description (${purpose.source})`);
      } else {
        flaggedFiles.push(relPath);
        console.log(`  FLAG   ${relPath} (no description found)`);
        flagged++;
        description = 'TODO: add description';
        source = 'FLAGGED';
      }
    }

    const cleaned = cleanBody(body, removeLine);
    const normalized = normalizeBody(cleaned);
    const newFm = buildFrontmatter(description);
    const newContent = `${newFm}\n\n${normalized}`;

    if (APPLY) writeFileSync(filePath, newContent);
    console.log(`  MIGRATE ${relPath} (${source})`);
    processed++;
    return;
  }

  // Case 3: No HTML comment and no YAML — shouldn't happen but handle it
  console.log(`  FLAG   ${relPath} (no HTML comment or YAML frontmatter found)`);
  flaggedFiles.push(relPath);
  flagged++;
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  const files = globSync(CONTEXT_GLOB, { nodir: true });

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Context Frontmatter Migration                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Found ${files.length} context files`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN (use --apply to write changes)'}`);
  console.log('');

  for (const file of files) {
    processFile(file);
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Migration Summary:');
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Flagged:   ${flagged}`);
  console.log('════════════════════════════════════════════════════════════════');

  if (flaggedFiles.length > 0) {
    console.log('');
    console.log('Flagged files (need manual description authoring):');
    for (const f of flaggedFiles) {
      console.log(`  ${f}`);
    }
  }

  if (changes.length > 0 && !APPLY) {
    console.log('');
    console.log(`(${changes.length} changes previewed — run with --apply to write)`);
  }
}

main();
