# Build Log

Reverse-chronological record of notable changes to the repo. Empty until the first issue merges.

## Entry conventions

Four entry types, appended in reverse-chronological order (newest at the top):

- `- YYYY-MM-DD - #N <summary> (<hash>).` — a committed issue; counted toward the periodic
  architectural-audit threshold (`agents/orchestrator.md` § "Review cadence — additive gates").
- `[AUDIT] <sha> — <summary>` — full-system architectural audit, run on every 5th counted entry;
  excluded from the count.
- `[HALT] #<n> — <reason>` — segment halted at the impasse stop condition
  (`standards/adversarial-review-protocol.md` § "One-round stop rule"); the work is not committed.
- A wave-completion note, appended once per wave boundary, closing with the literal line "owner may
  run /post-wave-review" (`agents/orchestrator.md` § "Wave boundary").

**The timed-run Live-log ledger uses a fifth, different shape.** During an autonomous timed run
(`agents/orchestrator.md` § "Autonomous timed run"), the orchestrator appends one line per
increment, not per merge:

```
[HH:MM] elapsed=Xm/budget=Ym | selector→{DO <item> | CASCADE | WRAP} | next=<item>
```

Worked example — clock reads `14:52`, the run started at `13:30` with a 180-minute budget, issue A is
ready and issue B is behind it: `[14:52] elapsed=82m/budget=180m | selector→DO A | next=B`. These
ledger lines are bookkeeping, not a reviewable artifact (`agents/orchestrator.md` § "Self-review is
automatic"), and are not counted toward the architectural-audit threshold above.

---

_(no entries yet)_
