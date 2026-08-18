import { test, expect } from 'bun:test'
import { Database } from 'bun:sqlite'

test('smoke: bun:sqlite + bun:test work', () => {
  const db = new Database(':memory:')
  db.run('CREATE TABLE t (id INTEGER)')
  db.run('INSERT INTO t VALUES (1)')
  const row = db.query('SELECT COUNT(*) as c FROM t').get() as { c: number }
  expect(row.c).toBe(1)
  db.close()
})
