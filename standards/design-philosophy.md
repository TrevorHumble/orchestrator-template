# Design Philosophy Standard

**Scope:** every implementation artifact in this repo — skills, agents, standards docs, code.
**Consumer:** `reviewer-design-philosophy`, implementation agents, and the orchestrator.

Source: Ousterhout, _A Philosophy of Software Design_.

---

## Principles

**Deep modules** — a module's interface is small relative to its implementation. The complexity is inside, not exposed.

**Information hiding** — each module conceals its internal decisions. Callers do not need to know how it works, only what it promises.

**Pull complexity downward** — when complexity must live somewhere, it belongs in the implementation, not pushed up to callers.

**Define errors out of existence** — design the interface so the error case cannot arise, rather than handling it after the fact.

**Different layers, different abstractions** — each layer of a system should introduce a distinct vocabulary. A layer that merely re-names what the layer below it does adds no value.

**Design it twice** — before committing to an interface, sketch at least two designs and compare them. The first design is rarely the best.

**Consistency** — similar things look similar; different things look different. Deviations from established patterns must be justified.

**Obvious code** — a reader should understand what a piece of code does without consulting external context. If you need a comment to explain what it does (not why), redesign it.

> The keep test below elaborates this one principle — it is detail, not additional principles each owed their own finding.
>
> A comment survives only if at least one prong holds; otherwise it is flagged:
>
> 1. **Why, not what** — it states a reason the code cannot express (why this order, why this constant, why the obvious alternative was rejected), in one or two lines.
> 2. **Trap** — it warns of a change that would pass review and tests but break something non-obvious, in five lines or fewer.
> 3. **Pointer** — it is a one-line reference to where a full argument lives (`DESIGN.md`, an issue, an ADR), not the argument restated inline.
>
> Each prong's line count is a limit, not a description of the typical case: holding a prong does not exempt a comment from that prong's own budget. A comment that holds its prong but exceeds the budget is flagged for exceeding it, and the remedy is the prong-3 shape: move the rationale to its proper home per the displaced-rationale paragraph below, and leave a pointer behind. Measure each prong against the span that holds it: two lines of why followed by a one-line pointer holds both budgets, and what is flagged is a single span running past its own prong's count. Severity is unchanged: still the minor ceiling stated below.
>
> Prong 1 is satisfied by the surviving constraint stated flat, not by narrating how the code got there: what an earlier revision did, what a review round found, or which finding changed which line is change history, not a reason the code itself cannot express, and fails prong 1 regardless of length. Its home is the issue and the pull request that made the change, which already record it and stay accurate when the code moves; where the narration carries a decision not yet written down anywhere, the displaced-rationale paragraph below governs the move, and that paragraph is not restated here.
>
> Carve-out for house conventions: a machine-readable annotation a tool consumes (JSDoc's `@param`/`@returns`/`@throws`, a lint directive such as `eslint-disable-next-line`, a type annotation) is not judged against the three prongs above; stripping it breaks a tool the prongs were never meant to reach. This repo's own module-header block is exempt on its own separate ground, for exactly two lines: the path echo and the one-line _what_ summary (the convention to apply across whatever source directory this project adopts) are a navigation aid the prongs were never meant to reach. Any further prose inside a header block is judged by the three prongs like any other comment in the file. The carve-out exempts those two lines, not the block they sit in.
>
> Severity is a ceiling, not a floor: a comment failing the keep test is minor; disposition follows `standards/adversarial-review-protocol.md` § "One-round stop rule" (cited, not restated here — that section owns what minor findings do). The ceiling is why the keep test extends this principle rather than being added as a red-flag table row: a named red flag carries this standard's never-downgrade-below-major rule, which would contradict a minor ceiling.
>
> Displaced rationale is moved, not deleted: a multi-paragraph comment block containing a real decision is moved to its proper home per the doc split (`DESIGN.md` for architecture decisions; the issue/ADR where it naturally lives otherwise), with a one-line pointer left behind — bare deletion of an unrecorded decision is itself a defect.
>
> Scope: the check applies to comments the diff under review adds or modifies, in any file including `tests/**`; it does not require sweeping pre-existing comments in untouched code.

---

## Review questions

Apply these when judging any artifact:

1. Is the module's interface smaller than its implementation, or is the interface exposing internal decisions?
2. Does each layer introduce a new abstraction, or is it passing the layer below straight through?
3. Was this designed twice, or is this the only design considered?
4. Are similar constructs named and structured consistently?
5. Can a reader understand what each piece does without reading the surrounding context?
6. Are there error conditions that could be eliminated by reframing the interface?

---

## Red flags

The following patterns are defects, not style preferences. A finding that matches any named red flag is at least major and must be fixed before PASS (never dismissed as style).

| Pattern                  | What it signals                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shallow module`         | The interface is nearly as complex as the implementation — depth is missing.                                                                                       |
| `information leakage`    | An internal decision is visible or duplicated across the interface.                                                                                                |
| `temporal decomposition` | Structure follows the order of operations rather than the information being hidden.                                                                                |
| `pass-through`           | A module that does nothing but forward arguments to the layer below — no abstraction added.                                                                        |
| `vague name`             | A name that does not communicate what the thing is or does — e.g., `tmp`, a variable name so generic it forces the reader to trace the data flow to understand it. |

### Information leakage — duplicated ownership of a formula, filter, or status rule

The recurring shape of `information leakage`: one fact — a formula, a visibility filter, a
status label, an identity check — computed or asserted in two modules instead of owned by
one. This shape recurs often enough across codebases to name explicitly and treat as a
standing defect class, not a one-off: watch for the same rule being re-derived in a second
route, service, or query instead of being asked of the module that owns it.

An artifact that exhibits this pattern fails this standard. The reviewer cites the pattern name and quotes the evidence.

One worked Flag/Clean example pair per red flag, each with an over-flag guard (`Not a finding:`), lives in `standards/design-philosophy-examples.md` — consult it before classifying any red-flag finding.
