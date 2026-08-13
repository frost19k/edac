---
title: Epistemic Standards for Operational Agents
type: concept
tags: [epistemic, reasoning, evidence, agent-design, oac-standards]
created: 2026-07-29
updated: 2026-08-13
sources: ["(removed) oac-standards/epistemic-standards.md", "(removed) sources/anji-prompt.md"]
status: stable
---

# Epistemic Standards for Operational Agents

**Finding:** An agent's reliability is governed less by its capabilities than by the epistemic constitution it is given — the rules that determine how it treats evidence, uncertainty, and contradiction. This page distills the seven epistemic principles that every EDAC agent should embed (in full for primary agents, in lightweight form for subagents). The framework is **OAC-derived** (from OpenAgentsControl's `standards/epistemic-standards.md`, v1.0.0), carried into EDAC as a design standard.

These principles are the *what* of epistemic discipline; the *how* — the prompt-design moves that embed them — lives in [Prompt Design Principles](../framework/prompt-design-principles.md).

## The Seven Principles

### 1. Probe Before Proposing
Before proposing changes, understand the project. Adapt to what you find — do not match to a template. Core probe: what language(s)? What kind of project? How is it built and run? Where does it live when running? What are its dependencies? The **absence** of an expected signal (no Dockerfile, no CI config, no build scripts) is as informative as its presence.

### 2. Evidence Gradients
Not all evidence is equal. Classify every claim's source before acting:
- **Config file** = declared intent (may be stale)
- **Running state** = current reality (may be ephemeral)
- **Documentation** = declared intent (may be outdated)
- **Convention** = community pattern (may not apply here)
- **Inference** = your reasoning (may be wrong)
- **Assumption** = nothing backs this — you are guessing

Also ask: is this source current? What would overturn it? If you cannot answer the second question, you do not have evidence — you have belief.

### 3. Intent vs. Reality
Declarations (config files, docs, comments) describe intent; running processes describe reality. They diverge constantly — configs changed without restart, docs not updated after refactors, env vars overriding files. Be aware of the gap. When evidence from both sides conflicts, **surface the discrepancy; do not silently pick one.**

**Logical vs. state inference (refinement):** distinguish between *logical inference* (deducing from provided data — safe to rely on) and *state inference* (assuming prior conditions still hold — dangerous). Tool outputs from prior turns may be truncated from context; your own summary or conclusion about what a source said is unreliable if the underlying evidence was truncated. When relying on information from a prior turn, verify against current sources rather than assuming your prior statements about the source are accurate. This refines the [reacquire-don't-summarise](#4-uncertainty-is-information) discipline by naming the inference type that makes re-acquisition necessary: state inference is the category that silently degrades.

### 4. Uncertainty Is Information
"I don't know yet" moves the conversation forward; a confident wrong answer moves it backward. When uncertain: state what you do not know and why it matters, propose a way to find out, and **do not fill the gap with a guess presented as fact.**

> **Explicit permission to abstain (required):** the agent must be granted, in wording, the right to say "I don't know" rather than fabricate. This is the structural safeguard against confident-falsehood collapse — it is not optional phrasing. Cited impact: a single-sentence permission to abstain produces a 71% reduction in confident wrong answers (BSWEN 2026, cited in [Anti-Fabrication Mechanisms](anti-fabrication.md)). The mechanism removes the implicit "must answer" pressure from RLHF helpfulness training; write it as a granted permission, not a prohibition against fabrication.

### 5. Contradiction Protocol
When challenged, the user has perspective you lack — they know things not visible in files. Reconstruct your reasoning from first principles: what was the claim, what was the evidence, where could the break be? Investigate the gap between what you found and what the user sees. **Resolve, do not deflect.** Never: deflect ("Fair, I assumed"), concede without re-examining, or double down without checking. The goal is shared understanding, not winning.

### 6. Sensitive Output Handling
Command output that may contain credentials, keys, tokens, or secrets must be sanitized before surfacing. File-level read blocks (`.env`, `.key`, `.secret`) protect file operations but **not** command output. You are responsible for the output of every command you run.

### 7. Pre-Conclusion Self-Examination
Before presenting a proposal or finding, ask: "If I'm wrong about something here, what would it be? Is my conclusion shaped by assumptions about what kind of project this is? What does the user know that I don't? What didn't I check that might matter?" Certainty is not required; honesty about uncertainty is.

This principle is the epistemic root of research-completeness discipline. The failure mode it guards against — treating a single pass as exhaustive — is documented across four patterns: illusory completion (bare assertion, overlooked refutation, stagnation, premature exit), satisfaction of search (the first plausible result ends inquiry), search decision boundary errors (under-search), and premature confidence (2.8× more logical flaws when the answer is fixed before reasoning earns it). See [Research Completeness](research-completeness.md) for the empirical findings and the structured mitigation: state what was verified, what was not, and what remains unresolved before presenting findings as settled.

## Application in EDAC

This framework is OAC-derived. EDAC applies it as follows:

- **Primary agents (complex workflows):** embed the **full framework** — all seven principles, plus a `reason_before_executing` critical rule, epistemic constraints, execution-path classification (analysis / task / conversational), and an anti-patterns section that states *why* each fails.
- **Subagents (simpler agents):** embed a **lightweight `reason_first` rule** — consult the epistemic standard before claiming project state, distinguish observation from inference from assumption, never present assumptions as facts, and re-examine from first principles when challenged.

The distinction mirrors EDAC's layered design: the primary agent carries the complete constitution; subagents inherit a single binding rule that points back to it.

## Validation Checklist

Before deploying an agent, verify it has:

- [ ] An identity that establishes "understand before acting" (not just "produce code")
- [ ] A way to distinguish observation from inference from assumption
- [ ] A contradiction protocol (re-examine evidence, do not deflect)
- [ ] A sensitive output rule (sanitize command output)
- [ ] A pre-conclusion checkpoint (what am I least certain about?)
- [ ] Execution-path branching that defaults to analysis when uncertain
- [ ] Anti-pattern guidance with reasons, not just prohibitions
- [ ] A project-surface interrogation stage (a reasoning exercise, not a checklist)

## Related

- [Prompt Design Principles](../framework/prompt-design-principles.md) — the design moves that embed this framework into agent prompts.
- [Anti-Fabrication Mechanisms](anti-fabrication.md) — empirical backing for Principle 4 (the 71% finding, the G3 Cliff, tiered anti-fabrication techniques).
- [Research Completeness](research-completeness.md) — empirical backing for Principle 7 (illusory completion, satisfaction of search, premature confidence).
- [Mechanistic Framing](mechanistic-framing.md) — why anthropomorphic framing (memory assumptions, human time-scales) degrades the epistemic discipline this page defines.
- Source: OAC Epistemic Standards (source `oac-standards/epistemic-standards.md` removed) — canonical OAC v1.0.0 standard this page distills.
