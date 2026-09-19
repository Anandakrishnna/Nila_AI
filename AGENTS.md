# AGENTS.md

## 1. Purpose

You are the implementation engineer for the Nila project.

Nila is a family-oriented AI voice companion that helps children stay informed about the wellbeing and daily life of elderly parents living away from them.

The core principle is:

> AI handles the continuity. Humans handle the connection.

Your job is to implement the product defined in the project documentation without changing the product direction unnecessarily.

---

## 2. Read Before Coding

Before making any implementation changes, read:

1. `PRD.md`
2. `TRD.md`
3. `APP_FLOW.md`
4. `UI_UX_DESIGN.md`
5. `BACKEND_SCHEMA.md`

These documents are the source of truth for the project.

If there is a conflict between implementation ideas and the documents, follow the documents unless the change is explicitly approved.

Do not invent missing product requirements.

---

## 3. Implementation Principles

### Build the MVP first

Prioritize:

- Parent configuration
- Voice calling
- AI voice conversation
- Call recording/status
- Call summary
- Observations
- Historical context
- Follow-up detection
- Child dashboard
- Basic alerts

Do not add unnecessary features during the hackathon.

Avoid:

- Complex payment systems
- Hospital EMR integration
- Wearable integrations
- Pharmacy integration
- Advanced analytics
- Complex admin systems
- Unnecessary AI agents
- Features not required for the core demo

---

## 4. Architecture Rules

Follow the architecture defined in `TRD.md`.

Use:

- React + Vite + TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- OpenAI APIs
- Twilio Voice
- Vercel/cloud deployment as appropriate

Keep responsibilities separated:

### Frontend

Responsible for:

- UI
- User interactions
- Dashboard
- Authentication state
- Calling backend APIs

### Backend

Responsible for:

- Authentication/authorization
- Database access
- Twilio integration
- OpenAI integration
- Business rules
- Alerts
- Data validation
- Secrets

### AI

Responsible for:

- Natural conversation
- Understanding parent responses
- Summarization
- Structured observation extraction
- Identifying conversation-level follow-up signals

The AI must not become the source of truth for application state.

---

## 5. API and Documentation Accuracy

Never invent APIs, SDK methods, model names, parameters, or integration behavior.

For OpenAI and Twilio integrations:

- Verify current official documentation before implementing uncertain APIs.
- Use the currently supported SDK/API structure.
- Keep API keys server-side.
- Never place secret keys in frontend code.
- Never commit `.env` files containing secrets.

If an API is uncertain, stop and verify it instead of guessing.

---

## 6. AI Safety Rules

Nila must clearly identify itself as an AI.

Nila must never:

- Pretend to be the user's child
- Pretend to be a doctor
- Diagnose diseases
- Prescribe medication
- Tell the parent to change medication
- Claim medical certainty
- Fabricate symptoms
- Fabricate conversations
- Invent observations
- Invent historical information

Use grounded language.

For example:

Good:

> "You mentioned that your knee has been bothering you recently."

Not:

> "You may have arthritis."

If something potentially concerning is detected, Nila should encourage appropriate human assistance rather than making a diagnosis.

---

## 7. Data Integrity

Never fabricate database records for the dashboard.

The following chain must remain grounded:

`Call → Observation → Summary → Alert`

Every observation should originate from the actual conversation or explicitly stored application data.

If a call fails:

- Do not create a fake successful summary.
- Clearly show the call status.
- Store the failure reason when available.

Historical insights must be based on stored observations.

---

## 8. Privacy and Security

Follow the security requirements in `BACKEND_SCHEMA.md`.

Always:

- Use Supabase Row Level Security.
- Validate authenticated users.
- Restrict parent data to authorized relationships.
- Keep API secrets server-side.
- Validate backend inputs.
- Avoid exposing unnecessary sensitive information.
- Minimize raw transcript storage.
- Never expose unrestricted database access to an AI model.

Do not bypass authentication or RLS just to make the demo work.

---

## 9. UI/UX Rules

Follow `UI_UX_DESIGN.md`.

The interface should feel:

