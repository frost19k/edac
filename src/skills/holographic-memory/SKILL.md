---
name: holographic-memory
description: Advanced fact-structuring and retrieval-strategy guidance for holographic memory — load when writing durable facts or selecting retrieval actions
---

# Holographic Memory — Fact-Structuring & Retrieval Guidance

The baseline memory prompt gives the durability test and category list. This skill gives the *why* behind those rules: holographic memory binds facts as role–filler pairs in a vector space, and retrieval works only when facts are structured to be bound and recovered. Structure facts well and retrieval is precise; structure them poorly and they become unrecoverable noise.

## Write-Side Hygiene

Every fact you store is bound to its entities and category by HRR binding, then recovered later by unbinding. Four properties determine whether a fact is recoverable.

**Explicit, stable entity names.** HRR binds a fact to its entities; retrieval unbinds by entity. A fact with no nameable entity cannot be bound and cannot be retrieved by `probe` or `reason`. An entity named inconsistently across facts ("the auth service" vs "AuthService" vs "auth") defeats cleanup — the nearest-neighbour lookup that denoises unbinding needs a stable vocabulary to match against. Use one canonical name per entity and reuse it.

**Low fan-out per entity.** When many facts bind to a single generic entity, crosstalk interference grows with the bundle size and compositional retrieval (`reason`) degrades sharply — multi-hop joins through high-fan-out hubs fail at chance even when single-fact retrieval works. Prefer specific entities ("JWT refresh-token rotation") over generic hubs ("the backend") so facts don't all superpose around the same vector.

**Self-contained facts.** Retrieval returns individual facts in isolation, not the conversation that produced them. A fact that depends on surrounding context ("she decided to use that") is meaningless when surfaced alone. Write each fact to stand on its own: name the entity, state the decision or property, carry enough context to be acted on without the session it came from.

**Consistent categories and tags.** Categories are the roles in role–filler binding; tags sharpen Jaccard matching. Consistent categories let retrieval unbind the right role; drifting categories ("decisions" vs "project") split related facts across buckets and weaken recall.

### Good vs. poor fact structure

Good — named entity, project category, self-contained:
```
fact_store({ action: "add", content: "OpenCoder delegates all coding to CoderAgent by default; self-execution is the exception requiring justification", category: "project", tags: "opencoder,delegation,coderagent" })
```
This fact binds to stable entities (OpenCoder, CoderAgent), carries its category role, and stands alone — a future session retrieving it by `probe({ entity: "OpenCoder" })` gets a usable fact, not a fragment.

Poor — vague entity, no category, context-dependent:
```
fact_store({ action: "add", content: "decided to use that for the new thing", category: "general" })
```
This fact has no nameable entity, no category role, and cannot be understood without the session that produced it. It is unrecoverable by `probe` or `reason` and meaningless when retrieved alone.

## Retrieval-Selection Guide

Choose the action by query shape, not by habit.

| You have… | Use | Because |
|---|---|---|
| A keyword or phrase | `search` | Hybrid FTS5 + Jaccard + HRR; best for topical lookup |
| An entity name | `probe` | Algebraic recall of every fact bound to that entity |
| An entity and want its neighbourhood | `related` | Structural adjacency through shared context |
| Multiple entities that must all appear | `reason` | Compositional AND — a vector-space JOIN across entities |
| A suspicion of conflicting facts | `contradict` | High entity overlap + low content similarity surfaces contradictions |

`probe` is more precise than `search` for entity-specific queries because it unbinds by entity rather than matching keywords. `reason` is the only action that composes across entities, but it degrades under high fan-out (see Write-Side Hygiene) — when a `reason` query returns noise, the cause is usually write-side: too many facts bound to one of the entities.
