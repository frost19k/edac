// Retrieval Pipeline — Multi-strategy hybrid retrieval
// Faithful port from Hermes Agent (NousResearch/hermes-agent)

import * as hrr from './hrr'
import { normalizeEntityName } from './entities'
import type { HolographicStore } from './store'
import type { Fact, ScoredFact, ContradictionResult, HolographicConfig } from './types'

/** Default retrieval weights (must sum to 1.0) */
const DEFAULT_FTS_WEIGHT = 0.4
const DEFAULT_JACCARD_WEIGHT = 0.3
const DEFAULT_HRR_WEIGHT = 0.3

/** Maximum facts for contradiction detection (O(n²) guard) */
const CONTRADICTION_MAX_FACTS = 500

/** Ceiling on how many facts to decode for non-FTS retrieval strategies */
const CANDIDATE_FETCH_CAP = 500

/**
 * FactRetriever — 5 retrieval strategies for holographic memory.
 * Each strategy serves different query patterns.
 */
export class FactRetriever {
  private store: HolographicStore
  private dim: number
  private hrrWeight: number
  private halfLife: number
  private minTrust: number

  constructor(store: HolographicStore, config: HolographicConfig) {
    this.store = store
    this.dim = config.hrr_dim
    this.hrrWeight = config.hrr_weight
    this.halfLife = config.temporal_decay_half_life
    this.minTrust = config.min_trust_threshold
  }

  /**
   * Strategy 1: Hybrid search (FTS5 + Jaccard + HRR).
   * Primary retrieval path. Four-stage pipeline.
   */
  async search(
    query: string,
    category?: string,
    minTrust?: number,
    limit: number = 10
  ): Promise<ScoredFact[]> {
    const trust = minTrust ?? this.minTrust
    const ftsWeight = DEFAULT_FTS_WEIGHT
    const jaccardWeight = DEFAULT_JACCARD_WEIGHT
    const hrrWeight = this.hrrWeight

    // Stage 1: FTS5 candidates (3× limit for reranking headroom)
    const candidates = this.store.ftsCandidates(query, category, trust, limit * 3)
    if (candidates.length === 0) return []

    const queryTokens = tokenize(query)
    const queryVec = await hrr.encodeText(query, this.dim)

    // Stage 2-4: Rerank each candidate
    const scored: ScoredFact[] = []
    const retrievedIds: number[] = []

    for (const fact of candidates) {
      // Stage 2: Jaccard token overlap
      const contentTokens = new Set(tokenize(fact.content))
      const tagTokens = new Set(fact.tags.split(',').map(t => t.trim()).filter(Boolean))
      const allTokens = new Set([...contentTokens, ...tagTokens])
      const jaccard = jaccardSimilarity(queryTokens, allTokens)

      // Stage 3: HRR cosine similarity
      let hrrSim = 0
      if (hrrWeight > 0 && fact.hrr_vector) {
        const factVec = hrr.bytesToPhases(new Uint8Array(fact.hrr_vector))
        hrrSim = (hrr.similarity(queryVec, factVec) + 1.0) / 2.0 // shift to [0,1]
      }

      // Stage 4: Trust-weighted final scoring
      const ftsScore = normalizeFtsRank(fact.fts_rank)
      let score = (ftsWeight * ftsScore) + (jaccardWeight * jaccard) + (hrrWeight * hrrSim)
      score *= fact.trust_score

      // Optional temporal decay
      if (this.halfLife > 0) {
        score *= temporalDecay(fact.updated_at, this.halfLife)
      }

      retrievedIds.push(fact.fact_id)

      scored.push({
        ...fact,
        hrr_vector: fact.hrr_vector ? new Uint8Array(fact.hrr_vector) : null,
        score,
      })
    }

    // Batch increment retrieval counts (single SQL write)
    this.store.incrementRetrievals(retrievedIds)

    // Sort by score descending, return top N
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
  }

