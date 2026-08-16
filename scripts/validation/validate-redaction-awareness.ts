#!/usr/bin/env bun

/**
 * Redaction-Artifact Awareness Validator (TypeScript/Bun)
 *
 * Verifies that every EDAC agent file carries the redaction-artifact-awareness
 * directive, identified by the version marker:
 *   <!-- edac:redaction-artifact-awareness:v2 -->
 *
 * The marker is a mechanically-enforced contract: 14 agent bodies each carry
 * the directive inline (the only always-present surface in OpenCode), and this
 * lint prevents silent drift — a new agent file without the marker, or an edit
 * that removes it, fails validation.
 *
 * Exit codes:
 *   0 = Pass (all agent files carry the marker)
 *   1 = Fail (one or more agent files missing the marker)
 */

import { readFileSync } from 'fs';
import { join, relative } from 'path';
import { globSync } from 'glob';
import { colors, REPO_ROOT } from '../registry/shared';
import { MIRROR_DIR } from '../registry/dependency-resolution';

const MARKER = '<!-- edac:redaction-artifact-awareness:v2 -->';

let errors = 0;
let checked = 0;

function relPath(file: string): string {
  return relative(REPO_ROOT, file);
}

function collectAgentFiles(): string[] {
  const agentsDir = join(REPO_ROOT, MIRROR_DIR, 'agents');
  return globSync(join('**', '*.md'), { cwd: agentsDir, absolute: true }).sort();
}

function main(): void {
  console.log('🔍 Validating redaction-artifact awareness...');
  console.log('');

  const files = collectAgentFiles();

  if (files.length === 0) {
    console.log(`${colors.red}❌${colors.reset} No agent files found in ${MIRROR_DIR}/agents/`);
    process.exit(1);
  }

  for (const file of files) {
    checked++;
    const content = readFileSync(file, 'utf-8');
    const rel = relPath(file);

    if (!content.includes(MARKER)) {
      console.log(`${colors.red}❌${colors.reset} Missing redaction-artifact-awareness marker: ${rel}`);
      console.log(`   Expected: ${MARKER}`);
      errors++;
    }
  }

  // Summary
  console.log('');
  console.log('==========================================');
  if (errors > 0) {
    console.log(`${colors.red}❌${colors.reset} Validation failed: ${errors} of ${checked} agent file(s) missing the marker`);
    console.log('');
    console.log('Every agent file must carry the redaction-artifact-awareness directive.');
    console.log(`Add a rule/principle block containing: ${MARKER}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅${colors.reset} All ${checked} agent files carry the redaction-artifact-awareness marker.`);
    process.exit(0);
  }
}

main();
