import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PixelPet } from '../pet/PixelPet'

type Mode = 'signin' | 'signup' | 'link'

interface Props {
  onGuest: () => void
  /** Shown when a guest is upgrading; their progress will be carried over. */
  upgrading?: boolean
  onCancel?: () => void
}

const redirectTo = () => window.location.origin + import.meta.env.BASE_URL

export function AuthScreen({ onGuest, upgrading, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>(upgrading ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } })
        if (error) throw error
        if (!data.session) setMessage({ tone: 'good', text: 'Almost there! Check your inbox and tap the link to confirm your email.' })
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })
        if (error) throw error
        setMessage({ tone: 'good', text: 'Check your inbox for a sign-in link.' })
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setMessage({ tone: 'bad', text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card card">
        <PixelPet look={{ species: 'cat', color: 'lavender', accessory: 'bow' }} face="normal" className="auth__pet bob" />
        <h1>Pixel Habit Quest</h1>
        <p className="auth__tag">Build good habits and keep your pixel pet happy.</p>
        {upgrading && <p className="hint">Your guest progress will move into your new account.</p>}

        {!supabase ? (
          <p className="hint">Accounts aren’t set up in this build yet, but you can still play as a guest.</p>
        ) : (
          <>
            <div className="segmented" role="tablist">
              <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-on' : ''} onClick={() => setMode('signin')}>
                Sign in
              </button>
              <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-on' : ''} onClick={() => setMode('signup')}>
                Create account
              </button>
            </div>
            <form onSubmit={submit} className="auth__form">
              <label className="field">
                <span>Email</span>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              {mode !== 'link' && (
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <button className="btn btn--primary btn--wide" disabled={busy}>
                {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Email me a link'}
              </button>
              {message && <p className={`notice notice--${message.tone}`}>{message.text}</p>}
              <button type="button" className="link-btn" onClick={() => setMode(mode === 'link' ? 'signin' : 'link')}>
                {mode === 'link' ? 'Use a password instead' : 'Email me a sign-in link instead'}
              </button>
            </form>
          </>
        )}

        <div className="auth__divider">
          <span>or</span>
        </div>
        {upgrading ? (
          <button className="btn btn--ghost btn--wide" onClick={onCancel}>
            Keep playing as a guest
          </button>
        ) : (
          <button className="btn btn--ghost btn--wide" onClick={onGuest}>
            Try it without an account
          </button>
        )}
      </div>
    </div>
  )
}
