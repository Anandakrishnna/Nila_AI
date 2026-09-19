# Nila — Technical Requirements Document

**Version:** 0.1  
**Status:** Draft  
**Related Document:** PRD.md

---

# 1. Technology Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Edge Functions
- Supabase Realtime where required

## AI

- OpenAI Realtime API for real-time voice conversation
- OpenAI models for post-call summarization and structured information extraction

The exact OpenAI model and SDK/API interfaces must be verified against the current official documentation before implementation.

## Telephony

- Twilio Voice
- Twilio Media Streams or another currently supported Twilio/OpenAI realtime integration

The exact integration method must be validated during implementation.

## Deployment

- Vercel for the frontend
- Supabase for database/auth/backend services
- Cloud-hosted server/function for telephony integration where required

---

# 2. System Architecture

```text
                    NILA
                     │
          ┌──────────┴──────────┐
          │                     │
     Child Dashboard        Parent Phone
          │                     │
     React + Vite             Twilio
          │                     │
          ▼                     ▼
      Supabase          OpenAI Realtime
          │                     │
          │              Voice Conversation
          │                     │
          └──────────┬──────────┘
                     │
                     ▼
              Nila Backend
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     Calls       Observations   Summaries
        │            │            │
        └────────────┼────────────┘
                     ▼
                  Supabase
                     │
                     ▼
              Child Dashboard
```
