# Nila — Backend Schema

**Version:** 0.1  
**Status:** Draft  
**Database:** PostgreSQL via Supabase  
**Related Documents:** PRD.md, TRD.md, APP_FLOW.md

---

# 1. Backend Design Principle

The backend stores the factual state of the application.

The AI may interpret conversations, but it must not directly control database permissions or critical business rules.

Core relationship:

```text
Child
  │
  └── Parent
        │
        ├── Call Schedule
        │
        ├── Calls
        │     ├── Observations
        │     └── Summary
        │
        ├── Wellbeing Events
        │
        └── Alerts
```
