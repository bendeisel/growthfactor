---
type: memory
org: system
status: live
subject: forget
created: 2026-09-03
updated: 2026-09-03
---

# Forget

Human-owned. Routine 6 reads this file first on every run, removes matching lines
from every memory file outright, and never files a match again.

Removal here is a real removal, not an archive move. An archived copy of a
forgotten fact is not forgotten.

One line per rule. A rule can name a fact, a subject, or a source:

```
- fact: <the exact line or enough of it to match>
- subject: <a topic never to file, e.g. anything about a specific person's pay>
- source: <a path or a source pattern never to read facts from>
```

## Rules
