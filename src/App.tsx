import type { Session } from '@supabase/supabase-js'
import { Cloud, CloudOff, Gift, House, ListChecks, Settings } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { HabitsPage } from './components/Habits'
import { PetCreator } from './components/PetCreator'
import { RewardsPage } from './components/Rewards'
import { SettingsPage } from './components/Settings'
import { todayKey } from './lib/dates'
import { defaultState, normalizeState } from './lib/defaults'
import { accountStore, clearGuest, guestStore, readGuest, type QuestStore, type Saved } from './lib/storage'
import { supabase } from './lib/supabase'
import { useQuest, useToday } from './lib/useQuest'

const GUEST_FLAG = 'pixel-habit-quest:mode'

type Who = { kind: 'loading' } | { kind: 'signed-out' } | { kind: 'guest' } | { kind: 'account'; session: Session }

function readFlag(): string | null {
  try {
    return localStorage.getItem(GUEST_FLAG)
  } catch {
    return null
  }
}

function writeFlag(v: string | null) {
  try {
    if (v) localStorage.setItem(GUEST_FLAG, v)
    else localStorage.removeItem(GUEST_FLAG)
  } catch {
    /* storage unavailable */
  }
}

export default function App() {
  const [who, setWho] = useState<Who>({ kind: 'loading' })
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setWho(readFlag() === 'guest' ? { kind: 'guest' } : { kind: 'signed-out' })
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setWho({ kind: 'account', session: data.session })
      else setWho(readFlag() === 'guest' ? { kind: 'guest' } : { kind: 'signed-out' })
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        writeFlag(null)
        setUpgrading(false)
        // Keep the same object while the user is unchanged so the quest doesn't reload on token refresh.
        setWho((w) => (w.kind === 'account' && w.session.user.id === session.user.id ? w : { kind: 'account', session }))
      } else {
        setWho(readFlag() === 'guest' ? { kind: 'guest' } : { kind: 'signed-out' })
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (who.kind === 'loading') return <Splash text="Waking up your companion…" />
  if (who.kind === 'signed-out' || upgrading) {
    return (
      <AuthScreen
        upgrading={upgrading}
        onCancel={() => setUpgrading(false)}
        onGuest={() => {
          writeFlag('guest')
          setWho({ kind: 'guest' })
        }}
      />
    )
  }

  const userId = who.kind === 'account' ? who.session.user.id : null
  return (
    <QuestLoader
      key={userId ?? 'guest'}
      userId={userId}
      email={who.kind === 'account' ? (who.session.user.email ?? null) : null}
      onSignOut={async () => {
        writeFlag(null)
        await supabase?.auth.signOut()
        setWho({ kind: 'signed-out' })
      }}
      onCreateAccount={() => setUpgrading(true)}
    />
  )
}

interface LoaderProps {
  userId: string | null
  email: string | null
  onSignOut: () => void
  onCreateAccount: () => void
}

function QuestLoader({ userId, email, onSignOut, onCreateAccount }: LoaderProps) {
  const store = useMemo<QuestStore>(() => (userId ? accountStore(userId) : guestStore), [userId])
  const [saved, setSaved] = useState<Saved | null | 'new'>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setError(null)
    ;(async () => {
      const existing = await store.load()
      if (existing) return existing
      // Signing up after playing as a guest carries the guest quest over.
      const guest = userId ? readGuest() : null
      if (guest) {
        const created = await store.create(normalizeState(guest.state, todayKey()))
        clearGuest()
        return created
      }
      return 'new' as const
    })()
      .then((s) => live && setSaved(s === 'new' ? 'new' : { state: normalizeState(s.state, todayKey()), revision: s.revision }))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : 'Could not load your quest.'))
    return () => {
      live = false
    }
  }, [store, userId, attempt])

  if (error)
    return (
      <Splash text={error}>
        <button className="btn btn--primary" onClick={() => setAttempt((a) => a + 1)}>
          Try again
        </button>
      </Splash>
    )
  if (saved === null) return <Splash text="Loading your quest…" />
  if (saved === 'new') return <Onboarding onStart={async (s) => setSaved(await store.create(s))} />
  return <Main store={store} saved={saved} account={{ email, guest: !userId }} onSignOut={onSignOut} onCreateAccount={onCreateAccount} />
}

function Onboarding({ onStart }: { onStart: (s: ReturnType<typeof defaultState>) => Promise<void> }) {
  const [state, setState] = useState(() => defaultState(todayKey()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="onboarding">
      <div className="card">
        <h1>Meet your companion</h1>
        <p>Your pet feels better every time you keep a habit. Make them yours:</p>
        <PetCreator look={state.pet} name={state.petName} onChange={(pet, petName) => setState((s) => ({ ...s, pet, petName }))} />
        <p className="hint hint--small">
          We’ll start you with three example habits (water, an evening walk, and no late-night scrolling). You can change them anytime.
        </p>
        {error && <p className="notice notice--bad">{error}</p>}
        <button
          className="btn btn--primary btn--wide"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onStart({ ...state, petName: state.petName.trim() || 'Mochi' })
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not start your quest.')
              setBusy(false)
            }
          }}
        >
          {busy ? 'Setting up…' : 'Start my quest'}
        </button>
      </div>
    </div>
  )
}

type Tab = 'today' | 'habits' | 'rewards' | 'settings'

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'today', label: 'Today', icon: House },
  { id: 'habits', label: 'Habits', icon: ListChecks },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function Main({ store, saved, account, onSignOut, onCreateAccount }: { store: QuestStore; saved: Saved } & Omit<LoaderProps, 'userId' | 'email'> & { account: { email: string | null; guest: boolean } }) {
  const quest = useQuest(store, saved)
  const today = useToday()
  const [tab, setTab] = useState<Tab>('today')

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          Pixel Habit Quest
        </div>
        <nav className="tabs tabs--top" aria-label="Main">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'is-on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
        <SaveBadge status={quest.status} guest={account.guest} onRetry={quest.retry} />
      </header>

      {quest.notice && (
        <div className="notice notice--info banner" role="status">
          {quest.notice}
          <button className="link-btn" onClick={quest.clearNotice}>
            OK
          </button>
        </div>
      )}

      <main className="content">
        {tab === 'today' && <Dashboard state={quest.state} today={today} update={quest.update} />}
        {tab === 'habits' && <HabitsPage state={quest.state} today={today} update={quest.update} />}
        {tab === 'rewards' && <RewardsPage state={quest.state} today={today} />}
        {tab === 'settings' && (
          <SettingsPage state={quest.state} update={quest.update} account={account} onSignOut={onSignOut} onCreateAccount={onCreateAccount} />
        )}
      </main>

      <nav className="tabs tabs--bottom" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'is-on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <t.icon size={20} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function SaveBadge({ status, guest, onRetry }: { status: string; guest: boolean; onRetry: () => void }) {
  if (status === 'error')
    return (
      <button className="save save--error" onClick={onRetry}>
        <CloudOff size={14} /> Not saved · Retry
      </button>
    )
  return (
    <span className={`save save--${status}`} title={guest ? 'Saved in this browser' : 'Synced to your account'}>
      <Cloud size={14} /> {status === 'saving' ? 'Saving…' : guest ? 'Guest' : 'Saved'}
    </span>
  )
}

function Splash({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="splash">
      <p>{text}</p>
      {children}
    </div>
  )
}
