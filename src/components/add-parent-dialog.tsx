import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createParent } from '@/lib/parents'

interface AddParentDialogProps {
  onClose: () => void
  onCreated: () => void
}

const relationships = ['Mother', 'Father', 'Grandmother', 'Grandfather', 'Spouse', 'Other']
const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Other']

const selectClassName = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm transition-colors focus:border-[#6078b5] focus:outline-none focus:ring-4 focus:ring-[#e9edf7]'

export function AddParentDialog({ onClose, onCreated }: AddParentDialogProps) {
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [relationship, setRelationship] = useState('Mother')
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const normalizedPhone = phoneNumber.replace(/[\s()-]/g, '')
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setErrorMessage('Enter a phone number with country code, for example +919876543210.')
      return
    }

    setIsSaving(true)
    try {
      await createParent({ fullName, phoneNumber: normalizedPhone, relationship, preferredLanguage, timezone })
      onCreated()
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not save this parent. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/20 p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="add-parent-title">
      <div className="flex w-full max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.12)] sm:max-h-[calc(100dvh-4rem)]">
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-100 px-6 py-5 sm:px-7 sm:py-6"><div><p className="text-sm font-medium text-[#5268a5]">Parent setup</p><h2 id="add-parent-title" className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Add someone you care about</h2><p className="mt-2 text-sm leading-6 text-slate-500">Set up the details Nila will use to keep their space organized.</p></div><button type="button" aria-label="Close add parent dialog" className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}><X className="size-5" /></button></header>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-7">
            <div className="space-y-5">
              <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Parent&apos;s name</span><Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Lakshmi Iyer" autoComplete="name" required /></label>
              <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Phone number</span><Input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" required /><span className="mt-1.5 block text-xs text-slate-400">Include the country code.</span></label>
              <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Relationship</span><select value={relationship} onChange={(event) => setRelationship(event.target.value)} className={selectClassName}>{relationships.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Preferred language</span><select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className={selectClassName}>{languages.map((item) => <option key={item}>{item}</option>)}</select></label></div>
              <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Timezone</span><Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Kolkata" required /></label>
              {errorMessage && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800" role="alert">{errorMessage}</p>}
            </div>
          </div>
          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:justify-end sm:px-7"><Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Add Parent'}</Button></footer>
        </form>
      </div>
    </div>
  )
}
