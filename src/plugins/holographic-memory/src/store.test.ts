/**
 * Unit tests for HolographicStore persistence methods.
 *
 * All tests use isolated `:memory:` SQLite databases and never touch the user's
 * global config or on-disk store.
 */
import { test, expect, describe } from 'bun:test'
import { HolographicStore } from './store'
import type { HolographicConfig } from './types'

const TEST_CONFIG: HolographicConfig = {
  db_path: ':memory:',
  auto_extract: false,
  default_trust: 0.5,
  hrr_dim: 128,
  hrr_weight: 0.3,
  temporal_decay_half_life: 0,
  min_trust_threshold: 0.3,
}

function makeStore(): HolographicStore {
  return new HolographicStore({ ...TEST_CONFIG, db_path: ':memory:' })
}

/** Direct SQL runner for test setup (reaches the private DB handle). */
function rawRun(store: HolographicStore, sql: string, ...params: unknown[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(store as any).db.query(sql).run(...params)
}

describe('pruneStaleFacts', () => {
  test('deletes facts meeting all three stale criteria', async () => {
    // Arrange
    const store = makeStore()
    const added = await store.addFact('Stale untrusted fact', 'project')

    // Force the fact to be stale: low trust, zero retrievals, old updated_at
    rawRun(
      store,
      `UPDATE facts SET trust_score = 0.1, updated_at = datetime('now', '-91 days') WHERE fact_id = ?`,
      added.fact_id
    )

    // Act
    const deleted = store.pruneStaleFacts(TEST_CONFIG.min_trust_threshold)

    // Assert
    expect(deleted).toBe(1)
    expect(store.getFact(added.fact_id)).toBeNull()
    store.close()
  })

  test('preserves facts with high trust', async () => {
    // Arrange
    const store = makeStore()
    const added = await store.addFact('High trust old fact', 'project')

    // Old but still trusted (default 0.5 >= 0.3)
    rawRun(
      store,
      `UPDATE facts SET updated_at = datetime('now', '-91 days') WHERE fact_id = ?`,
      added.fact_id
    )

    // Act
    const deleted = store.pruneStaleFacts(TEST_CONFIG.min_trust_threshold)

    // Assert
    expect(deleted).toBe(0)
    expect(store.getFact(added.fact_id)).not.toBeNull()
    store.close()
  })

  test('preserves facts with non-zero retrieval count', async () => {
    // Arrange
    const store = makeStore()
    const added = await store.addFact('Retrieved old fact', 'project')

    // Low trust and old, but has been retrieved
    rawRun(
      store,
      `UPDATE facts SET trust_score = 0.1, updated_at = datetime('now', '-91 days') WHERE fact_id = ?`,
      added.fact_id
    )
    store.incrementRetrieval(added.fact_id)

    // Act
    const deleted = store.pruneStaleFacts(TEST_CONFIG.min_trust_threshold)

    // Assert
    expect(deleted).toBe(0)
    expect(store.getFact(added.fact_id)).not.toBeNull()
    store.close()
  })

  test('preserves recent facts', async () => {
    // Arrange
    const store = makeStore()
    const added = await store.addFact('Recent untrusted fact', 'project')

    // Low trust and never retrieved, but recently updated
    rawRun(store, `UPDATE facts SET trust_score = 0.1 WHERE fact_id = ?`, added.fact_id)

    // Act
    const deleted = store.pruneStaleFacts(TEST_CONFIG.min_trust_threshold)

    // Assert
    expect(deleted).toBe(0)
    expect(store.getFact(added.fact_id)).not.toBeNull()
    store.close()
  })
})
