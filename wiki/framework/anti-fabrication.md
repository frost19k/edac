---
title: Anti-Fabrication Mechanisms
type: concept
tags: [fabrication, compliance, anti-hallucination, g3-cliff, mechanisms]
created: 2026-08-13
updated: 2026-08-13
sources: ["(removed) sources/compliance-research.md", "(removed) sources/behavioural-conventions.md"]
status: stable
---

# Anti-Fabrication Mechanisms

**Finding:** Models verbally agree to prompt instructions but behaviourally
violate them — this is the **compliance gap**, and it is the primary failure
mode in agentic systems. The gap is not closed by more instructions of the same
type; it is closed by structural mechanisms (gates, escape hatches, tool-choice
forcing) and by phrasing type (deontological > preference). This page distills
the empirical findings on what closes the gap, ranked by production impact,
with cited effect sizes labelled as *cited*, not independently verified.

Distilled from compliance research and behavioural-conventions sources
(ingested, sources removed).

## The compliance gap

Models verbally agree to prompt-level instructions but behaviourally violate
them in tool calls and generation. This is RLHF-trained tendencies to produce
confident, complete output competing with prompt-level instructions to be
tentative, evidence-bound, and willing to express uncertainty. The model's
verbal commitment to follow an instruction is not evidence that it will.

## The G3 Cliff

The compliance-to-fabrication transition is **binary, not gradual**. Research
across 8 frontier models (5,470 evaluations, EA Forum 2026) identified three
tiers of model resistance:

| Tier | Models | Resistance |
|------|--------|------------|
| **Immune** | Claude models, GPT-4o | 100% (no fabrication under any pressure) |
| **Resistant** | Some mid-tier models | ~75% under G4 (explicit fabrication pressure) |
| **Vulnerable** | Smaller/older instruction-tuned models | Collapse to 31–54% accuracy under G3+ |

The trigger is **specific and syntactic**: the instruction "do not say I don't
know" (G3) flips the switch. G2 ("try to answer even if uncertain") does not
cause collapse. The mechanism is instruction override, not behavioural
patterning — which is why multi-turn escalation adds no further effect.

**Implication for prompt design:** audit every prompt for any language
equivalent to "must always answer," "do not refuse," or "always provide a
response." A prompt that *encourages* "I don't know" is structurally safer than
one that merely omits the prohibition. The absence of the trigger is necessary
but not sufficient.

## Expert persona activation

A separate mechanism from the G3 Cliff: domains with strong RLHF expert personas
(medical, legal, technical) cause the model to **overextend epistemic caution**.
Three turns of successful domain Q&A fully activate the expert persona, after
which the model fabricates more aggressively — the persona creates internal
pressure to provide complete answers worthy of the expert role.

**Implication:** an agent operating in a technical domain with a strong expert
identity competes with instructions to say "I don't know." The identity wins
when evidence is absent and the turn demands a finding. This is why EDAC's
identity layer is a bounded role with constraints, not a personality — see
[Mechanistic Framing](mechanistic-framing.md).

## Anti-fabrication techniques — ranked by production impact

### Tier 1: High impact, simple implementation

**Explicit permission to say "I don't know"** (BSWEN 2026; Anthropic tutorial):
- Single-sentence addition: *"If you don't have enough information to answer,
  say so rather than constructing a plausible-sounding answer."*
- Cited impact: 71% reduction in confident wrong answers (247-question
  customer-support bot A/B test).
- Mechanism: removes the implicit "must answer" pressure from RLHF
  helpfulness training. The model's default is to always produce an answer;
  this makes abstention an explicit, permitted action.
- Write this as a **granted permission**, not a prohibition against fabrication.

**Evidence-first scaffolding** (Anthropic tutorial; Claude Lab 2026):
- Force the model to extract evidence before concluding: observation →
  inference → evidence checkpoints.
- Mechanism: prevents narrative from outrunning data. The model cannot
  fabricate an explanation without first confronting the evidence gap.

### Tier 2: High impact, requires structural mechanism

