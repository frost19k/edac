---
title: Instruction Knowledge Tiers
type: concept
tags: [instruction-design, agent-design, knowledge-categories, prompt-design, permission-calibration]
created: 2026-08-17
updated: 2026-08-17
sources: ["(removed) sources/prompt-tier-design.md"]
status: stable
---

# Instruction Knowledge Tiers

**Finding:** Every instruction in an agent prompt falls into one of three knowledge categories. The category determines whether the instruction is needed at all, how it should be framed, and how the corresponding frontmatter permission should be audited. Confusing the categories produces two failure modes: over-prescription (instructing the agent what it already knows) and under-prescription (failing to tell the agent what it cannot know). The three tiers are:

1. **Ambient-knowledge** — semantics the model knows from training. Don't instruct; don't audit against body prescription.
2. **Preference-guidance** — steering toward a preferred method when multiple valid approaches exist. Frame as default + override condition, not as modal obligation.
3. **Framework-facts** — EDAC-specific knowledge the model cannot know from training. Must be explicitly instructed; prescription-matching is the correct audit lens.

*Why this distinction matters:* a prompt that instructs an agent what `jq` does wastes tokens and signals the model should second-guess its own competence. A prompt that omits the existence of `ContextScout` leaves the agent unable to delegate. A prompt that says "you should prefer harness tools" accidentally creates an obligation the model won't override even when shell is the right call. The tiers name the boundary between these failures.

## The Three Tiers

### Tier 1 — Ambient-knowledge (training-obvious)

**What it is:** the semantics of ambient utilities — what `wc`, `jq`, `sort`, `diff`, `echo`, `curl` *do*. These are not separate named tools with schemas; they live inside a generic `bash` tool. Their existence and meaning is genuinely training knowledge. No provider describes `wc` in a tool schema, and a model that invokes `bash` composes these correctly without per-command instruction.

**How to treat it:** don't instruct. Don't audit bash allow-lists against body prescription for ambient utilities — `echo` or `jq` in a bash allow-list is not an over-grant even when no body instruction names them. The agent knows these exist and will reach for them as the situation demands.

**The triggering caveat:** whether the model reaches for `bash` *at all* is not training knowledge — it is a tool-triggering decision driven by the tool schema/description and steered by the system prompt. Anthropic: *"Claude responds directly for stable knowledge"* and tool use is *"steerable through your system prompt"* — a "light instruction" increases tool use, a "stronger form" pushes further. So the *semantics* are ambient (Tier 1), but the *triggering* is prompt-steered (which bleeds into Tier 2). EDAC's instinct not to audit ambient utilities against body prescription is correct for the semantics; it is slightly optimistic about the triggering. The mitigation is not to instruct "use jq" — it is to ensure the agent's workflow makes clear when bash is the right tool, which is a Tier 2 concern.

**Evidence:** Anthropic tool-use overview — *"Claude determines on each turn whether to call a tool or respond directly. It calls a tool when the request maps to that tool's described capability and the answer isn't already in context."* LangChain — *"The LLM doesn't introspect your Python code to understand what a tool does. It only reads what you tell it."* CrewAI — *"Never use training knowledge as a substitute for actual tool calls"* (the failure mode Tier 1 assumes away — agents sometimes answer from training instead of calling available tools). Full citations in the [removed source].

### Tier 2 — Preference-guidance (encouraged method)

**What it is:** steering toward a preferred approach when the agent could accomplish the task multiple ways. The agent is capable without this instruction — it would produce *a* valid result — but we steer toward *our* preferred method for stated reasons. Example: "prefer harness tools for file access, shell pipe tools for command output."

**How to frame it:** as a **default + explicit override condition** (`"Prefer X unless Y"`), not as a milder modal verb. The academic evidence is clear: modal verbs (`must`, `should`, `ought to`, `prefer`) are over-read as hard obligations by LLMs — *"over 90% of commonsense scenarios judged as obligations when modal expressions are present"* (Deontological Keyword Bias, ACL 2025). The model flattens "should" toward "must." To keep a preference *preferential*, state what may override it: `"Prefer X unless Y"` stays soft because the model is told the override condition. `"You should X"` does not, because the model reads it as an obligation and won't override it even when Y obtains.

**The tension with deontological framing:** the wiki's [Prompt Design Principles](prompt-design-principles.md) Principle 6 documents that deontological framing (*"your obligation is to X"*) outperforms preference framing by 27–64% in *closing compliance gaps*. That finding is correct for Tier 3 (framework-facts, where compliance is mandatory) but in tension with Tier 2 (where the preference must stay overridable). The resolution: **deontological framing for Tier 3, "Prefer X unless Y" for Tier 2.** The wiki previously presented deontological framing as uniformly preferable; it never recognised that *preference that stays soft* is the harder problem. The DKB finding explains why: the same linguistic device used to signal softness (`should`, `prefer`) is the device the model over-reads as obligation.