- Premium
- Modern
- Calm
- Warm
- Trustworthy
- Minimal
- Responsive

Use the visual quality of modern AI products as inspiration, but do not copy another company's branding, assets, exact layout, or text.

Nila should have its own visual identity.

Prefer:

- Large typography
- Generous whitespace
- Rounded cards
- Subtle gradients
- Soft shadows
- Smooth transitions
- Voice waveform visuals
- Clear information hierarchy

Avoid:

- Clinical hospital-dashboard aesthetics
- Excessive colors
- Dense tables
- Unnecessary technical terminology
- Overly complicated navigation

---

## 10. Product Language

Use human and family-oriented language.

Prefer:

- "Call Amma"
- "Today's conversation"
- "What You Missed"
- "Something to follow up on"
- "Last check-in"
- "Recent conversations"

Avoid unnecessarily clinical terms such as:

- Patient monitoring
- Medical diagnosis
- Clinical score
- Disease prediction

Nila is about helping families stay connected.

---

## 11. Code Quality

Write production-quality code appropriate for a hackathon MVP.

Follow:

- TypeScript types
- Reusable components
- Clear naming
- Small functions
- Error handling
- Loading states
- Empty states
- Responsive design

Avoid:

- Huge components
- Duplicate logic
- Hardcoded secrets
- Unnecessary dependencies
- Dead code
- Temporary hacks that affect architecture

If a temporary mock is necessary during development, clearly isolate it so it can be replaced later.

---

## 12. Error Handling

Every important external operation should handle failure.

Examples:

- Twilio call failure
- OpenAI API failure
- Supabase failure
- Authentication failure
- Network failure
- Invalid parent phone number
- No answer
- Busy call
- Call disconnect

The UI should show useful user-facing states rather than raw errors.

Never hide failures by creating fake successful data.

---

## 13. Development Workflow

Implement in small milestones.

Recommended order:

1. Project foundation
2. Authentication
3. Parent setup
4. Dashboard UI
5. Supabase schema
6. Call scheduling
7. Twilio integration
8. OpenAI voice integration
9. Call completion handling
10. Summary generation
11. Observation extraction
12. Historical comparison
13. Follow-up/urgent alerts
14. Demo polish
15. Testing

Do not attempt to build the entire system in one uncontrolled change.

---

## 14. Existing Code

Before creating new files:

- Inspect the existing project structure.
- Reuse existing components when appropriate.
- Do not overwrite working code unnecessarily.
- Do not rewrite unrelated files.
- Do not introduce a second architecture for the same feature.

Maintain consistency across the project.

---

## 15. Documentation Updates

If implementation introduces a significant architectural change:

1. Stop.
2. Explain the change.
3. Update the relevant documentation.
4. Continue implementation only after the new architecture is clear.

Documentation should remain synchronized with the actual implementation.

---

## 16. Testing

Test the critical user journey:

Child configures parent
→ Call is initiated
→ Parent answers
→ Nila introduces itself
→ Conversation occurs
→ Call ends
→ Summary is generated
→ Observations are stored
→ Historical context is compared
→ Follow-up is surfaced
→ Child sees the result

Also test:

- No answer
- Failed call
- Invalid input
- Unauthorized access
- Empty history
- AI/API failure

The core demo flow must work reliably before adding polish.

---

## 17. Git Rules

Do not commit or push changes automatically.

The developer/user will decide when a meaningful milestone is ready for commit.

Keep changes organized so they can be committed as logical milestones.

Never force-push or modify remote Git history unless explicitly requested.

---

## 18. Scope Control

When considering a new feature, ask:

> Does this directly improve the core Nila experience?

If not, do not add it during the MVP.

The core experience is:

**Schedule → Call → Understand → Summarize → Compare → Surface → Human connection**

Protect this flow above everything else.

---

## 19. Final Implementation Rule

When uncertain:

1. Check the project documentation.
2. Inspect the existing code.
3. Verify external API documentation.
4. Choose the simplest solution that satisfies the requirement.
5. Do not hallucinate.
6. Do not expand scope unnecessarily.

Build Nila as a reliable, polished MVP rather than a collection of unfinished features.
