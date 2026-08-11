# Edge-Case Checklist

**As the implementation agent (and the PR reviewer checking the same change), I need one canonical input-type → edge-case table both roles share, so that "handle the edges" resolves to the same concrete list on both sides of the handoff.**

An edge is **meaningful when the changed code branches on it** — when the edge input takes a different path than the representative input. Cover meaningful edges; list-checking the rest is noise.

**When NOT to invent an edge:** if the input domain has no nontrivial edge — a closed enum the code exhausts, or an input the acceptance criteria explicitly exclude — do not manufacture one. (Same rule as `agents/implementation-agent.md` build rule 6.)

| Input type        | Canonical edges                                                                                           | Example from this stack                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| string            | empty `""`; whitespace-only; very long; leading/trailing spaces; unexpected case; non-ASCII/emoji         | a user display name of `"  "` on signup                               |
| number            | `0`; negative; non-integer where integer expected; `NaN`; string-typed digits (`"5"`); max boundary       | a rate-limit threshold compare at exactly the threshold value         |
| array/collection  | empty `[]`; single element; duplicates; order dependence; very large                                      | a results list with zero entries on day one                           |
| object/record     | missing key; `null` value vs absent key; extra unexpected keys; wrong nested shape                        | a legacy record missing a column added by a later migration           |
| file path         | nonexistent; wrong separator (`/` vs `\`); relative vs absolute; spaces in path; traversal (`..`)         | an export path built from a user-supplied filename                    |
| binary/file input | zero-byte; wrong mimetype; mimetype/extension mismatch; oversize; same file twice                         | an unexpected file format posted to an upload endpoint                |
| date/time         | timezone shift across midnight; DST boundary; epoch 0 / far future; string date not ISO                   | a results list sorted by `created_at` when two records share a second |
| HTTP request      | missing/expired auth; malformed body; wrong content-type; repeated submit (double-tap); method mismatch   | a double-tap on a submit button posting the same request twice        |
| SQL/DB row        | no row found; more rows than expected; concurrent write between read and update; migrated NULL in old row | a user lookup by a one-time invite token already consumed             |

Usage:

- **Implementer** (`agents/implementation-agent.md`): pick the rows matching your changed function's inputs; handle each meaningful edge or state in the handoff why it cannot occur.
- **PR reviewer** (`agents/reviewer-pr.md`): pick one edge from the matching row that the diff does NOT obviously cover and trace it; a meaningful uncovered edge is a finding.
