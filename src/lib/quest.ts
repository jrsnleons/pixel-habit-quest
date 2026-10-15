import { addDays, daysBetween, weekday, weekDays, type DateKey } from './dates'
import type { Habit, LogStatus, QuestState } from './types'

export const RULES = {
  startHp: 75,
  minHp: 10,
  maxHp: 100,
  xpPerLevel: 100,
  good: { hp: 5, xp: 15 },
  bad: { hp: -8 },
  sleepHit: { hp: 8, xp: 20 },
  sleepShort: { hp: -3 },
}

export type Mood = 'happy' | 'tired' | 'sad'

export function moodFor(hp: number): Mood {
  if (hp >= 75) return 'happy'
  if (hp >= 45) return 'tired'
  return 'sad'
}

export const MOOD_LABEL: Record<Mood, string> = {
  happy: 'Happy',
  tired: 'A little tired',
  sad: 'Needs some love',
}

export function isScheduled(habit: Habit, day: DateKey): boolean {
  if (day < habit.createdOn) return false
  if (habit.archivedOn && day >= habit.archivedOn) return false
  return habit.days.includes(weekday(day))
}

export function habitsOn(state: QuestState, day: DateKey): Habit[] {
  return state.habits.filter((h) => isScheduled(h, day))
}

/** What a habit resolves to on a day: an explicit log, or the default once the day is over. */
export type Resolved = LogStatus | 'pending'

export function resolve(state: QuestState, habit: Habit, day: DateKey, today: DateKey): Resolved {
  const logged = state.logs[day]?.[habit.id]
  if (logged) return logged
  if (day >= today) return 'pending'
  return habit.kind === 'do' ? 'missed' : 'kept'
}

export function isGood(r: Resolved): boolean {
  return r === 'done' || r === 'kept'
}

export function isBad(r: Resolved): boolean {
  return r === 'missed' || r === 'broken'
}

export interface DayResult {
  day: DateKey
  hpDelta: number
  xp: number
  scheduled: number
  good: number
  bad: number
  pending: number
  sleepHit: boolean
  sleepShort: boolean
  /** Every scheduled habit succeeded and any logged sleep met its goal. */
  perfect: boolean
  /** Nothing scheduled and no sleep logged. */
  empty: boolean
}

export function evaluateDay(state: QuestState, day: DateKey, today: DateKey): DayResult {
  const habits = habitsOn(state, day)
  const recovery = state.mondayRecovery && weekday(day) === 1
  let hpDelta = 0
  let xp = 0
  let good = 0
  let bad = 0
  let pending = 0
  for (const h of habits) {
    const r = resolve(state, h, day, today)
    if (isGood(r)) {
      good++
      hpDelta += RULES.good.hp
      xp += RULES.good.xp
    } else if (isBad(r)) {
      // Recovery Monday: a missed "do" habit costs nothing. Breaking an avoid habit still counts.
      if (recovery && r === 'missed') continue
      bad++
      hpDelta += RULES.bad.hp
    } else {
      pending++
    }
  }
  const sleep = state.sleep[day]
  const sleepHit = !!sleep && sleep.hours >= sleep.goal
  const sleepShort = !!sleep && sleep.hours < sleep.goal
  if (sleepHit) {
    hpDelta += RULES.sleepHit.hp
    xp += RULES.sleepHit.xp
  } else if (sleepShort) {
    hpDelta += RULES.sleepShort.hp
  }
  const empty = habits.length === 0 && !sleep
  return {
    day,
    hpDelta,
    xp,
    scheduled: habits.length,
    good,
    bad,
    pending,
    sleepHit,
    sleepShort,
    perfect: !empty && bad === 0 && pending === 0 && !sleepShort,
    empty,
  }
}

export interface Progress {
  hp: number
  xp: number
  level: number
  xpIntoLevel: number
  mood: Mood
  streak: number
  bestStreak: number
  totals: { good: number; bad: number; sleepHits: number }
}

/** Replays every day from the quest start, so undoing or editing a log never stacks rewards. */
export function computeProgress(state: QuestState, today: DateKey): Progress {
  let hp = RULES.startHp
  let xp = 0
  let run = 0
  let bestStreak = 0
  const totals = { good: 0, bad: 0, sleepHits: 0 }
  const results: DayResult[] = []
  if (state.startDate <= today) {
    for (const day of daysBetween(state.startDate, today)) {
      const r = evaluateDay(state, day, today)
      results.push(r)
      hp = Math.min(RULES.maxHp, Math.max(RULES.minHp, hp + r.hpDelta))
      xp += r.xp
      totals.good += r.good
      totals.bad += r.bad
      if (r.sleepHit) totals.sleepHits++
      if (r.perfect) run++
      else if (!r.empty && !(r.day === today && r.bad === 0 && !r.sleepShort)) run = 0
      bestStreak = Math.max(bestStreak, run)
    }
  }
  return {
    hp,
    xp,
    level: Math.floor(xp / RULES.xpPerLevel) + 1,
    xpIntoLevel: xp % RULES.xpPerLevel,
    mood: moodFor(hp),
    streak: run,
    bestStreak,
    totals,
  }
}

