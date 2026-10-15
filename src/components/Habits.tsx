import { Archive, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { WEEK_ORDER, WEEKDAY_SHORT, type DateKey } from '../lib/dates'
import { activeHabits, addHabit, archiveHabit, editHabit, type HabitDraft } from '../lib/quest'
import type { Habit, QuestState } from '../lib/types'
import { HABIT_ICONS, HabitIcon } from './icons'

interface Props {
  state: QuestState
  today: DateKey
  update: (fn: (s: QuestState) => QuestState) => void
}

const EMPTY: HabitDraft = { name: '', icon: 'star', kind: 'do', days: [0, 1, 2, 3, 4, 5, 6] }

function describeDays(days: number[]): string {
  if (days.length === 7) return 'Every day'
  if (days.length === 0) return 'No days'
  const sorted = WEEK_ORDER.filter((d) => days.includes(d))
  const weekdays = [1, 2, 3, 4, 5]
  if (sorted.length === 5 && weekdays.every((d) => days.includes(d))) return 'Weekdays'
  if (sorted.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
  // Collapse a consecutive run like Tue–Fri.
  const idx = sorted.map((d) => WEEK_ORDER.indexOf(d))
  if (sorted.length > 2 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)) {
    return `${WEEKDAY_SHORT[sorted[0]]}–${WEEKDAY_SHORT[sorted[sorted.length - 1]]}`
  }
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(', ')
}

export function HabitsPage({ state, today, update }: Props) {
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const habits = activeHabits(state, today)

  return (
    <div className="page">
      <div className="page__head">
        <h2>My habits</h2>
        <button className="btn btn--primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> New habit
        </button>
      </div>

      {editing && (
        <HabitForm
          initial={editing === 'new' ? EMPTY : editing}
          onCancel={() => setEditing(null)}
          onSave={(draft) => {
            update((s) => (editing === 'new' ? addHabit(s, draft, today) : editHabit(s, editing.id, draft, today)))
            setEditing(null)
          }}
        />
      )}

      {habits.length === 0 && !editing && <p className="empty card">No habits yet. Add one to start your quest!</p>}

      <ul className="habit-cards">
        {habits.map((h) => (
          <li key={h.id} className="card habit-card">
            <span className={`habit__icon habit__icon--${h.kind}`}>
              <HabitIcon name={h.icon} />
            </span>
            <span className="habit__name">
              {h.name}
              <small>
                {h.kind === 'avoid' ? 'Avoid' : 'Do'} · {describeDays(h.days)}
              </small>
            </span>
            <span className="habit__actions">
              <button className="icon-btn" aria-label={`Edit ${h.name}`} onClick={() => setEditing(h)}>
                <Pencil size={16} />
              </button>
              <button className="icon-btn" aria-label={`Archive ${h.name}`} onClick={() => setConfirming(h.id)}>
                <Archive size={16} />
              </button>
            </span>
            {confirming === h.id && (
              <div className="confirm" role="alertdialog" aria-label={`Archive ${h.name}?`}>
                <span>Archive this habit? Past check-ins stay in your history.</span>
                <button className="btn btn--ghost" onClick={() => setConfirming(null)}>
                  Keep it
                </button>
                <button
                  className="btn btn--danger"
                  onClick={() => {
                    update((s) => archiveHabit(s, h.id, today))
                    setConfirming(null)
                  }}
                >
                  Archive
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="hint hint--small">Editing a habit starts a fresh version today, so your past check-ins stay exactly as they were.</p>
    </div>
  )
}

function HabitForm({ initial, onSave, onCancel }: { initial: HabitDraft; onSave: (d: HabitDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<HabitDraft>({ name: initial.name, icon: initial.icon, kind: initial.kind, days: [...initial.days] })
  const valid = draft.name.trim().length > 0 && draft.days.length > 0
  const toggleDay = (d: number) =>
    setDraft((x) => ({ ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d] }))

  return (
    <form
      className="card habit-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSave({ ...draft, name: draft.name.trim() })
      }}
    >
      <div className="page__head">
        <h3>{initial.name ? 'Edit habit' : 'New habit'}</h3>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Cancel">
          <X size={18} />
        </button>
      </div>
      <label className="field">
        <span>Name</span>
        <input autoFocus value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Stretch for 5 minutes" />
      </label>

      <fieldset className="field">
        <legend>Type</legend>
        <div className="segmented">
          <button type="button" className={draft.kind === 'do' ? 'is-on' : ''} onClick={() => setDraft({ ...draft, kind: 'do' })}>
            Do <small>something good</small>
          </button>
          <button type="button" className={draft.kind === 'avoid' ? 'is-on' : ''} onClick={() => setDraft({ ...draft, kind: 'avoid' })}>
            Avoid <small>a habit to break</small>
          </button>
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Days</legend>
        <div className="chips">
          {WEEK_ORDER.map((d) => (
            <button type="button" key={d} className={`chip chip--day ${draft.days.includes(d) ? 'is-on' : ''}`} aria-pressed={draft.days.includes(d)} onClick={() => toggleDay(d)}>
              {WEEKDAY_SHORT[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Icon</legend>
        <div className="chips chips--icons">
          {Object.keys(HABIT_ICONS).map((name) => (
            <button type="button" key={name} className={`chip chip--icon ${draft.icon === name ? 'is-on' : ''}`} aria-label={name} aria-pressed={draft.icon === name} onClick={() => setDraft({ ...draft, icon: name })}>
              <HabitIcon name={name} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={!valid}>
          Save habit
        </button>
      </div>
    </form>
  )
}
