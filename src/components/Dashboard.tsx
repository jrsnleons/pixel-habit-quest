import { ChevronLeft, ChevronRight, Flame, Heart, Minus, Moon, Plus, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, prettyDate, WEEKDAY_SHORT, weekday, type DateKey } from '../lib/dates'
import {
  computeProgress,
  habitsOn,
  MOOD_LABEL,
  plantStage,
  recentGood,
  resolve,
  RULES,
  setLog,
  setSleep,
  summarizeWeek,
  unlocked,
  type Mood,
} from '../lib/quest'
import type { Habit, LogStatus, QuestState } from '../lib/types'
import { PixelPet } from '../pet/PixelPet'
import { Room } from '../pet/Room'
import type { Face } from '../pet/sprites'
import { HabitIcon } from './icons'

type Reaction = 'heal' | 'hurt' | null

const LINES: Record<Mood, string[]> = {
  happy: ['Today feels sparkly!', 'We make a great team.', 'Look how sunny it is!'],
  tired: ['A little sleepy… one small win?', 'Let’s take it one habit at a time.', 'I believe in us.'],
  sad: ['It’s rainy in here… a good choice would help.', 'Every check-in helps me feel better.', 'We can turn this around together.'],
}

interface Props {
  state: QuestState
  today: DateKey
  update: (fn: (s: QuestState) => QuestState) => void
}

