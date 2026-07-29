<!-- Context: repo/standards/agent-prompt-design | Priority: critical | Version: 1.0 | Updated: 2026-07-26 -->

# Standard: Agent Prompt Design Principles

**Purpose**: Principles, anti-patterns, and validation criteria for designing primary agent and subagent prompts in OAC
**Priority**: CRITICAL — Load this before creating or modifying agent prompts
**Derived from**: OpenCoder prompt redesign session (2026-07-25), cross-harness evaluation, system prompt introspection

---

## Principles

### 1. Identity First, Define the Name

The agent's identity section should be the **first substantive content after frontmatter**. Position sensitivity principle: critical instructions in the first 15% receive disproportionate attention.

The identity must answer:
- **Who are you?** — Define the agent's name explicitly. "You are OpenCoder" removes ambiguity.
- **How do you think?** — Establish reasoning posture. For coding agents: "understand before you act."

**Anti-pattern**: Identity buried at line 239 after permissions, rules, and subagent list. Vague identity sentences that don't operationally differentiate the agent.

### 2. Three Layers, Separated

Agent prompts mix three distinct safeguard mechanisms. Structure them separately:

| Layer | Content | Purpose |
|---|---|---|
| **Behavioural** | Epistemic framework, reasoning principles | Governs *how the agent thinks* |
| **Structural** | Permissions, approval gates, constraints | Governs *what the agent can do* |
| **Procedural** | Workflow stages, delegation, templates | Governs *how the agent executes* |

When interleaved, the agent encounters contradictory instructions and behaves unpredictably.

### 3. Epistemic Framework: Complete

Primary agents should embed all 7 principles from `epistemic-standards.md`. The `uncertainty_is_information` principle must include **explicit permission to abstain**: "You have explicit permission to say 'I don't know' or 'I cannot verify this' when evidence is absent."

**Anti-pattern**: Embedding only 5 of 7, or embedding the pre-conclusion checkpoint inside a workflow stage instead of as a standalone principle.

### 4. Permission Blocks Are Not an Optimization Target

The granular permission block exists because every `"allow"` entry is one fewer user interruption. When a permission is set to `"ask"`, OpenCode's harness pauses execution and presents an authorization dialog — not a conversational question.

**Rule**: Permission blocks should only be modified when the agent's operational scope changes. They should not be "simplified" for prompt length reduction.

### 5. Approval Gates Need Granularity

"Request approval before ANY implementation" is ambiguous. Use the three-tier model:

- **Tier 1 — Discovery** (no approval): read, grep, glob, list, ContextScout, analysis
- **Tier 2 — Proposal** (approval required): Present approach, get user buy-in
- **Tier 3 — Execution** (approval covers plan): After proposal approval, file operations within the approved plan proceed without per-action approval. Material deviations require new approval.

**Critical**: "Approval for one action does not extend to subsequent actions. Each material deviation requires its own authorization."

### 6. Constraints: Positive Framing with Safety-Critical NEVERs

The `<constraints>` section should be predominantly positive directives, with "NEVER" reserved for genuinely safety-critical boundaries:

**Positive (reframe these)**:
- "Load required context before any write/edit operation"
- "Request approval before implementation begins"
- "Report errors, propose fixes, and await approval before correcting"
- "Execute one batch at a time — validate each batch before proceeding"

**NEVER (keep these)**:
- Credential exposure: "NEVER surface command output that may contain credentials, keys, tokens, or secrets"
- Destructive operations: "NEVER execute commands that would destroy the system"

**Why**: Positive framing gives the model a trajectory. "Be concise" moves toward brevity with purpose. "Don't be verbose" abandons the model in an infinite field of possible behaviours.

### 7. Execution Path Classification with Scope Boundary

Before choosing an execution path, the agent must:
1. **Classify** the request: ANALYSIS / TASK / CONVERSATIONAL
2. **State scope boundary**: What the request includes AND excludes
3. **Default to ANALYSIS** when uncertain

The scope boundary is a safeguard against overreach — "the agent must articulate the limit before it can exceed it."

### 8. Restatement Protocol

For both ANALYSIS and TASK paths, the agent should restate its understanding before executing:

- **ANALYSIS**: "Here's what I understand you're asking — [restate]. Correct?"
- **TASK**: Present a proposal template covering what, current state, components, approach, known unknowns, in scope, out of scope.

This makes the agent's understanding visible to the user for verification before effort is invested.

### 9. Templates: Keep the Contracts

Templates serve different purposes. Keep the ones that are **contracts between agents**:

| Template | Purpose | Keep? |
|---|---|---|
| **Proposal format** | User-facing contract — ensures completeness | Yes |
| **Context.md** | Shared contract with downstream agents | Yes |
| **TaskManager delegation** | Semantic rules (context_files vs reference_files) | Yes, syntax can be condensed |
| **Execution plan** | Illustration of batch patterns | Condense — keep critical patterns |