**The gradient is model-generation-dependent:** Anthropic warns that the same "MUST use tool" phrasing that fixed undertriggering in older models now causes overtriggering in newer ones. A Tier-2 preference written today may behave like a Tier-3 mandate in a later model. Preference framing must be re-tuned per model generation — this is not a one-time calibration.

**Evidence:** OpenAI Model Spec defines a "Guideline" authority level — *"Instructions that can be implicitly overridden ... guidelines can be overridden implicitly (e.g., from contextual cues, background knowledge, or user history)."* This is a native first-class "preference" tier: a default that bends to context. Anthropic documents the gradient: *"light instruction" → "stronger form"* → `tool_choice` (mechanism, not language) for the hard end. Full citations in the [removed source].

### Tier 3 — Framework-facts (must be explicitly instructed)

**What it is:** EDAC-specific knowledge the model cannot know from training. `ContextScout` exists as a delegable subagent. `ExternalScout` is available via the `task` tool. The task-management CLI lives at a specific path. The three-tier approval gate protocol. These are framework facts — not preferences, not ambient utilities. The agent has no way to discover them unless the body tells it.

**How to treat it:** must be explicitly instructed in the body. Prescription-matching IS the correct audit lens here: the body must authorize the delegation, and the frontmatter must allow it. A `task:` allow for `CodeReviewer` is an over-grant if the body never delegates to CodeReviewer — the agent cannot "just know" it should delegate there. A `task:` allow for `ContextScout` is required if the body prescribes ContextScout delegation — the agent cannot discover ContextScout from training.

**How to frame it:** deontological framing is correct here. *"Your obligation is to load context before writing"* is appropriate because compliance is mandatory, not preferential. This is the finding Principle 6 documents (27–64% improvement from deontological framing) — and it applies to Tier 3, not Tier 2.

**The relationship to schema injection:** [Prompt Design Principles](prompt-design-principles.md) Principle 14 draws the *inverse* boundary — don't restate what the harness schema already injects (tool names, descriptions, parameters, the `task` subagent taxonomy). Framework-facts are what the schema does *not* inject: workflow conventions, delegation rules, CLI paths, approval-gate protocols. The two principles are complementary: Principle 14 says "don't restate the schema"; Tier 3 says "do state what the schema doesn't."

## Permission-Calibration Implications

The distinction governs not only body prescription but also how frontmatter permissions should be audited:

- **Tier 1 (ambient-knowledge):** bash allow-list entries for ambient utilities (`echo`, `wc`, `jq`, `sort`, `diff`) should NOT be audited against body prescription. These are part of the bash capability; the agent knows they exist and will reach for them as the situation demands. An `echo` entry in a bash allow-list is not an over-grant even when no body instruction names `echo`. See [Permission Model](../harness/permission-model.md) §c "Bash Allow-List Conventions".

- **Tier 2 (preference-guidance):** permission entries that enable a preferred method (e.g., allowing `grep` in bash for pipe filtering while preferring the `grep` tool for file search) are capability-appropriate. The body's preference framing ("prefer harness tools for file access, shell pipe tools for command output") steers usage; the permission enables the capability. Don't narrow the permission to match the preference — the preference is overridable by design.

- **Tier 3 (framework-facts):** `task:` allows MUST match body-authorized delegations. A `task:` allow for a subagent the body never delegates to is an over-grant — the agent cannot discover the subagent from training, so the body's silence is authoritative. This is the one place where prescription-matching is the correct audit lens. See [Permission Model](../harness/permission-model.md) §e "Task Permission Patterns".

## Related

- [Prompt Design Principles](prompt-design-principles.md) — Principle 6 (deontological framing, corrected for the Tier 2/Tier 3 tension), Principle 14 (don't restate injected schema, corrected for the ambient-knowledge case).
- [Tool Awareness Tiers](tool-awareness-tiers.md) — the tool-awareness specialisation of this distinction: how body text handles globally-provisioned tools (MCPs, plugins) on the integration-depth axis (Minimal vs Comprehensive).
- [Permission Model](../harness/permission-model.md) — §c "Bash Allow-List Conventions" (Tier 1 permission calibration), §e "Task Permission Patterns" (Tier 3 permission calibration).
- [Anti-Fabrication Mechanisms](anti-fabrication.md) — the deontological-framing finding (27–64%) that underpins Tier 3 framing, and the DKB finding that underpins the Tier 2 caution against modal verbs.
