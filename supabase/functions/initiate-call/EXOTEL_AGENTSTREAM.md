# Exotel AgentStream — parked future option

This is an archived future-integration note. The active `initiate-call` function uses Twilio; this Exotel approach is not implemented or invoked.

If Exotel is reconsidered in a later milestone, use Exotel AgentStream's documented VoiceBot/bidirectional path:

```text
Parent phone
  → ExoPhone / Exotel
  → Exotel VoiceBot Applet or direct `streamurl` call setup
  → secure WebSocket endpoint controlled by Nila
  → server-side bridge to OpenAI Realtime
  → base64 PCM audio returned over the same Exotel WebSocket
```

Exotel opens the WebSocket after the call is answered. Its current documentation specifies raw PCM (linear16), mono, with 8 kHz by default and 16 kHz or 24 kHz supported. The VoiceBot Applet supports bidirectional `media`, `mark`, and `clear` events; a Stream Applet is receive-only.

Implement the WebSocket server, Exotel flow/applet configuration, authentication, OpenAI Realtime bridge, consent handling, and call-status processing in a later milestone only.

Source: https://developer.exotel.com/docs/agentstream/developer-guide