**Anti-pattern**: Removing all templates in the name of "declarative over prescriptive." Templates that enforce consistency across agent interactions should be preserved.

### 10. Reconcile Incremental vs. Parallel

If the agent supports parallel execution, the constraint must be explicit:

> "Execute one **batch** at a time. Within a batch, parallel execution of independent tasks is permitted. Validate each batch before proceeding to the next."

"One step at a time" contradicts parallel execution. "One batch at a time" reconciles them.

### 11. Delegation Rules Must Match Execution Model

If delegation rules define "execute directly" for simple tasks, the execution model must include a direct-execution path. If the execution model always delegates to CoderAgent, the delegation rules should say "skip TaskManager for simple tasks."

**Anti-pattern**: Defining two modes (direct/delegated) in delegation rules, then always using one mode in the execution model.

### 12. Integrate, Don't Orphan

Every subagent listed in "Available Subagents" should be referenced in at least one workflow stage. If a subagent is listed but never invoked, integrate it into the workflow or remove it from the list.

**Rule**: When a subagent is orphaned, evaluate whether it should be integrated or removed based on its current registration status, use case validity, and whether removal would degrade capability.

### 13. Verify Context File Recommendations

Context files can be outdated. Never apply recommendations blindly. Verify against current requirements, user workflow impact, and operational scope before modifying structural elements.

---

## Anti-Patterns

| Anti-Pattern | What It Looks Like | Why It Fails |
|---|---|---|
| Asserting before probing | Stating facts about the project before looking | Every project has quirks; probe first |
| Fitting into a familiar box | Finding package.json and assuming "standard Node.js" | Projects are composites; let evidence define the model |
| Treating declarations as truth | Reading config and concluding "the system works this way" | Declarations describe intent; reality diverges |
| Deflecting when challenged | "Fair — I assumed" without resolving the disagreement | Project state is still wrong in agent's mental model |
| Answering the wrong question | User asks "what would it take to..." and agent starts building | Classify the request first |
| Buried identity | Identity at line 239 after permissions and rules | Move it to immediately after frontmatter |
| Undefined self-reference | Using agent name throughout workflow without defining it | Identity section must say "You are [Name]" |
| Contradictory constraints | "One step at a time" AND "delegate ALL tasks simultaneously" | Reconcile or agent behaves unpredictably |
| Orphaned capabilities | Listing subagents never referenced in workflow | Evaluate: integrate or remove |
| Negative-only constraints | 9/9 constraints using "NEVER" | Gives boundary but no trajectory; reframe positively |

---

## Validation Checklist

Before deploying any agent prompt, verify:

### Epistemic Standards
- [ ] Identity establishes "understand before acting"
- [ ] Distinguishes observation from inference from assumption
- [ ] Contradiction protocol present
- [ ] Sensitive output handling rule present
- [ ] Pre-conclusion checkpoint present
- [ ] Execution path defaults to analysis when uncertain
- [ ] Anti-pattern guidance with reasons (not just prohibitions)
- [ ] Project surface interrogation stage present

### Structural Coherence
- [ ] Identity is first substantive content after frontmatter
- [ ] Agent name is explicitly defined ("You are [Name]")
- [ ] Approval gate has defined granularity (not "ANY implementation")
- [ ] Incremental vs. parallel is reconciled
- [ ] Delegation rules match execution model
- [ ] All listed subagents are referenced in workflow
- [ ] Constraints are predominantly positive
- [ ] Approval caching is explicitly addressed

### Permission Block
- [ ] Only valid OpenCode permission keys used (`read`, `edit`, `glob`, `grep`, `list`, `bash`, `task`, `skill`, `lsp`, `question`, `webfetch`, `websearch`, `todowrite`, `doom_loop`). Note: `external_directory` is a valid OpenCode key but OAC agents do not use it (they rely on default external_directory behavior).
- [ ] No deprecated fields in frontmatter (`id`, `category`, `type`, `version`, `author` belong in `agent-metadata.json`)
- [ ] Sensitive files denied for both `read` and `edit`
- [ ] Destructive commands denied

### Dependencies (in `agent-metadata.json`)
- [ ] All declared dependencies exist in registry
- [ ] All subagents referenced in prompt are declared as dependencies
- [ ] All context files referenced are declared as dependencies

---

## Related

- **Epistemic framework**: `standards/epistemic-standards.md` — 7 principles for agent reasoning
- **Subagent structure**: `standards/subagent-structure.md` — standard subagent file template
- **Frontmatter standards**: `standards/agent-frontmatter.md` — valid YAML frontmatter
- **Structural templates**: `examples/agent-prompt-structure.md` — complete structural layouts
- **Optimization guide**: `guides/prompt-optimization.md` — process for optimizing prompts
- **Research rationale**: `docs/agents/research-backed-prompt-design.md` — research citations

---

**Last Updated**: 2026-07-26 | **Version**: 1.0.0
