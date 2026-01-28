---
created: 2026-01-28T19:30:00
title: Plan MS Project upload strategy (manual/automatic, full/incremental)
area: features
files: []
---

## Problem

Need to design how MS Project files will be uploaded and synced into ABcon:
- Manual vs automatic upload
- Full refresh vs incremental updates (only changes)
- Implications of each approach
- Conflict resolution if data exists in both places

Key decisions needed:
1. Is MS Project the master or shared ownership with ABcon?
2. Do users add data in ABcon that must be preserved?
3. How often does project data change?
4. What happens to deleted tasks?

## Solution

TBD - Need to:
1. Review current ABcon database schema requirements
2. Decide on MVP approach (likely manual + full refresh)
3. Plan Phase 2 enhancements (incremental sync)
4. Document unique identifier strategy (MS Project Task UID)
5. Design conflict resolution rules

See orchestrator conversation (2026-01-28) for detailed options analysis.
