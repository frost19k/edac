#!/usr/bin/env node
/**
 * Postinstall script — copies the bundled plugin to OpenCode's plugin directory.
 *
 * After `npm install holographic-memory`, this script places the single-file
 * plugin at ~/.config/opencode/plugins/holographic-memory.ts so OpenCode
 * auto-loads it on next restart.
 */

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs')
const { join } = require('path')
const { homedir } = require('os')

const ROOT = join(__dirname, '..')
const BUNDLED = join(ROOT, 'dist', 'holographic-memory.ts')
const SKILL_SRC = join(ROOT, 'skills', 'holographic-memory', 'SKILL.md')
const PLUGIN_DIR = join(homedir(), '.config', 'opencode', 'plugins')
const SKILL_DIR = join(homedir(), '.config', 'opencode', 'skills', 'holographic-memory')
const DEST = join(PLUGIN_DIR, 'holographic-memory.ts')
const SKILL_DEST = join(SKILL_DIR, 'SKILL.md')

function install() {
  if (!existsSync(BUNDLED)) {
    console.error('✗ dist/holographic-memory.ts not found. Run `npm run build` first.')
    process.exit(1)
  }

  if (!existsSync(SKILL_SRC)) {
    console.error('✗ skills/holographic-memory/SKILL.md not found.')
    process.exit(1)
  }

  // Install plugin
  mkdirSync(PLUGIN_DIR, { recursive: true })
  const content = readFileSync(BUNDLED, 'utf-8')
  writeFileSync(DEST, content, 'utf-8')
  console.log(`✓ Installed holographic-memory plugin to ${DEST}`)

  // Install skill
  mkdirSync(SKILL_DIR, { recursive: true })
  const skill = readFileSync(SKILL_SRC, 'utf-8')
  writeFileSync(SKILL_DEST, skill, 'utf-8')
  console.log(`✓ Installed holographic-memory skill to ${SKILL_DEST}`)

  console.log('  Restart OpenCode to load the plugin and skill.')
}

install()