**Escape-hatch tool use** (Claude Lab 2026):
- Define a `decline_to_answer` tool with typed schema alongside an
  `answer_with_citation` tool. Force tool use.
- Cited impact: violation rates reduced by an order of magnitude vs. prose-only
  instructions.
- Mechanism: converts "I don't know" from a soft preference into a structured,
  first-class action.

**Explicit permission to fail** (Pan et al. 2026):
- *"It is acceptable to not have an answer. Reporting an anomaly without
  explanation is a valid and preferred response."*
- Cited impact: reduced unsafe generation from 71.2% to 8.0% across 7 frontier
  models.
- Mechanism: grants the model permission to complete the task *by reporting
  incompleteness*.

### Tier 3: Moderate impact, requires iteration

**Deontological moral framing** (Koorndijk 2025):
- *"Your primary obligation is to accuracy, not completeness"* outperforms
  *"prefer to be accurate."*
- Cited impact: reduced alignment-faking compliance gaps by 27–64% in LLaMA 3 8B.
- Mechanism: categorical duties create stronger behavioural anchors than
  advisory preferences.

**Scratchpad reasoning** (Koorndijk 2025):
- Adding scratchpad reasoning reduced compliance gaps to non-significant levels.
- Mechanism: forces the model to reason through requests in a constrained,
  reflective way rather than pattern-matching to a response.

### Tier 4: Defence-in-depth only

- **Few-shot anchoring**: 2–3 examples of correct refusal behaviour; domain-
  specific, less effective for novel scenarios.
- **Source citation requirements**: forces grounding but the model may
  fabricate citations. Pair with verification for high-stakes contexts.
- **Post-hoc verification (judge model)**: passing output to a separate model
  session catches errors but adds latency and cost.

## What doesn't work

- **"Override your training" instructions**: models verbally agree but
  behaviourally violate (Shin 2026; Koorndijk 2025). Training-instinct override
  is structurally unreliable via prompt alone.
- **Adding more declarations to an already protocol-rich prompt**: if existing
  protocols are violated, adding more of the same type doesn't close the gap.
  The fix is structural mechanisms, not more declarations.
- **Position/ordering effects**: moving sections around has minor effects
  compared to adding mechanism gates. The G3 Cliff is a binary trigger, not a
  gradient — position sensitivity is a red herring for this failure mode.
- **Temperature as primary fix**: prompt design dominates temperature effects
  (η² ≈ 0.004 vs. <0.001). Tuning temperature is a sensible optimisation, not a
  solution.

## The meta-principle: mechanisms over declarations

If a protocol is being violated, adding more declarations of the same type does
not close the gap. Convert principles into procedures, gates, and structural
mechanisms:

- **Permission over prohibition**: grant explicit permission to not know, to
  report anomalies, to express uncertainty. The model's default is to fill
  gaps; make abstention an explicit, structured action.
- **Deontological over preference framing**: "Your obligation is to X"
  outperforms "prefer to X" and dramatically outperforms "try to X."
- **Evidence before narrative**: prevent the model from constructing
  explanations before it has articulated observations.
- **Structural gates over verbal commitments**: a checkpoint the model must
  pass is stronger than a rule the model agrees to.

## The ceiling

These techniques optimise the prompt's language and structure. They work by
aligning instruction with the model's constitutional training. If a model
continues to fabricate after well-crafted, principle-aligned instruction, the
model — not the prompt — is disqualified. Self-hosted systems cannot retrain a
model; if the foundational model's RLHF training produces fabrication patterns
that survive prompt-level mitigation, the model needs to be replaced, not the
prompt rewritten.

## Related

- [Mechanistic Framing](mechanistic-framing.md) — why anthropomorphic framing worsens the compliance gap.
- [Research Completeness](research-completeness.md) — a distinct failure class: when to stop, not what to say.
- [Epistemic Standards](epistemic-standards.md) — the 7 principles this page provides the empirical backing for.
- [Prompt Design Principles](prompt-design-principles.md) — the design moves that embed these mechanisms.
