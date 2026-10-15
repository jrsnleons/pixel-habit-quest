import { LogOut } from 'lucide-react'
import type { QuestState } from '../lib/types'
import { PetCreator } from './PetCreator'

interface Props {
  state: QuestState
  update: (fn: (s: QuestState) => QuestState) => void
  account: { email: string | null; guest: boolean }
  onSignOut: () => void
  onCreateAccount: () => void
}

export function SettingsPage({ state, update, account, onSignOut, onCreateAccount }: Props) {
  return (
    <div className="page">
      <h2>Quest settings</h2>

      <section className="card">
        <h3>Your companion</h3>
        <PetCreator
          look={state.pet}
          name={state.petName}
          onChange={(pet, name) => update((s) => ({ ...s, pet, petName: name.slice(0, 24) }))}
        />
      </section>

      <section className="card settings">
        <h3>Rules</h3>
        <label className="field field--row">
          <span>
            Sleep goal
            <small>Changes apply to new sleep logs; past nights keep their goal.</small>
          </span>
          <select value={state.sleepGoal} onChange={(e) => update((s) => ({ ...s, sleepGoal: Number(e.target.value) }))}>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
        </label>
        <label className="field field--row">
          <span>
            Monday recovery
            <small>Missed “do” habits on Mondays don’t cost HP.</small>
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={state.mondayRecovery}
            onChange={(e) => update((s) => ({ ...s, mondayRecovery: e.target.checked }))}
          />
        </label>
      </section>

      <section className="card settings">
        <h3>Account</h3>
        {account.guest ? (
          <>
            <p>You’re playing as a guest, so progress is saved in this browser only.</p>
            <button className="btn btn--primary" onClick={onCreateAccount}>
              Create an account to sync
            </button>
          </>
        ) : (
          <>
            <p>
              Signed in as <b>{account.email}</b>. Your quest syncs across devices.
            </p>
            <button className="btn btn--ghost" onClick={onSignOut}>
              <LogOut size={16} /> Sign out
            </button>
          </>
        )}
      </section>
    </div>
  )
}
