---
title: Research Completeness — Tentative vs Definitive
type: concept
tags: [research, completeness, illusory-completion, satisfaction-of-search, premature-confidence]
created: 2026-08-13
updated: 2026-08-13
sources: ["(removed) sources/compliance-research.md"]
status: stable
---

# Research Completeness — Tentative vs Definitive

**Finding:** A distinct failure class from fabrication: the model treats a
single round of investigation as exhaustive, concluding with high confidence
without considering whether additional sources might alter its findings. The
agent wasn't wrong — it was incomplete. This page distills the empirical
findings on illusory completion, satisfaction of search, and premature
confidence, and the prompt-design mitigations that address them.

Distilled from compliance research §6 (ingested, source removed).

## The core distinction

Fabrication is about *what to say* — the model invents content to fill a gap.
Research-completeness failure is about *when to stop* — the model terminates
inquiry prematurely and presents provisional findings as settled. Both
produce confident wrong answers, but the mechanisms differ and so do the
mitigations. Anti-fabrication techniques (see [Anti-Fabrication
Mechanisms](anti-fabrication.md)) address the first; this page addresses the
second.

## Illusory completion

Ko et al. (2026) define **illusory completion** as an epistemic failure mode in
which an agent terminates and treats the task as solved despite unresolved or
violated constraints. Using the Epistemic Ledger framework, they identify four
systematic failure patterns in search agents:

- **Bare assertion**: claiming a constraint is satisfied without supporting
  evidence in the search results.
- **Overlooked refutation**: ignoring disconfirming evidence.
- **Stagnation**: performing redundant searches that yield no new information,
  then terminating without resolution.
- **Premature exit**: terminating while at least one constraint remains
  unverified and unaddressed.

Their LiveLedger intervention — exposing real-time constraint state during
execution — reduced underverified answers by up to 26.5% and improved accuracy
by up to 11.6%. The finding suggests illusory completion stems from a lack of
structured awareness of what has been verified and what remains unverified.

**Mitigation:** require the agent to articulate what it has checked, what it
has not checked, and whether unresolved questions remain before presenting
findings as settled.

## Satisfaction of search

The **satisfaction of search** (SOS) cognitive bias — first documented in
radiology by Tuddenham (1962) — describes how finding one result causes the
searcher to stop looking for additional results. Radiologists miss roughly
30% of secondary findings after detecting a primary abnormality (Berbaum et
al., 1990).

Applied to AI agents: the agent retrieves the first plausible result and
begins generating without cross-referencing against additional sources. The
convention the agent needed existed in a source it never consulted. RAG
architectures amplify this because similarity ranking structurally rewards the
first plausible match, and models degrade as the prompt fills with retrieved
content (Chroma Research, 2025) — even if five relevant chunks are retrieved,
the model may functionally process only the first two.

**Mitigation:** the bias operates at both the retrieval layer and the
reasoning layer. Prompt-level mitigation requires explicit instructions to
consider what else might exist beyond what was found, not merely to retrieve
more.

## Search decision boundary errors

Zhang et al. (2026) formally define the **search decision boundary** — the
threshold determining when accumulated information suffices to answer. They
identify two failure modes:

- **Over-search**: redundant searching despite sufficient information
  (cognitive offloading).
- **Under-search**: premature termination yielding incorrect answers.

Knowledge-boundary approaches (FLARE, Adaptive RAG) attempt to prioritise
internal knowledge through confidence estimation but "tend to be
over-confident on internal knowledge, leading to premature search
termination." Their causal intervention experiments show that search gains
diminish sharply after 3 rounds, and that decision boundary errors are
pervasive across state-of-the-art agents.

## Premature confidence

Premature confidence — the tendency to commit to an answer early and use
remaining tokens to rationalise it — strongly predicts flawed reasoning across
tasks and model scales (2026). On CSQA, prematurely confident chain-of-thought
traces contain 2.8× more logical flaws per sample than traces whose confidence
builds gradually. The pattern holds even when restricted to correctly answered
samples: premature confidence tracks when models arrive at the correct answer
with flawed reasoning. The most pervasive flaw is "wrong conclusion" — the
model asserts a final answer that contradicts its own preceding reasoning,
exactly the failure mode expected when the answer is fixed before reasoning
begins.

**Mitigation:** treat any single finding as potentially incomplete. Require
the agent to distinguish between "I found X" and "X is all there is to find."

## The mitigation principle

The common thread across all four failure modes: the model lacks structured
awareness of what it has verified versus what remains unresolved. The fix is
not "search more" — over-search is itself a documented failure. The fix is to
require the agent to state, before presenting findings as settled:

1. **What it verified** — which claims are backed by evidence, and from where.
2. **What it did not verify** — which claims remain untested or rely on a
   single source.
3. **What remains unresolved** — open questions that could alter the conclusion
   if answered differently.

This converts "I found X" (a single pass treated as exhaustive) into "I found
X, verified Y, did not check Z, and W remains open" (a structured account of
completeness). The LiveLedger finding (26.5% reduction in underverified
answers) supports this as a structural mechanism, not just a declaration.

Reserve the language of certainty for cases where the evidence is overwhelming
and the search space is demonstrably exhausted — which is rare.

## Related

- [Anti-Fabrication Mechanisms](anti-fabrication.md) — the complementary failure class (what to say, not when to stop).
- [Epistemic Standards](epistemic-standards.md) — Principle 7 (Pre-Conclusion Self-Examination) is the epistemic root of this discipline.
- [Prompt Design Principles](prompt-design-principles.md) — the design moves that embed the "state what was verified / not verified / unresolved" discipline into agent prompts.
- [Mechanistic Framing](mechanistic-framing.md) — why "as you'll recall" and history-aware framing compound the completeness problem.