  /**
   * Strategy 2: Entity-specific algebraic recall (probe).
   * Uses HRR algebra to find ALL facts about a specific entity.
   */
  async probe(
    entity: string,
    category?: string,
    limit: number = 10,
    minTrust?: number
  ): Promise<ScoredFact[]> {
    const trust = minTrust ?? this.minTrust
    const roleEntity = await hrr.encodeAtom('__hrr_role_entity__', this.dim)
    const entityVec = await hrr.encodeAtom(normalizeEntityName(entity), this.dim)
    const probeKey = hrr.bind(entityVec, roleEntity)

    // Try memory bank first (fast path)
    if (category) {
      const bank = this.store.getBank(category)
      if (bank && bank.vector) {
        const bankVec = hrr.bytesToPhases(new Uint8Array(bank.vector))
        const extracted = hrr.unbind(bankVec, probeKey)
        return this.scoreFactsByVector(extracted, category, limit, trust)
      }
    }

    // Fallback: score each fact individually
    const facts = category
      ? this.store.listFacts(category, trust, CANDIDATE_FETCH_CAP)
      : this.store.listFacts(undefined, trust, CANDIDATE_FETCH_CAP)

    const roleContent = await hrr.encodeAtom('__hrr_role_content__', this.dim)
    const scored: ScoredFact[] = []
    const contentVecCache = new Map<string, Float64Array>()

    for (const fact of facts) {
      if (!fact.hrr_vector) continue

      const factVec = hrr.bytesToPhases(new Uint8Array(fact.hrr_vector))
      const residual = hrr.unbind(factVec, probeKey)

      let contentVec = contentVecCache.get(fact.content)
      if (!contentVec) {
        contentVec = hrr.bind(await hrr.encodeText(fact.content, this.dim), roleContent)
        contentVecCache.set(fact.content, contentVec)
      }

      const sim = hrr.similarity(residual, contentVec)
      const score = ((sim + 1.0) / 2.0) * fact.trust_score

      scored.push({ ...fact, hrr_vector: new Uint8Array(fact.hrr_vector), score })
    }

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
  }

  /**
   * Strategy 3: Structural adjacency (related).
   * Finds facts connected to an entity through shared context.
   */
  async related(
    entity: string,
    category?: string,
    limit: number = 10,
    minTrust?: number
  ): Promise<ScoredFact[]> {
    const entityVec = await hrr.encodeAtom(normalizeEntityName(entity), this.dim)
    const roleEntity = await hrr.encodeAtom('__hrr_role_entity__', this.dim)
    const roleContent = await hrr.encodeAtom('__hrr_role_content__', this.dim)

    const trust = minTrust ?? this.minTrust
    const facts = category
      ? this.store.listFacts(category, trust, CANDIDATE_FETCH_CAP)
      : this.store.listFacts(undefined, trust, CANDIDATE_FETCH_CAP)

    const scored: ScoredFact[] = []

    for (const fact of facts) {
      if (!fact.hrr_vector) continue

      const factVec = hrr.bytesToPhases(new Uint8Array(fact.hrr_vector))
      const residual = hrr.unbind(factVec, entityVec)

      // Check if entity appears in either role
      const entityRoleSim = hrr.similarity(residual, roleEntity)
      const contentRoleSim = hrr.similarity(residual, roleContent)
      const bestSim = Math.max(entityRoleSim, contentRoleSim)

      const score = ((bestSim + 1.0) / 2.0) * fact.trust_score
      scored.push({ ...fact, hrr_vector: new Uint8Array(fact.hrr_vector), score })
    }

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
  }

  /**
   * Strategy 4: Compositional AND query (reason).
   * Vector-space JOIN: finds facts related to ALL entities simultaneously.
   */
  async reason(
    entities: string[],
    category?: string,
    limit: number = 10,
    minTrust?: number
  ): Promise<ScoredFact[]> {
    const roleEntity = await hrr.encodeAtom('__hrr_role_entity__', this.dim)
    const roleContent = await hrr.encodeAtom('__hrr_role_content__', this.dim)

    // Compute probe keys for each entity
    const probeKeys: Float64Array[] = []
    for (const entity of entities) {
      const entityVec = await hrr.encodeAtom(normalizeEntityName(entity), this.dim)
      probeKeys.push(hrr.bind(entityVec, roleEntity))
    }

    const trust = minTrust ?? this.minTrust
    const facts = category
      ? this.store.listFacts(category, trust, CANDIDATE_FETCH_CAP)
      : this.store.listFacts(undefined, trust, CANDIDATE_FETCH_CAP)

    const scored: ScoredFact[] = []

    for (const fact of facts) {
      if (!fact.hrr_vector) continue

      const factVec = hrr.bytesToPhases(new Uint8Array(fact.hrr_vector))
      const entityScores: number[] = []

      for (const probeKey of probeKeys) {
        const residual = hrr.unbind(factVec, probeKey)
        const sim = hrr.similarity(residual, roleContent)
        entityScores.push(sim)
      }

      // AND semantics: min (not mean/max which would be OR)
      const minSim = Math.min(...entityScores)
      const score = ((minSim + 1.0) / 2.0) * fact.trust_score
      scored.push({ ...fact, hrr_vector: new Uint8Array(fact.hrr_vector), score })
    }

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
  }

