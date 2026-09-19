# Nila — Product Requirements Document

**Version:** 0.1  
**Status:** Draft  
**Product:** Nila  
**Category:** AI Voice Companion / Family Connection Platform

---

## 1. Product Vision

Nila is a multilingual AI voice companion that helps reduce the information gap between elderly parents and their children who live apart.

Nila regularly calls a parent at a configured time, has a natural conversation in the parent's preferred language, identifies information the parent actually shares, and provides the child with a concise summary and meaningful changes over time.

Nila does not replace family relationships.

Its purpose is to help children stay informed so they can have better, more meaningful human conversations with their parents.

### Core Product Principle

> **AI handles the continuity. Humans handle the connection.**

---

## 2. Problem Statement

Families increasingly live in different cities or countries.

Adult children may care deeply about their parents but cannot call every day or know what happens between conversations.

A short phone call may also fail to reveal small but meaningful details such as:

- how the parent has been feeling
- what they did during the day
- whether they have been sleeping normally
- whether something has been bothering them
- whether they feel socially connected
- things they casually mentioned that deserve a follow-up
- changes that have appeared across several conversations

This creates an information gap between parents and children.

Existing communication tools allow families to communicate, but they generally do not provide continuous, structured context about what happened between conversations.

Nila is designed to address this gap.

---

## 3. Target Users

### Primary Customer

Adult children who live away from their elderly parents.

Examples:

- Children living in another city
- Children working in another state
- Children living abroad
- Children who cannot regularly call their parents

### Primary Product User

The child.

The child:

- creates an account
- adds a parent
- configures call preferences
- receives summaries
- reviews changes
- follows up with the parent

### Call Participant

The parent.

The parent:

- receives the scheduled call
- speaks naturally with Nila
- chooses how much to share
- can end the conversation at any time

---

## 4. Core Value Proposition

### For children

> "I can't always call my parents, but I still want to know how they are doing."

Nila gives children useful context without requiring them to read lengthy transcripts.

### For parents

> "Someone regularly checks in and listens."

Nila provides a conversational check-in in the parent's preferred language while keeping the human family relationship central.

---

## 5. Core User Journey

The core product loop is:

**Schedule → Call → Understand → Summarize → Compare → Surface → Human connection**

### Step 1 — Child adds parent

The child provides:

- parent name
- phone number
- preferred language
- preferred call time
- call frequency
- relevant communication preferences

### Step 2 — Nila calls

At the configured time, Nila initiates a voice conversation with the parent.

The conversation should feel natural rather than like a medical questionnaire.

### Step 3 — Parent talks naturally

The parent can discuss:

- their day
- activities
- food
- sleep
- mood
- social interactions
- concerns
- things they are looking forward to
- anything else they voluntarily choose to discuss

Nila may ask relevant follow-up questions.

### Step 4 — Nila creates structured information

After the call, the system extracts only information supported by the conversation.

Examples:

- mood
- activities
- food
- sleep
- social interaction
- comfort
- concerns
- important mentions

If a topic was not discussed, it must not be presented as known.

### Step 5 — Child receives summary

The child receives a concise summary such as:

> **Today's check-in**
>
> Amma had a positive conversation today.
>
> - Visited her neighbour
> - Had lunch
> - Said she slept well
> - Mentioned mild knee discomfort
>
> **Follow-up**
>
> Knee discomfort was mentioned today. Consider checking in with Amma.

### Step 6 — Nila compares conversations

The system can compare recent structured observations.

Example:

> Knee discomfort mentioned on three recent calls.

Nila should surface the change without diagnosing the cause.

### Step 7 — Human follows up

The child can call the parent directly from the dashboard or use the information to have a more informed conversation.

---

## 6. MVP Features

### 6.1 Child Authentication

The child can:

- create an account
- log in
- log out
- manage their profile

---

### 6.2 Parent Profile

The child can create and manage a parent profile containing:

- name
- phone number
- preferred language
- timezone
- preferred call time
- call frequency
- consent/configuration information

---

### 6.3 Scheduled Voice Calls

Nila should initiate a voice call according to the configured schedule.

The implementation may use a telephony provider such as Twilio together with an OpenAI voice agent.

The exact provider integration must be validated during implementation.

---

### 6.4 Natural Voice Conversation

The AI should:

- introduce itself as an AI assistant
- speak in the parent's configured language
- maintain conversational context during the call
- ask natural follow-up questions
- avoid unnecessarily repeating questions
- allow the parent to end the conversation
- avoid pretending to be a family member

---

### 6.5 Call Summary

After each completed call, Nila generates a structured summary.

Possible categories:

- mood
- activities
- food
- sleep
- social interaction
- comfort
- concerns
- important mentions

The summary must be grounded in the actual conversation.

---

### 6.6 Wellbeing Timeline

The child can view recent call summaries and structured observations over time.

Example:

```text
Sep 17
Positive
Visited neighbour

Sep 18
Good
Mentioned poor sleep

Sep 19
Positive
Knee discomfort mentioned
```