export interface WeekSummary {
  days: { day: DateKey; result: DayResult; future: boolean }[]
  good: number
  bad: number
  scheduled: number
  sleepHits: number
  sleepLogged: number
}

export function summarizeWeek(state: QuestState, anyDay: DateKey, today: DateKey): WeekSummary {
  const days = weekDays(anyDay).map((day) => ({
    day,
    result: evaluateDay(state, day, today),
    future: day > today,
  }))
  const counted = days.filter((d) => !d.future && d.day >= state.startDate)
  return {
    days,
    good: counted.reduce((n, d) => n + d.result.good, 0),
    bad: counted.reduce((n, d) => n + d.result.bad, 0),
    scheduled: counted.reduce((n, d) => n + d.result.scheduled, 0),
    sleepHits: counted.filter((d) => d.result.sleepHit).length,
    sleepLogged: counted.filter((d) => state.sleep[d.day]).length,
  }
}

/** Good choices over the last 7 days drive how lush the plant looks. */
export function recentGood(state: QuestState, today: DateKey): number {
  let n = 0
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, -i)
    if (day < state.startDate) break
    n += evaluateDay(state, day, today).good
  }
  return n
}

export type PlantStage = 'wilted' | 'sprout' | 'leafy' | 'bloom'

export function plantStage(hp: number, good7: number): PlantStage {
  if (hp < 45) return 'wilted'
  if (good7 >= 10) return 'bloom'
  if (good7 >= 4) return 'leafy'
  return 'sprout'
}

export const REWARDS = [
  { level: 2, id: 'sparkle', name: 'A little sparkle', blurb: 'Twinkles drift around the room.' },
  { level: 3, id: 'sunflower', name: 'Sunflower friend', blurb: 'Your plant blooms into a sunflower.' },
  { level: 4, id: 'crown', name: 'Tiny royalty', blurb: 'A crown for your companion.' },
  { level: 5, id: 'stars', name: 'Starry lights', blurb: 'Fairy lights strung over the bed.' },
] as const

export type RewardId = (typeof REWARDS)[number]['id']

export function unlocked(level: number): Set<RewardId> {
  return new Set(REWARDS.filter((r) => level >= r.level).map((r) => r.id))
}

// ---- state updates (pure; return a new state) ----

export function setLog(state: QuestState, day: DateKey, habitId: string, status: LogStatus | null): QuestState {
  const dayLogs = { ...(state.logs[day] ?? {}) }
  if (status) dayLogs[habitId] = status
  else delete dayLogs[habitId]
  const logs = { ...state.logs }
  if (Object.keys(dayLogs).length) logs[day] = dayLogs
  else delete logs[day]
  return { ...state, logs }
}

export function setSleep(state: QuestState, day: DateKey, hours: number | null): QuestState {
  const sleep = { ...state.sleep }
  if (hours === null) delete sleep[day]
  else sleep[day] = { hours, goal: state.sleep[day]?.goal ?? state.sleepGoal }
  return { ...state, sleep }
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export type HabitDraft = Pick<Habit, 'name' | 'icon' | 'kind' | 'days'>

export function addHabit(state: QuestState, draft: HabitDraft, today: DateKey): QuestState {
  const habit: Habit = { ...draft, id: newId(), createdOn: today }
  return { ...state, habits: [...state.habits, habit] }
}

/**
 * Editing keeps history honest: the old version is archived from today and a
 * replacement starts today, carrying over today's check-in. A habit created
 * today is simply edited in place.
 */
export function editHabit(state: QuestState, id: string, draft: HabitDraft, today: DateKey): QuestState {
  const old = state.habits.find((h) => h.id === id)
  if (!old) return state
  if (old.createdOn >= today) {
    return { ...state, habits: state.habits.map((h) => (h.id === id ? { ...h, ...draft } : h)) }
  }
  const replacement: Habit = { ...draft, id: newId(), createdOn: today }
  let next: QuestState = {
    ...state,
    habits: [...state.habits.map((h) => (h.id === id ? { ...h, archivedOn: today } : h)), replacement],
  }
  const todayStatus = state.logs[today]?.[id]
  if (todayStatus) {
    next = setLog(next, today, id, null)
    const carried =
      replacement.kind === old.kind ? todayStatus : null
    if (carried) next = setLog(next, today, replacement.id, carried)
  }
  return next
}

export function archiveHabit(state: QuestState, id: string, today: DateKey): QuestState {
  const habit = state.habits.find((h) => h.id === id)
  if (!habit) return state
  if (habit.createdOn >= today) {
    // Never counted on any past day, so drop it entirely.
    const logs = Object.fromEntries(
      Object.entries(state.logs).map(([d, l]) => [d, Object.fromEntries(Object.entries(l).filter(([k]) => k !== id))]),
    )
    return { ...state, habits: state.habits.filter((h) => h.id !== id), logs }
  }
  return { ...state, habits: state.habits.map((h) => (h.id === id ? { ...h, archivedOn: today } : h)) }
}

export function activeHabits(state: QuestState, today: DateKey): Habit[] {
  return state.habits.filter((h) => !h.archivedOn || h.archivedOn > today)
}
