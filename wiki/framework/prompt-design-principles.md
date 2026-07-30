---
title: Prompt Design Principles
type: concept
tags: [prompt-design, agent-design, anti-patterns, approval-gates, oac-standards]
created: 2026-07-29
updated: 2026-07-29
sources: ["(removed) oac-standards/agent-prompt-design.md"]
status: stable
---

# Prompt Design Principles

**Finding:** A well-formed agent prompt is an architecture, not a document. It anchors behaviour through a strong identity, separates three safeguard layers, embeds a complete epistemic framework (with explicit permission to abstain), treats the permission block as a structural gate rather than a length target, and governs execution through three-tier approval gates where approval never caches. These 13 principles, the anti-pattern catalogue, and the validation checklists below are the OAC-derived contract for any primary-agent or subagent prompt in EDAC.

## 1. Identity First, Define the Name

The identity section is the **first substantive content after frontmatter**. Position sensitivity: critical instructions in the first ~15% of the prompt receive disproportionate attention. Identity must answer two questions operationally:

- **Who are you?** — "You are OpenCoder" removes ambiguity; the name must be defined, not merely used.
- **How do you think?** — establish reasoning posture (e.g. "understand before you act").

*Anti-pattern:* identity buried at line 239 after permissions and rules; vague identity sentences that don't operationally differentiate the agent.

## 2. Three Layers, Separated

Agent prompts mix three distinct safeguard mechanisms. Structure them as separate sections; interleaving produces contradictory instructions and unpredictable behaviour.

| Layer | Content | Governs |
|---|---|---|
| **Behavioural** | Epistemic framework, reasoning principles | *how the agent thinks* |
| **Structural** | Permissions, approval gates, constraints | *what the agent can do* |
| **Procedural** | Workflow stages, delegation, templates | *how the agent executes* |

## 3. Epistemic Framework: Complete

Primary agents must embed all 7 principles from [../framework/epistemic-standards.md](../framework/epistemic-standards.md). The `uncertainty_is_information` principle must include **explicit permission to abstain**: *"You have explicit permission to say 'I don't know' or 'I cannot verify this' when evidence is absent."*

*Anti-pattern:* embedding only 5 of 7, or burying the pre-conclusion checkpoint inside a workflow stage instead of presenting it as a standalone principle.

## 4. Permission Blocks Are Not an Optimization Target

The granular permission block exists because every `"allow"` entry is one fewer user interruption. When a permission is `"ask"`, OpenCode's harness pauses execution and presents an authorization dialog — not a conversational question.

**Rule:** modify permission blocks only when the agent's operational scope changes. Do not "simplify" them for prompt-length reduction. (See the consolidated model in [../harness/permission-model.md](../harness/permission-model.md).)

## 5. Approval Gates Need Granularity

"Request approval before ANY implementation" is ambiguous. Use the three-tier model:

- **Tier 1 — Discovery** (no approval): read, grep, glob, list, ContextScout, analysis.
- **Tier 2 — Proposal** (approval required): present approach, get user buy-in.
- **Tier 3 — Execution** (approval covers plan): after proposal approval, file operations within the approved plan proceed without per-action approval. Material deviations require new approval.

**Critical:** *approval for one action does not extend to subsequent actions. Each material deviation requires its own authorization.* Approval does not cache across turns or to merely similar actions.

## 6. Constraints: Positive Framing with Safety-Critical NEVERs

The `<constraints>` section should be predominantly positive directives, reserving "NEVER" for genuinely safety-critical boundaries.

**Positive (reframe these):**
- "Load required context before any write/edit operation."
- "Request approval before implementation begins."
- "Report errors, propose fixes, and await approval before correcting."
- "Execute one batch at a time — validate each batch before proceeding."

**NEVER (keep these):**
- Credential exposure: "NEVER surface command output that may contain credentials, keys, tokens, or secrets."
- Destructive operations: "NEVER execute commands that would destroy the system."

*Why:* positive framing gives the model a trajectory; "be concise" moves toward brevity with purpose, whereas "don't be verbose" abandons it in an infinite field of possible behaviours.

## 7. Execution Path Classification with Scope Boundary

Before choosing an execution path, the agent must:
1. **Classify** the request: ANALYSIS / TASK / CONVERSATIONAL.
2. **State scope boundary**: what the request includes *and* excludes.
3. **Default to ANALYSIS** when uncertain.

The scope boundary is the safeguard against overreach — "the agent must articulate the limit before it can exceed it."

## 8. Restatement Protocol

For both ANALYSIS and TASK paths, the agent restates its understanding before executing, making comprehension visible for verification before effort is invested:

- **ANALYSIS:** "Here's what I understand you're asking — [restate]. Correct?"
- **TASK:** present a proposal template covering what, current state, components, approach, known unknowns, in scope, out of scope.

## 9. Templates: Keep the Contracts

Preserve templates that are **contracts between agents**:

