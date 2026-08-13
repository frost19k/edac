---
title: Mechanistic Framing — Agents Are Not Humans
type: concept
tags: [anthropomorphism, prompt-design, statelessness, agent-design, framing]
created: 2026-08-13
updated: 2026-08-13
sources: ["(removed) sources/anti-anthropomorphism-research.md"]
status: stable
---

# Mechanistic Framing — Agents Are Not Humans

**Finding:** LLMs are stateless text-processing functions, not humans. They
have no memory across sessions, no human time-scales, no learning arcs, no
emotional states. Writing agent instructions as if addressing a human colleague
is a structural defect — it degrades accuracy, wastes tokens, and creates
false assumptions the runtime agent cannot resolve. EDAC's agents are agents;
treat them as such.

This page distills the anti-anthropomorphism research into the framing
discipline every EDAC agent definition and context file must follow.

## The principle

An LLM agent has no persistent memory. Every session starts fresh; the model
reads only what is in its context window right now. It does not remember how
things used to be, what was renamed, or what an earlier session decided. It
has no schedule, no workload, no capacity for "effort." It processes tokens in
a forward pass and produces output conditioned on that window — nothing else
exists.

This is not a limitation to work around; it is the compute property the system
is built on. The API is stateless (vendor-documented: Anthropic, OpenAI,
Gemini). "Memory" is something the harness constructs by re-injecting context,
not something the model carries. Prompt caching is not memory — it caches
computed KV tensors for billing/latency, not state.

## Why anthropomorphic framing fails

**It degrades accuracy.** Persona/role framing is neutral-to-negative on
objective tasks and hypersensitive to irrelevant details — models drop ~30
percentage points from irrelevant persona details (Luz de Araujo, EMNLP 2025;
Zheng et al., EMNLP 2024). Persona hurts knowledge retrieval while helping only
narrow alignment/format tasks (Hu et al. 2026). The effect is largely random,
not a reliable lever.

**It creates false assumptions.** The failure mode that motivated this page:
adding changelog notes to agent definition files after editing them, not
realizing the runtime agent never saw the prior version. "Removed the OAC
boilerplate" is meaningless to an agent reading the file fresh — it describes
history the agent has no access to. This is the "prompt-debt spiral": implicit
assumptions that outlive their context.

**It wastes tokens.** Human-like output (pleasantries, "happy to help,"
emotional framing) is user-dispreferred and reducible without accuracy loss
(HUMT/DUMT, ACL 2025). In a context-constrained loop, social filler is pure
overhead.

## Anti-patterns

Each pattern writes instructions as if the model is a human colleague. Each has
a named correction.

| Pattern | Example | Why it fails | Correction |
|---|---|---|---|
| **Human time** | "2-week sprint", "weekly schedule", "by EOD" | Agents execute in turns, not labor-time | Scope by turn/step, not calendar |
| **Implicit continuity** | "as you'll recall", "previously", "as mentioned" | No memory; claims autobiographical persistence | State the fact; drop the reference to prior state |
| **History-aware content** | Changelog notes in files read fresh each session | Agent never saw the prior version | Describe present state only; history lives in external durable state (git log, `log.md`) |
| **Emotional labor** | "Sure!", "I'd be happy to", "great question!" | Social filler, no signal | State the finding; move on |
| **Sequential framing** | "first I'll… then I'll…", "one by one" | Independent work should parallelize | Declare the target state; let the system discover the trajectory |
| **Human capacity** | "this is complex", "will take ~15 min", "tricky" | Capacity theater instead of doing | Do the work; report the result |
| **Learning arcs** | "you'll develop skill in X" | No learning across sessions | Define the role's bounds; drop the developmental narrative |

Sources: 88plug/dehumanize (practitioner tool); arXiv 2604.07398 (voice model,
7 rules); Cheng et al. (ACL 2025, "Dehumanizing Machines"). The learning-arc
pattern has no dedicated peer-reviewed quantification — it is derived from the
statelessness principle and the "no implicit continuity" rule.

## Mechanistic framing — how to write instead

**State the model's nature where it anchors behaviour.** The single most
reusable framing, from the voice-model paper, corroborated by every
statelessness source:

> "This system is a stateless text-processing function. No persistent internal
> state. No identity. No preferences, intentions, or feelings. Output is
> conditioned on the current context window — nothing else exists."

**Describe present state only.** No history, no changelog, no "as previously
noted." Agent definition files and context files describe what the agent is and
does *now*. History belongs in external durable state (git log, `log.md`,
progress files) that the agent explicitly reads at runtime — never baked into
the always-loaded definition.

**Replace time-scales with completion conditions.** "Weekly implementation
schedule" → "execute these steps." "By EOD" → "before the next gate." The agent
operates in turns, not calendar days.

**Prefer declarative over social framing.** "Return only the JSON object" over
"I'd appreciate it if you could return the JSON." Imperative and declarative
instructions outperform social framing; they are also shorter.

**Separate durable rules from per-session facts.** The static zone (identity,
constraints, calibration) is identical across sessions. The dynamic zone
(session context, retrieved memory, per-turn state) changes. Never interleave
session-variable content into the static zone.

**Re-derive, don't remember.** Anthropic's "starting fresh" pattern: the agent
reconstructs state from filesystem artifacts each session rather than assuming
continuity. `pwd`, `progress.txt`, git log — the agent reads these explicitly,
never assumes it knows them.

## Application in EDAC

EDAC's agent definition files (`src/agents/`) and context files
(`src/context/`) are runtime artifacts consumed by agents under constraint.
They are not documents for human browsing.

- **Agent definition files** describe the role, its constraints, and its
  behaviour — present state only. No changelog, no "what changed," no
  biography. The agent reads this file fresh every session.
- **Context files** describe the current project state. Every path must
  resolve to a file that exists now; a reference to a renamed or removed
  resource is a defect, not a hint. (See [src/ Package Structure](src-structure.md)
  for the packaging-vs-runtime distinction.)
- **History lives outside the loaded files.** `wiki/log.md` is append-only and
  human-facing; git log is the authoritative history. The agent reads these
  explicitly when it needs history — it never assumes them.

## EDAC's identity-first position

EDAC uses identity-first framing ("You are OpenCoder," "You are OpenAgent").
The academic evidence says persona embellishment does not improve accuracy —
but EDAC's identity layer is not a "helpful assistant" personality. It is a
bounded role with explicit constraints: a specific domain, a defined
interaction style, and a capability surface. The identity anchors behaviour;
the constraints govern it. This is defensible under the research because the
identity is a role contract, not a personality, and because the accuracy
degradation findings concern *irrelevant* persona details and *embellishment*,
not bounded role definitions paired with structural constraints.

The tension between vendor persona practice and academic evidence is real
(vendors retain "You are a helpful assistant" for alignment, not accuracy).
EDAC resolves it by using identity as a constraint anchor, not a personality,
and by relying on explicit constraints and structural gates for compliance —
see [Anti-Fabrication Mechanisms](anti-fabrication.md).

## Related

- [Anti-Fabrication Mechanisms](anti-fabrication.md) — the compliance gap, G3 Cliff, and tiered anti-fabrication techniques.
- [Research Completeness](research-completeness.md) — distinguishing "I found X" from "X is all there is to find."
- [Epistemic Standards](epistemic-standards.md) — the 7 reasoning principles this framing supports.
- [Prompt Design Principles](prompt-design-principles.md) — the design moves that embed this framing.
- [src/ Package Structure](src-structure.md) — packaging vs. runtime location for context files.