export function Dashboard({ state, today, update }: Props) {
  const [day, setDay] = useState(today)
  const [reaction, setReaction] = useState<Reaction>(null)
  const reactionTimer = useRef<number | undefined>(undefined)
  useEffect(() => setDay(today), [today])

  const progress = useMemo(() => computeProgress(state, today), [state, today])
  const good7 = useMemo(() => recentGood(state, today), [state, today])
  const week = useMemo(() => summarizeWeek(state, day, today), [state, day, today])
  const rewards = unlocked(progress.level)
  const habits = habitsOn(state, day)
  const recovery = state.mondayRecovery && weekday(day) === 1
  const line = LINES[progress.mood][new Date().getDate() % 3]

  const react = (r: Reaction) => {
    setReaction(r)
    window.clearTimeout(reactionTimer.current)
    reactionTimer.current = window.setTimeout(() => setReaction(null), 900)
  }

  const log = (h: Habit, status: LogStatus) => {
    const current = state.logs[day]?.[h.id]
    const next = current === status ? null : status
    update((s) => setLog(s, day, h.id, next))
    if (next === 'done' || next === 'kept') react('heal')
    else if (next) react('hurt')
  }

  const face: Face =
    reaction === 'heal' ? 'happy' : reaction === 'hurt' ? 'hurt' : progress.mood === 'happy' ? 'normal' : progress.mood
  const sleep = state.sleep[day]
  const canBack = day > state.startDate
  const canForward = day < today

  return (
    <div className="dash">
      <section className="card card--room">
        <Room mood={progress.mood} plant={plantStage(progress.hp, good7)} rewards={rewards}>
          <div className={`pet-wrap pet-wrap--${progress.mood} ${reaction ? `pet-wrap--${reaction}` : ''}`}>
            <div className="bubble">{reaction === 'heal' ? 'Yay! Thank you!' : reaction === 'hurt' ? 'Oof… we’ll get it next time.' : line}</div>
            <PixelPet look={state.pet} face={face} crown={rewards.has('crown')} className="pet" title={state.petName} />
            {reaction === 'heal' && (
              <div className="hearts" aria-hidden="true">
                <Heart size={14} /> <Heart size={10} /> <Heart size={12} />
              </div>
            )}
          </div>
        </Room>
      </section>

      <section className="card vitals" aria-label={`${state.petName}'s vitals`}>
        <div className="vitals__head">
          <h2>{state.petName.trim() || 'Your pet'}</h2>
          <span className={`mood mood--${progress.mood}`}>{MOOD_LABEL[progress.mood]}</span>
        </div>
        <Meter label="HP" value={progress.hp} max={RULES.maxHp} kind="hp" icon={<Heart size={14} />} />
        <Meter label={`Level ${progress.level}`} value={progress.xpIntoLevel} max={RULES.xpPerLevel} kind="xp" icon={<Star size={14} />} suffix=" XP" />
        <div className="vitals__stats">
          <Stat icon={<Flame size={16} />} label="Streak" value={`${progress.streak} day${progress.streak === 1 ? '' : 's'}`} />
          <Stat icon={<Sparkles size={16} />} label="Good choices" value={progress.totals.good} />
          <Stat icon={<Moon size={16} />} label="Sleep goals hit" value={progress.totals.sleepHits} />
        </div>
      </section>

      <section className="card habits-today">
        <div className="day-nav">
          <button className="icon-btn" disabled={!canBack} onClick={() => setDay(addDays(day, -1))} aria-label="Previous day">
            <ChevronLeft size={18} />
          </button>
          <div className="day-nav__label">
            <strong>{day === today ? 'Today' : day === addDays(today, -1) ? 'Yesterday' : prettyDate(day)}</strong>
            {day !== today && <span>{prettyDate(day)}</span>}
          </div>
          <button className="icon-btn" disabled={!canForward} onClick={() => setDay(addDays(day, 1))} aria-label="Next day">
            <ChevronRight size={18} />
          </button>
        </div>
        {recovery && <p className="hint">Recovery Monday: missed “do” habits won’t cost HP today.</p>}
        {habits.length === 0 ? (
          <p className="empty">Nothing scheduled{day === today ? ' today' : ''}. Enjoy the rest!</p>
        ) : (
          <ul className="habit-list">
            {habits.map((h) => {
              const r = resolve(state, h, day, today)
              const logged = state.logs[day]?.[h.id]
              return (
                <li key={h.id} className={`habit habit--${r}`}>
                  <span className="habit__icon">
                    <HabitIcon name={h.icon} />
                  </span>
                  <span className="habit__name">
                    {h.name}
                    <small>
                      {h.kind === 'avoid' ? 'Avoid' : 'Do'}
                      {!logged && r !== 'pending' && ` · counted as ${r}`}
                    </small>
                  </span>
                  <span className="habit__actions">
                    {h.kind === 'do' ? (
                      <>
                        <Toggle on={logged === 'done'} tone="good" onClick={() => log(h, 'done')}>Done</Toggle>
                        <Toggle on={logged === 'missed'} tone="bad" onClick={() => log(h, 'missed')}>Missed</Toggle>
                      </>
                    ) : (
                      <>
                        <Toggle on={logged === 'kept'} tone="good" onClick={() => log(h, 'kept')}>Kept</Toggle>
                        <Toggle on={logged === 'broken'} tone="bad" onClick={() => log(h, 'broken')}>Broke it</Toggle>
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <p className="hint hint--small">Tap a choice again to undo it.</p>
      </section>

      <section className="card sleep">
        <h3>
          <Moon size={16} /> Sleep {day === today ? 'last night' : `· ${prettyDate(day)}`}
        </h3>
        <SleepLogger
          hours={sleep?.hours ?? null}
          goal={sleep?.goal ?? state.sleepGoal}
          onChange={(h) => {
            update((s) => setSleep(s, day, h))
            if (h !== null) react(h >= (sleep?.goal ?? state.sleepGoal) ? 'heal' : 'hurt')
          }}
        />
        <p className="sleep__week">
          This week: <strong>{week.sleepHits}</strong> of {week.sleepLogged} logged nights hit the goal
        </p>
      </section>

      <section className="card week">
        <h3>This week</h3>
        <div className="week__grid">
          {week.days.map(({ day: d, result, future }) => {
            const ratio = result.scheduled ? result.good / result.scheduled : 0
            return (
              <button
                key={d}
                className={`week__day ${d === day ? 'is-on' : ''}`}
                disabled={future || d < state.startDate}
                onClick={() => setDay(d)}
                aria-label={`${prettyDate(d)}: ${result.good} of ${result.scheduled} done`}
              >
                <span className="week__bar">
                  <span style={{ height: `${Math.round(ratio * 100)}%` }} className={result.bad ? 'has-bad' : ''} />
                </span>
                <span className="week__label">{WEEKDAY_SHORT[weekday(d)][0]}</span>
                {result.sleepHit && <Moon size={10} className="week__moon" />}
              </button>
            )
          })}
        </div>
        <div className="week__counts">
          <span><b>{week.good}</b> good choices</span>
          <span><b>{week.bad}</b> missed or broken</span>
          <span><b>{week.sleepHits}</b> sleep goals</span>
        </div>
      </section>
    </div>
  )
}

function Meter({ label, value, max, kind, icon, suffix = '' }: { label: string; value: number; max: number; kind: string; icon: React.ReactNode; suffix?: string }) {
  return (
    <div className={`meter meter--${kind}`}>
      <div className="meter__label">
        {icon} {label}
        <span>
          {value}/{max}
          {suffix}
        </span>
      </div>
      <div className="meter__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className="meter__fill" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="stat">
      {icon}
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

function Toggle({ on, tone, onClick, children }: { on: boolean; tone: 'good' | 'bad'; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`toggle toggle--${tone} ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}

function SleepLogger({ hours, goal, onChange }: { hours: number | null; goal: number; onChange: (h: number | null) => void }) {
  const [draft, setDraft] = useState(hours ?? goal)
  useEffect(() => setDraft(hours ?? goal), [hours, goal])
  const met = hours !== null && hours >= goal
  return (
    <div className="sleep__logger">
      <div className="stepper">
        <button className="icon-btn" onClick={() => setDraft((d) => Math.max(0, d - 0.5))} aria-label="Less sleep">
          <Minus size={16} />
        </button>
        <span className="stepper__value">
          {draft}
          <small>h</small>
        </span>
        <button className="icon-btn" onClick={() => setDraft((d) => Math.min(16, d + 0.5))} aria-label="More sleep">
          <Plus size={16} />
        </button>
      </div>
      <div className="sleep__actions">
        <button className="btn btn--primary" onClick={() => onChange(draft)} disabled={hours === draft}>
          {hours === null ? 'Log sleep' : 'Update'}
        </button>
        {hours !== null && (
          <button className="btn btn--ghost" onClick={() => onChange(null)}>
            Clear
          </button>
        )}
      </div>
      <p className={`sleep__status ${hours === null ? '' : met ? 'is-good' : 'is-bad'}`}>
        Goal {goal}h ·{' '}
        {hours === null ? 'not logged yet' : met ? `Goal met! +${RULES.sleepHit.hp} HP` : `${goal - hours}h short`}
      </p>
    </div>
  )
}