  /**
   * Strategy 5: Contradiction detection (contradict).
   * Finds facts with high entity overlap + low content similarity.
   */
  async contradict(
    category?: string,
    threshold: number = 0.3,
    limit: number = 10,
    minTrust?: number
  ): Promise<ContradictionResult[]> {
    const trust = minTrust ?? this.minTrust
    const facts = this.store.listFacts(category, trust, CONTRADICTION_MAX_FACTS)

    // Pre-compute entity sets and vectors in one batch query
    const factsWithVectors = facts.filter(f => f.hrr_vector)
    const entityNamesByFact = this.store.getFactEntityNamesBatch(
      factsWithVectors.map(f => f.fact_id)
    )

    const factData = factsWithVectors.map(f => ({
      fact: f,
      entities: new Set(entityNamesByFact.get(f.fact_id) ?? []),
      vector: hrr.bytesToPhases(new Uint8Array(f.hrr_vector!)),
    }))

    const contradictions: ContradictionResult[] = []

    for (let i = 0; i < factData.length; i++) {
      for (let j = i + 1; j < factData.length; j++) {
        const a = factData[i]
        const b = factData[j]

        // Entity overlap (Jaccard)
        const intersection = new Set([...a.entities].filter(x => b.entities.has(x)))
        const union = new Set([...a.entities, ...b.entities])
        if (union.size === 0) continue

        const entityOverlap = intersection.size / union.size
        if (entityOverlap < 0.3) continue

        // Content similarity via HRR
        const contentSim = hrr.similarity(a.vector, b.vector)

        // High entity overlap + low content similarity = contradiction
        const contradictionScore = entityOverlap * (1.0 - (contentSim + 1.0) / 2.0)

        if (contradictionScore >= threshold) {
          contradictions.push({
            fact_a: { fact_id: a.fact.fact_id, content: a.fact.content },
            fact_b: { fact_id: b.fact.fact_id, content: b.fact.content },
            entity_overlap: entityOverlap,
            content_similarity: contentSim,
            contradiction_score: contradictionScore,
            shared_entities: [...intersection].sort(),
          })
        }
      }
    }

    contradictions.sort((a, b) => b.contradiction_score - a.contradiction_score)
    return contradictions.slice(0, limit)
  }

  // ─── Internal Helpers ────────────────────────────────────────

  /** Score facts by similarity to a reference vector */
  private async scoreFactsByVector(
    referenceVec: Float64Array,
    category: string,
    limit: number,
    trust: number = this.minTrust
  ): Promise<ScoredFact[]> {
    const facts = this.store.listFacts(category, trust, CANDIDATE_FETCH_CAP)
    const scored: ScoredFact[] = []

    for (const fact of facts) {
      if (!fact.hrr_vector) continue

      const factVec = hrr.bytesToPhases(new Uint8Array(fact.hrr_vector))
      const sim = hrr.similarity(referenceVec, factVec)
      const score = ((sim + 1.0) / 2.0) * fact.trust_score
      scored.push({ ...fact, hrr_vector: new Uint8Array(fact.hrr_vector), score })
    }

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
  }
}

// ─── Pure Helper Functions ────────────────────────────────────

/** Tokenize text into lowercase words */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.replace(/^[.,!?;:"'()[\]{}]+|[.,!?;:"'()[\]{}]+$/g, ''))
      .filter(t => t.length > 0)
  )
}

/** Jaccard similarity between two sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return intersection.size / union.size
}

/** Normalize FTS5 rank to [0, 1] (rank is negative, closer to 0 = better) */
function normalizeFtsRank(rank: number): number {
  // FTS5 rank is negative; closer to 0 is better
  // Map to [0, 1] using sigmoid-like transform
  return 1.0 / (1.0 + Math.abs(rank))
}

/** Exponential temporal decay */
function temporalDecay(updatedAt: string, halfLifeDays: number): number {
  const now = Date.now()
  const updated = new Date(updatedAt).getTime()
  const ageDays = (now - updated) / (1000 * 60 * 60 * 24)
  return Math.pow(0.5, ageDays / halfLifeDays)
}
