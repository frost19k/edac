// Entity Extraction — Regex-based entity detection from fact content
// Pure functions: same input = same output, no side effects
// Faithful port from Hermes Agent (NousResearch/hermes-agent)

/** Entity extracted from text */
export interface ExtractedEntity {
  name: string
  type: 'person' | 'tool' | 'concept' | 'alias' | 'unknown'
}

// Regex patterns
const RE_CAPITALIZED_MULTI = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g
const RE_CAPITALIZED_SINGLE = /\b([A-Z][a-z]+)\b/g
const RE_DOUBLE_QUOTE = /"([^"]+)"/g
const RE_SINGLE_QUOTE = /'([^']+)'/g
const RE_AKA = /(\w+(?:\s+\w+)*)\s+(?:aka|also known as)\s+(\w+(?:\s+\w+)*)/gi

/** Common words to exclude from single-word entity extraction */
const ENTITY_STOPWORDS = new Set([
  'user', 'the', 'this', 'that', 'these', 'those', 'what', 'when', 'where',
  'which', 'while', 'with', 'from', 'have', 'will', 'been', 'being', 'would',
  'could', 'should', 'might', 'shall', 'may', 'can', 'does', 'did', 'done',
  'into', 'your', 'just', 'also', 'after', 'before', 'here', 'there', 'then',
  'than', 'them', 'they', 'their', 'our', 'his', 'her', 'its', 'not', 'but',
  'and', 'for', 'are', 'was', 'were', 'had', 'has', 'how', 'all', 'any',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'now', 'new', 'old', 'get', 'set', 'run', 'use',
  'used', 'using', 'make', 'made', 'need', 'want', 'like', 'well', 'back',
  'much', 'still', 'even', 'must', 'let', 'say', 'said', 'one', 'two',
])

/**
 * Extract entities from fact content using regex patterns.
 * Returns deduplicated, lowercased entity names.
 */
export function extractEntities(content: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = []
  const seen = new Set<string>()

  const addEntity = (name: string, type: ExtractedEntity['type']) => {
    const normalized = name.trim().toLowerCase()
    if (normalized.length > 0 && !seen.has(normalized) && !ENTITY_STOPWORDS.has(normalized)) {
      seen.add(normalized)
      entities.push({ name: normalized, type })
    }
  }

  // Capitalized multi-word names (e.g., "John Doe")
  for (const match of content.matchAll(RE_CAPITALIZED_MULTI)) {
    addEntity(match[1], 'person')
  }

  // Capitalized single words (e.g., "Python", "TypeScript")
  for (const match of content.matchAll(RE_CAPITALIZED_SINGLE)) {
    addEntity(match[1], 'concept')
  }

  // Double-quoted terms (e.g., "Python")
  for (const match of content.matchAll(RE_DOUBLE_QUOTE)) {
    addEntity(match[1], 'tool')
  }

  // Single-quoted terms (e.g., 'pytest')
  for (const match of content.matchAll(RE_SINGLE_QUOTE)) {
    addEntity(match[1], 'tool')
  }

  // AKA patterns (e.g., "Robert aka Bob")
  for (const match of content.matchAll(RE_AKA)) {
    addEntity(match[1], 'person')
    addEntity(match[2], 'alias')
  }

  return entities
}

/**
 * Normalize entity name for consistent storage and lookup.
 * Lowercases and trims whitespace.
 */
export function normalizeEntityName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Check if two entity names match (case-insensitive).
 */
export function entityNamesMatch(a: string, b: string): boolean {
  return normalizeEntityName(a) === normalizeEntityName(b)
}
