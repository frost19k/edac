// Response Serialization — Project internal scoring artifacts out of tool output
// Pure functions: same input = same output, no side effects

import type { Fact, ScoredFact } from './types'

/** A fact as exposed to tool callers (internal HRR vector removed) */
export interface PublicFact extends Omit<Fact, 'hrr_vector'> {}

/** A scored fact as exposed to tool callers (internal HRR vector and FTS rank removed) */
export interface ScoredPublicFact extends PublicFact {
  score: number
}

/**
 * Project a stored Fact into its public tool-response shape.
 * Strips the internal HRR vector BLOB before JSON serialization.
 */
export function toPublicFact(fact: Fact): PublicFact {
  const { hrr_vector, ...publicFact } = fact
  return publicFact
}

/**
 * Project a scored Fact into its public tool-response shape.
 * Strips the internal HRR vector BLOB and FTS rank before JSON serialization.
 */
export function toScoredPublicFact(fact: ScoredFact & { fts_rank?: number }): ScoredPublicFact {
  const { hrr_vector, fts_rank, ...publicFact } = fact
  return publicFact
}
