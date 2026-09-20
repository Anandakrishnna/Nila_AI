import type { TranscriptEntry } from '@/lib/checkins'

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'finishing' | 'ended' | 'error'

interface StartOptions {
  clientSecret: string
  onStatus: (status: VoiceStatus) => void
  onTranscript: (entry: TranscriptEntry) => void
  onError: (message: string) => void
}

export class RealtimeTransport {
  private peerConnection: RTCPeerConnection | null = null
  private stream: MediaStream | null = null
  private events: RTCDataChannel | null = null
  private audio = new Audio()
  private muted = false
  private finishClose: (() => void) | null = null
  private connectionTimeout: number | null = null
  private isClosing = false

  async start({ clientSecret, onStatus, onTranscript, onError }: StartOptions) {
    onStatus('connecting')
    this.peerConnection = new RTCPeerConnection()
    this.peerConnection.ontrack = (event) => {
      this.audio.srcObject = event.streams[0]
      void this.audio.play().catch(() => undefined)
    }
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected') this.clearConnectionTimeout()
      if (this.peerConnection?.connectionState === 'failed' && !this.isClosing) onError('The voice connection was interrupted. Please try again.')
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      throw new Error('Microphone access is needed to start a voice check-in.')
    }
    this.stream.getAudioTracks().forEach((track) => this.peerConnection?.addTrack(track, this.stream!))
    this.connectionTimeout = window.setTimeout(() => {
      if (this.peerConnection?.connectionState !== 'connected') onError('The voice connection took too long. Please try again.')
    }, 20_000)
    const events = this.peerConnection.createDataChannel('oai-events')
    this.events = events
    events.onmessage = ({ data }) => {
      let event: { type?: string; transcript?: string; delta?: string; error?: { message?: string } }
      try { event = JSON.parse(data) } catch { return }
      if (event.type === 'input_audio_buffer.speech_started') onStatus('listening')
      if (event.type === 'input_audio_buffer.speech_stopped') onStatus('thinking')
      if (event.type === 'response.done') onStatus('listening')
      if (event.type === 'session.closed') this.finishSession()
      if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) onTranscript({ role: 'user', text: event.transcript })
      if (event.type === 'response.output_audio_transcript.done' && event.transcript) onTranscript({ role: 'assistant', text: event.transcript })
      if (event.type === 'error' && !this.isClosing) onError(event.error?.message || 'Nila could not respond. Please try again.')
    }
    events.onopen = () => {
      events.send(JSON.stringify({ type: 'response.create', response: { instructions: 'Begin with a warm, concise greeting. Say: Hi, this is Nila, an AI assistant. I am here for a quick check-in. How are you feeling today?' } }))
      onStatus('listening')
    }
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    const response = await fetch('https://api.openai.com/v1/realtime/calls', { method: 'POST', headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' }, body: offer.sdp })
    if (!response.ok) throw new Error('Nila could not establish the voice connection. Please try again.')
    await this.peerConnection.setRemoteDescription({ type: 'answer', sdp: await response.text() })
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.stream?.getAudioTracks().forEach((track) => { track.enabled = !muted })
  }

  get isMuted() { return this.muted }

  async end() {
    if (!this.events || this.events.readyState !== 'open') {
      this.stop()
      return false
    }

    this.isClosing = true
    return new Promise<boolean>((resolve) => {
      const timeout = window.setTimeout(() => {
        this.finishClose = null
        this.cleanup()
        resolve(false)
      }, 15_000)
      this.finishClose = () => {
        window.clearTimeout(timeout)
        this.cleanup()
        resolve(true)
      }
      try {
        this.events?.send(JSON.stringify({ type: 'session.close' }))
      } catch {
        this.finishSession()
      }
    })
  }

  stop() {
    this.finishSession()
  }

  private finishSession() {
    const finish = this.finishClose
    this.finishClose = null
    if (finish) {
      finish()
      return
    }
    this.cleanup()
  }

  private cleanup() {
    this.clearConnectionTimeout()
    this.stopLocalMedia()
    this.events?.close()
    this.peerConnection?.close()
    this.stream = null
    this.events = null
    this.peerConnection = null
    this.isClosing = false
  }

  private stopLocalMedia() {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.audio.pause()
    this.audio.srcObject = null
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout !== null) {
      window.clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }
}
