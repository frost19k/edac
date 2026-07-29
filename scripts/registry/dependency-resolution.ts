/**
 * Shared dependency resolution logic for registry validators.
 * Both validate-registry.ts and check-dependencies.ts import from here.
 *
 * Provides: parseDependency, resolveCategory, buildComponentMap, componentExists.
 */

/** Mirror directory name used by the src/ layout. */
export const MIRROR_DIR = 'src';

/** Structural type for component map values — avoids coupling to each file's Component interface. */
export interface ComponentRef {
  id: string;
  path: string;
}

/** Parsed dependency in `type:id` format. */
export interface ParsedDependency {
  type: string;
  id: string;
}

/**
 * Parse a dependency string in `type:id` format.
 * Returns null if the format is invalid (no colon separator).
 */
export function parseDependency(dep: string): ParsedDependency | null {
  const match = dep.match(/^([^:]+):(.+)$/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

/** Dependency type → registry category mapping. */
const CATEGORY_MAP: Record<string, string> = {
  agent: 'agents',
  subagent: 'subagents',
  command: 'commands',
  tool: 'tools',
  plugin: 'plugins',
  context: 'contexts',
  config: 'config',
  skill: 'skills',
};

/**
 * Resolve a dependency type (e.g. "context") to its registry category (e.g. "contexts").
 * Returns null if the type is unknown.
 */
export function resolveCategory(type: string): string | null {
  return CATEGORY_MAP[type] ?? null;
}

/**
 * Build a lookup map from registry components.
 * Keys: `type:id` (e.g. "agent:open-coder") and bare `id` (e.g. "open-coder").
 * Values: the component object (must satisfy at least `ComponentRef`).
 */
export function buildComponentMap<T extends ComponentRef>(
  components: Record<string, T[] | undefined>,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const [category, entries] of Object.entries(components)) {
    if (!entries) continue;
    const singularType = category.replace(/s$/, '');
    for (const component of entries) {
      map.set(`${singularType}:${component.id}`, component);
      map.set(component.id, component);
    }
  }
  return map;
}

/**
 * Check whether a dependency exists in the component map.
 * Handles `type:id` format and `*` wildcards via path-prefix matching.
 *
 * Wildcard semantics: if the id contains `*`, the portion before `*` is used as a
 * path prefix. For `context` type deps the prefix is further prepended with `context/`.
 * At least one component in the map must have a `path` starting with that prefix.
 *
 * For non-wildcard deps, checks both the `type:id` key and the bare `id` key.
 */
export function componentExists(
  dep: string,
  componentMap: Map<string, ComponentRef>,
): boolean {
  const parsed = parseDependency(dep);
  if (!parsed) return false;

  const { type, id } = parsed;

  // Wildcard: validate that at least one component matches the prefix via its path
  if (id.includes('*')) {
    const prefix = id.split('*')[0];
    const pathPrefix = type === 'context' ? `context/${prefix}` : prefix;
    for (const component of componentMap.values()) {
      if (component.path.startsWith(pathPrefix)) return true;
    }
    return false;
  }

  // Exact match: check type:id and bare id keys
  const fullKey = `${type}:${id}`;
  return componentMap.has(fullKey) || componentMap.has(id);
}
