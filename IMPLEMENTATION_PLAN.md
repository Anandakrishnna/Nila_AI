# IMPLEMENTATION_PLAN.md

## 1. Goal

Build the Nila MVP as a polished, working end-to-end product.

The primary demo flow is:

Child signs up
→ Adds parent
→ Configures language and call time
→ Starts a call
→ Nila calls the parent
→ Parent talks with Nila
→ Call ends
→ Conversation is summarized
→ Observations are extracted
→ Previous observations are compared
→ Follow-up is generated when appropriate
→ Child sees the result on the dashboard

---

# 2. Phase 1 — Project Foundation

### Tasks

- Initialize React + Vite + TypeScript
- Configure Tailwind CSS
- Configure shadcn/ui
- Configure routing
- Create base application layout
- Create reusable UI components
- Configure environment variables
- Connect Supabase
- Configure project structure

### Expected result

The application runs locally with:

- Landing page
- Authentication pages
- Dashboard shell
- Navigation
- Responsive layout

---

# 3. Phase 2 — Authentication

### Tasks

- Implement Supabase authentication
- Create sign-up
- Create login
- Create logout
- Handle authenticated routes
- Create user profile

### Expected result

A child can create an account and securely access the application.

---

# 4. Phase 3 — Parent Setup

### Tasks

Create parent setup flow:

- Parent name
- Phone number
- Relationship
- Preferred language
- Timezone
- Active/inactive state

Create:

- Parent database record
- Parent relationship
- Basic validation

### Expected result

The child can add a parent and see the parent in the dashboard.

---

# 5. Phase 4 — Dashboard

### Tasks

Build the main dashboard.

Include:

- Parent card
- Last check-in
- Latest summary
- What You Missed
- Follow-up card
- Recent calls
- Wellbeing timeline
- Call button

### Expected result

The dashboard communicates the value of Nila immediately.

The user should understand:

> What happened with my parent?

within a few seconds.

---

# 6. Phase 5 — Call System

### Tasks

Implement Twilio integration.

Flow:

Child clicks "Call Amma"
→ Backend validates parent
→ Backend initiates Twilio call
→ Parent receives phone call
→ Call status is stored

Handle:

- Initiating
- Ringing
- Connected
- In progress
- Completed
- No answer
- Busy
- Failed

### Expected result

A real phone call can be initiated from the application.

---

# 7. Phase 6 — AI Voice Conversation

### Tasks

Connect the voice call to the supported OpenAI realtime voice architecture.

Nila should:

- Introduce itself as an AI
- Speak naturally
- Use parent's preferred language where supported
- Ask simple conversational questions
- Listen to responses
- Ask relevant follow-up questions
- End the conversation naturally

Example:

Nila:

> "Hello Amma, I'm Nila, an AI companion. How are you feeling today?"

Parent:

> "I'm okay. I didn't sleep very well yesterday."

Nila:

> "I'm sorry to hear that. Was there anything that made it difficult to sleep?"

### Expected result

The parent can have a natural voice conversation with Nila.

---

# 8. Phase 7 — Call Completion

### Tasks

When the call ends:

- Update call status
- Store start/end time
- Calculate duration
- Process available conversation data
- Generate structured summary
- Extract observations
- Store results

### Expected result

Every successful call produces grounded structured information.

---

# 9. Phase 8 — AI Summary

### Tasks

Generate:

- Overall tone
- Short summary
- Highlights
- Follow-up items
- Structured observations

Example:

```text
Overall:
Doing okay

Highlights:
- Slept poorly last night
- Spoke with neighbour
- Plans to visit sister tomorrow

Follow-up:
Check whether sleep improves tomorrow.
```
