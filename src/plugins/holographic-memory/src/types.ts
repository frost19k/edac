// Holographic Memory — Type Definitions
// Faithful port from Hermes Agent's holographic memory plugin

/** Configuration for the holographic memory plugin */
export interface HolographicConfig {
  /** Path to SQLite database file */
  db_path: string
  /** Auto-extract facts from conversation on session end */
  auto_extract: boolean
  /** Default trust score for new facts (0-1) */
  default_trust: number
  /** HRR vector dimensionality */
  hrr_dim: number
  /** Weight of HRR similarity in hybrid search (0-1) */
  hrr_weight: number
  /** Half-life for temporal decay in days (0 = disabled) */
  temporal_decay_half_life: number
  /** Minimum trust threshold for retrieval */
  min_trust_threshold: number
}

/** A stored fact with its metadata */
export interface Fact {
  fact_id: number
  content: string
  category: string
  tags: string
  trust_score: number
  retrieval_count: number
  helpful_count: number
  created_at: string
  updated_at: string
  hrr_vector: Uint8Array | null
}

/** A fact with its retrieval score */
export interface ScoredFact extends Fact {
  score: number
}

/** Entity extracted from fact content */
export interface Entity {
  entity_id: number
  name: string
  entity_type: string
  aliases: string
  created_at: string
}

/** Junction record linking facts to entities */
export interface FactEntity {
  fact_id: number
  entity_id: number
}

/** Category-level superposed HRR memory bank */
export interface MemoryBank {
  bank_id: number
  bank_name: string
  vector: Uint8Array
  dim: number
  fact_count: number
  updated_at: string
}

/** Result of a contradiction detection */
export interface ContradictionResult {
  fact_a: Pick<Fact, 'fact_id' | 'content'>
  fact_b: Pick<Fact, 'fact_id' | 'content'>
  entity_overlap: number
  content_similarity: number
  contradiction_score: number
  shared_entities: string[]
}

/** Actions for the fact_store tool */
export type FactStoreAction =
  | 'add'
  | 'search'
  | 'probe'
  | 'related'
  | 'reason'
  | 'contradict'
  | 'update'
  | 'remove'
  | 'list'

/** Actions for the fact_feedback tool */
export type FactFeedbackAction = 'helpful' | 'unhelpful'

/** Parameters for fact_store tool */
export interface FactStoreParams {
  action: FactStoreAction
  content?: string
  category?: string
  tags?: string
  query?: string
  entity?: string
  entities?: string[]
  fact_id?: number
  trust_delta?: number
  min_trust?: number
  limit?: number
  threshold?: number
}

/** Parameters for fact_feedback tool */
export interface FactFeedbackParams {
  action: FactFeedbackAction
  fact_id: number
}

/** Result of adding a fact */
export interface AddFactResult {
  fact_id: number
  status: 'added' | 'exists'
}

/** Result of searching facts */
export interface SearchResult {
  results: ScoredFact[]
  count: number
}

/** Result of contradiction detection */
export interface ContradictionDetectionResult {
  results: ContradictionResult[]
  count: number
}

/** Result of feedback */
export interface FeedbackResult {
  fact_id: number
  old_trust: number
  new_trust: number
  helpful_count: number
}
