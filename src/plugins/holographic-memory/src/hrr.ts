// Holographic Reduced Representations — Phase Vector Algebra
// Pure functions: same input = same output, no side effects
// Faithful port from Hermes Agent (NousResearch/hermes-agent)

const TWO_PI = 2 * Math.PI

/** Cache for deterministic atom vectors keyed by `${word}:${dim}` */
const atomCache = new Map<string, Float64Array>()

/**
 * Deterministic phase vector from SHA-256.
 * Each word produces the same vector across processes, machines, and runtimes.
 * Results are cached and cloned on return to keep callers' mutations safe.
 */
export async function encodeAtom(word: string, dim: number = 1024): Promise<Float64Array> {
  const key = `${word}:${dim}`
  const cached = atomCache.get(key)
  if (cached) {
    return cached.slice()
  }

  const valuesPerBlock = 16 // 32 bytes = 16 uint16 values per SHA-256 digest
  const blocksNeeded = Math.ceil(dim / valuesPerBlock)

  const phases = new Float64Array(dim)
  let offset = 0

  for (let i = 0; i < blocksNeeded; i++) {
    const data = new TextEncoder().encode(`${word}:${i}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)

    // Extract uint16 values from 32-byte digest (little-endian pairs)
    for (let j = 0; j < 16 && offset < dim; j++) {
      const byteIdx = j * 2
      const uint16Val = hashArray[byteIdx] | (hashArray[byteIdx + 1] << 8)
      phases[offset] = uint16Val * (TWO_PI / 65536.0)
      offset++
    }
  }

  atomCache.set(key, phases)
  return phases.slice()
}

/**
 * Bind two concepts via circular convolution (element-wise phase addition).
 * Result is dissimilar to both inputs (quasi-orthogonal).
 */
export function bind(a: Float64Array, b: Float64Array): Float64Array {
  const result = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) {
    result[i] = (a[i] + b[i]) % TWO_PI
  }
  return result
}

/**
 * Unbind: retrieve value bound to a key (element-wise phase subtraction).
 * Property: unbind(bind(a, b), a) ≈ b (up to superposition noise)
 */
export function unbind(memory: Float64Array, key: Float64Array): Float64Array {
  const result = new Float64Array(memory.length)
  for (let i = 0; i < memory.length; i++) {
    result[i] = ((memory[i] - key[i]) % TWO_PI + TWO_PI) % TWO_PI
  }
  return result
}

/**
 * Bundle: superpose multiple vectors via circular mean.
 * Result is similar to each input. Capacity: O(sqrt(dim)) items.
 */
export function bundle(vectors: Float64Array[], dim: number = 1024): Float64Array {
  if (vectors.length === 0) {
    return new Float64Array(dim)
  }
  if (vectors.length === 1) {
    return new Float64Array(vectors[0])
  }

  const itemDim = vectors[0].length
  let sumReal = new Float64Array(itemDim)
  let sumImag = new Float64Array(itemDim)

  for (const v of vectors) {
    for (let i = 0; i < itemDim; i++) {
      sumReal[i] += Math.cos(v[i])
      sumImag[i] += Math.sin(v[i])
    }
  }

  const result = new Float64Array(itemDim)
  for (let i = 0; i < itemDim; i++) {
    result[i] = ((Math.atan2(sumImag[i], sumReal[i]) % TWO_PI) + TWO_PI) % TWO_PI
  }

  return result
}

/**
 * Phase cosine similarity in [-1, 1].
 * 1.0 = identical, ~0.0 = random, -1.0 = anti-correlated.
 */
export function similarity(a: Float64Array, b: Float64Array): number {
  let sum = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    sum += Math.cos(a[i] - b[i])
  }
  return sum / len
}

/**
 * Encode text as bag-of-words phase vector.
 * Tokenize → encode each token → bundle.
 */
export async function encodeText(text: string, dim: number = 1024): Promise<Float64Array> {
  const tokens = text
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/^[.,!?;:"'()[\]{}]+|[.,!?;:"'()[\]{}]+$/g, ''))
    .filter(t => t.length > 0)

  if (tokens.length === 0) {
    return encodeAtom('__hrr_empty__', dim)
  }

  const vectors = await Promise.all(tokens.map(t => encodeAtom(t, dim)))
  return bundle(vectors, dim)
}

/**
 * Encode a fact with role binding for algebraic extraction.
 * Enables: unbind(fact, bind(entity, ROLE_ENTITY)) ≈ content_vector
 */
export async function encodeFact(
  content: string,
  entities: string[],
  dim: number = 1024
): Promise<Float64Array> {
  const roleContent = await encodeAtom('__hrr_role_content__', dim)
  const roleEntity = await encodeAtom('__hrr_role_entity__', dim)

  const contentVec = await encodeText(content, dim)
  const components: Float64Array[] = [
    bind(contentVec, roleContent),
  ]

  for (const entity of entities) {
    const entityVec = await encodeAtom(entity.toLowerCase(), dim)
    components.push(bind(entityVec, roleEntity))
  }

  return bundle(components, dim)
}

/**
 * Serialize phase vector to bytes for SQLite BLOB storage.
 */
export function phasesToBytes(phases: Float64Array): Uint8Array {
  return new Uint8Array(phases.buffer, phases.byteOffset, phases.byteLength)
}

/**
 * Deserialize bytes back to phase vector.
 */
export function bytesToPhases(data: Uint8Array): Float64Array {
  // Create a copy to ensure mutability and proper alignment
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  return new Float64Array(buffer)
}