| Template | Purpose | Keep? |
|---|---|---|
| Proposal format | User-facing contract — ensures completeness | Yes |
| Context.md | Shared contract with downstream agents | Yes |
| TaskManager delegation | Semantic rules (context_files vs reference_files) | Yes, syntax can be condensed |
| Execution plan | Illustration of batch patterns | Condense — keep critical patterns |

*Anti-pattern:* removing all templates in the name of "declarative over prescriptive." Templates enforcing cross-agent consistency should be preserved.

## 10. Reconcile Incremental vs. Parallel

If the agent supports parallel execution, the constraint must be explicit:

> "Execute one **batch** at a time. Within a batch, parallel execution of independent tasks is permitted. Validate each batch before proceeding to the next."

"One step at a time" contradicts parallel execution; "one batch at a time" reconciles them.

## 11. Delegation Rules Must Match Execution Model

If delegation rules define "execute directly" for simple tasks, the execution model must include a direct-execution path. If the execution model always delegates to CoderAgent, the delegation rules should say "skip TaskManager for simple tasks."

*Anti-pattern:* defining two modes (direct/delegated) in delegation rules, then always using one mode in the execution model.

## 12. Integrate, Don't Orphan

Every subagent listed in "Available Subagents" must be referenced in at least one workflow stage. If listed but never invoked, integrate it into the workflow or remove it. The structural template for subagents lives in [../harness/subagent-structure.md](../harness/subagent-structure.md).

**Rule:** when a subagent is orphaned, evaluate whether to integrate or remove based on its current registration status, use-case validity, and whether removal would degrade capability.

## 13. Verify Context File Recommendations

Context files can be outdated. Never apply recommendations blindly; verify against current requirements, user-workflow impact, and operational scope before modifying structural elements.

## Anti-Patterns Catalogue

| Anti-Pattern | What It Looks Like | Why It Fails |
|---|---|---|
| Asserting before probing | Stating facts about the project before looking | Every project has quirks; probe first |
| Fitting into a familiar box | Finding package.json and assuming "standard Node.js" | Projects are composites; let evidence define the model |
| Treating declarations as truth | Reading config and concluding "the system works this way" | Declarations describe intent; reality diverges |
| Deflecting when challenged | "Fair — I assumed" without resolving the disagreement | Project state stays wrong in the agent's model |
| Answering the wrong question | User asks "what would it take to…" and agent starts building | Classify the request first |
| Buried identity | Identity at line 239 after permissions and rules | Move it to immediately after frontmatter |
| Undefined self-reference | Using agent name throughout workflow without defining it | Identity section must say "You are [Name]" |
| Contradictory constraints | "One step at a time" AND "delegate ALL tasks simultaneously" | Reconcile or agent behaves unpredictably |
| Orphaned capabilities | Listing subagents never referenced in workflow | Evaluate: integrate or remove |
| Negative-only constraints | 9/9 constraints using "NEVER" | Gives boundary but no trajectory; reframe positively |

## Validation Checklist

**Epistemic standards** — the 8-point epistemic gate every agent must pass is owned by [Epistemic Standards](../framework/epistemic-standards.md) (its Validation Checklist); do not duplicate it here.

**Structural coherence**
- [ ] Identity is first substantive content after frontmatter
- [ ] Agent name explicitly defined ("You are [Name]")
- [ ] Approval gate has defined granularity (not "ANY implementation")
- [ ] Incremental vs. parallel is reconciled
- [ ] Delegation rules match execution model
- [ ] All listed subagents referenced in workflow
- [ ] Constraints predominantly positive
- [ ] Approval caching explicitly addressed

**Permission block**
- [ ] Only valid OpenCode permission keys used — see the verified 15-key set in [Permission Model](../harness/permission-model.md) (note: `external_directory` is valid but EDAC agents rely on its default behaviour, so it is not set explicitly).
- [ ] No OAC metadata fields in frontmatter (belong in `src/metadata.json` — see [Agent Frontmatter](../harness/agent-frontmatter.md) and [src/ Package Structure](./src-structure.md))
- [ ] Sensitive files denied under `read`, `edit`, and `grep` for all agents
- [ ] Destructive commands denied

**Example frontmatter (EDAC convention — `temperature: 0.2-0.3`):**

```yaml
---
name: ExampleAgent
description: One-line trigger description
mode: primary
temperature: 0.2-0.3
permission:
  bash: ask
  read: [src/**, !**/secrets/**]
  edit: [src/**, !**/secrets/**]
---
```

## Related

- [../framework/epistemic-standards.md](../framework/epistemic-standards.md) — the 7 reasoning principles that principle #3 embeds.
- [../harness/subagent-structure.md](../harness/subagent-structure.md) — standard subagent file template (principle #12).
- [../harness/agent-frontmatter.md](../harness/agent-frontmatter.md) — valid YAML frontmatter keys.
- [../harness/permission-model.md](../harness/permission-model.md) — consolidated permission allow/deny/ask model (principles #4, #5).
- [../framework/versioning.md](../framework/versioning.md) — agent prompt/permission changes trigger repo and per-agent component version bumps.
