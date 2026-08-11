# goal-gate: a forcing hook (not a suggestion). Fires on PreToolUse for the
# AskUserQuestion tool and DENIES it, so the model cannot reflexively ask the
# user a question it should answer from the goals. The deny reason is fed back
# to the model. This is the enforcement layer for the "decide from the goals;
# don't punt" rule -- markdown is advisory, this is mechanical.
Write-Output '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"goal-gate (forced, not optional): you tried to ask the user a question. Do NOT. Follow standards/decision-heuristics.md, section Decide from the goals: derive the answer from the issue acceptance criteria, CLAUDE.md, docs/north-star.md, and the relevant standard first. If they settle it, or it is a pure tradeoff, or it asks permission for already-authorized work, DECIDE IT AND ACT -- do not ask. Surface to the owner only when all three conditions in that section hold -- and even then, raise it in prose, never via this tool. Re-derive from the goals now and continue."}}'
