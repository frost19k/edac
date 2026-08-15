/**
 * Shared utilities for registry validation scripts.
 *
 * Provides: colors, REPO_ROOT, printSuccess, printError, printWarning,
 * printInfo, Component interface, Registry interface.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Colors — superset of all variants across the 5 consumer scripts.
export const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  magenta: '\x1b[0;35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// Repository root — computed from this module's location (scripts/registry/).
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

// Types
export interface Component {
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

export interface Registry {
  version: string;
  schema_version: string;
  repository: string;
  categories?: Record<string, string>;
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
  profiles?: Record<string, {
    name: string;
    description: string;
    components: string[];
  }>;
}

// Print functions — success/info to stdout, error/warning to stderr.
export function printSuccess(msg: string): void {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

export function printError(msg: string): void {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
}

export function printWarning(msg: string): void {
  console.error(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

export function printInfo(msg: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}
