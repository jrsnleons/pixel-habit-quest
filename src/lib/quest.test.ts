import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import {
  addHabit,
  archiveHabit,
  computeProgress,
  editHabit,
  evaluateDay,
  isScheduled,
  moodFor,
  setLog,
  setSleep,
  summarizeWeek,
} from './quest'
import type { Habit, QuestState } from './types'

// 2026-10-12 is a Monday.
const MON = '2026-10-12'
const TUE = '2026-10-13'
const WED = '2026-10-14'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

function habit(id: string, kind: Habit['kind'], days = EVERY_DAY, createdOn = MON): Habit {
  return { id, name: id, icon: 'star', kind, days, createdOn }
}

function quest(habits: Habit[], extra: Partial<QuestState> = {}): QuestState {
  return {
    version: 1,
    petName: 'Mochi',
    pet: { species: 'cat', color: 'lavender', accessory: 'none' },
    sleepGoal: 8,
    mondayRecovery: false,
    startDate: MON,
    habits,
    logs: {},
    sleep: {},
    ...extra,
  }
}

describe('schedules', () => {
  it('respects weekdays like Tuesday–Friday', () => {
    const walk = habit('walk', 'do', [2, 3, 4, 5])
    expect(isScheduled(walk, MON)).toBe(false)
    expect(isScheduled(walk, TUE)).toBe(true)
    expect(isScheduled(walk, '2026-10-17')).toBe(false) // Saturday
  })

  it('ignores days before creation and from archive onward', () => {
    const h = { ...habit('h', 'do', EVERY_DAY, TUE), archivedOn: '2026-10-15' }
    expect(isScheduled(h, MON)).toBe(false)
    expect(isScheduled(h, WED)).toBe(true)
    expect(isScheduled(h, '2026-10-15')).toBe(false)
  })
})

describe('rewards and penalties', () => {
  it('completing a do habit gives +5 HP and +15 XP', () => {
    const s = setLog(quest([habit('a', 'do')]), MON, 'a', 'done')
    const p = computeProgress(s, MON)
    expect(p.hp).toBe(80)
    expect(p.xp).toBe(15)
  })

  it('keeping an avoid habit gives +5 HP and +15 XP; breaking costs 8 HP', () => {
    let s = setLog(quest([habit('a', 'avoid')]), MON, 'a', 'kept')
    expect(computeProgress(s, MON)).toMatchObject({ hp: 80, xp: 15 })
    s = setLog(s, MON, 'a', 'broken')
    expect(computeProgress(s, MON)).toMatchObject({ hp: 67, xp: 0 })
  })

  it('an unlogged do habit is pending today and missed once the day ends', () => {
    const s = quest([habit('a', 'do')])
    expect(computeProgress(s, MON).hp).toBe(75)
    expect(evaluateDay(s, MON, TUE).bad).toBe(1)
    expect(computeProgress(s, TUE).hp).toBe(67)
  })

  it('an avoid habit with no break is rewarded after its day ends', () => {
    const s = quest([habit('a', 'avoid')])
    expect(computeProgress(s, MON)).toMatchObject({ hp: 75, xp: 0 })
    expect(computeProgress(s, TUE)).toMatchObject({ hp: 80, xp: 15 })
  })

  it('sleep: meeting the goal gives +8/+20, short sleep -3, unlogged nothing', () => {
    let s = setSleep(quest([]), MON, 8)
    expect(computeProgress(s, MON)).toMatchObject({ hp: 83, xp: 20 })
    s = setSleep(s, MON, 6.5)
    expect(computeProgress(s, MON)).toMatchObject({ hp: 72, xp: 0 })
    s = setSleep(s, MON, null)
    expect(computeProgress(s, MON)).toMatchObject({ hp: 75, xp: 0 })
  })

  it('sleep entries keep the goal they were logged with', () => {
    let s = setSleep(quest([]), MON, 7)
    s = { ...s, sleepGoal: 7 }
    expect(computeProgress(s, MON).hp).toBe(72) // still judged against 8
    s = setSleep(s, TUE, 7)
    expect(s.sleep[TUE].goal).toBe(7)
  })

  it('HP never drops below 10 and never exceeds 100', () => {
    const s = quest([habit('a', 'do'), habit('b', 'do'), habit('c', 'do')])
    expect(computeProgress(s, addDays(MON, 10)).hp).toBe(10)
    let good = quest([habit('a', 'avoid'), habit('b', 'avoid')])
    good = setSleep(good, MON, 9)
    expect(computeProgress(good, addDays(MON, 10)).hp).toBe(100)
  })

  it('recovers after hitting the floor', () => {
    let s = quest([habit('a', 'do')])
    for (let i = 0; i < 10; i++) s = setLog(s, addDays(MON, i), 'a', 'missed')
    s = setLog(s, addDays(MON, 10), 'a', 'done')
    expect(computeProgress(s, addDays(MON, 10)).hp).toBe(15)
  })

  it('undo and re-log does not stack XP', () => {
    let s = quest([habit('a', 'do')])
    s = setLog(s, MON, 'a', 'done')
    s = setLog(s, MON, 'a', null)
    s = setLog(s, MON, 'a', 'done')
    s = setLog(s, MON, 'a', 'done')
    expect(computeProgress(s, MON).xp).toBe(15)
  })

  it('levels up every 100 XP and sets mood thresholds', () => {
    let s = quest([habit('a', 'do')])
    for (let i = 0; i < 7; i++) s = setLog(s, addDays(MON, i), 'a', 'done')
    const p = computeProgress(s, addDays(MON, 6))
    expect(p.xp).toBe(105)
    expect(p.level).toBe(2)
    expect(p.xpIntoLevel).toBe(5)
    expect(moodFor(75)).toBe('happy')
    expect(moodFor(74)).toBe('tired')
    expect(moodFor(45)).toBe('tired')
    expect(moodFor(44)).toBe('sad')
  })
})

describe('Monday recovery', () => {
  it('a missed do habit on Monday costs nothing when recovery is on', () => {
    const s = quest([habit('a', 'do')], { mondayRecovery: true })
    expect(computeProgress(s, TUE).hp).toBe(75)
    const off = quest([habit('a', 'do')], { mondayRecovery: false })
    expect(computeProgress(off, TUE).hp).toBe(67)
  })

  it('still rewards completions and still counts broken avoid habits', () => {
    let s = quest([habit('a', 'do'), habit('b', 'avoid')], { mondayRecovery: true })
    s = setLog(s, MON, 'a', 'done')
    s = setLog(s, MON, 'b', 'broken')
    expect(computeProgress(s, MON)).toMatchObject({ hp: 72, xp: 15 })
  })
})

describe('streaks', () => {
  it('counts consecutive perfect days and keeps today open while pending', () => {
    let s = quest([habit('a', 'do')])
    s = setLog(s, MON, 'a', 'done')
    s = setLog(s, TUE, 'a', 'done')
    expect(computeProgress(s, WED).streak).toBe(2)
    s = setLog(s, WED, 'a', 'done')
    expect(computeProgress(s, WED).streak).toBe(3)
  })

  it('resets on a miss or short sleep', () => {
    let s = quest([habit('a', 'do')])
    s = setLog(s, MON, 'a', 'done')
    s = setLog(s, TUE, 'a', 'missed')
    s = setLog(s, WED, 'a', 'done')
    expect(computeProgress(s, WED)).toMatchObject({ streak: 1, bestStreak: 1 })
    s = setSleep(s, WED, 5)
    expect(computeProgress(s, WED).streak).toBe(0)
  })

  it('days with nothing scheduled do not break a streak', () => {
    let s = quest([habit('a', 'do', [1, 3])]) // Mon, Wed
    s = setLog(s, MON, 'a', 'done')
    s = setLog(s, WED, 'a', 'done')
    expect(computeProgress(s, WED).streak).toBe(2)
  })
})

describe('editing habits', () => {
  it('archives the old version, starts a replacement today, and carries today’s check-in', () => {
    let s = quest([habit('walk', 'do')])
    s = setLog(s, MON, 'walk', 'done')
    s = setLog(s, TUE, 'walk', 'done')
    s = editHabit(s, 'walk', { name: 'Walk 20 min', icon: 'footprints', kind: 'do', days: [2, 3] }, TUE)
    const [old, repl] = s.habits
    expect(old.archivedOn).toBe(TUE)
    expect(repl.createdOn).toBe(TUE)
    expect(s.logs[TUE][repl.id]).toBe('done')
    expect(s.logs[MON].walk).toBe('done')
    // History is unchanged: two completions.
    expect(computeProgress(s, TUE).xp).toBe(30)
  })

  it('edits a habit created today in place', () => {
    let s = addHabit(quest([]), { name: 'x', icon: 'star', kind: 'do', days: EVERY_DAY }, MON)
    const id = s.habits[0].id
    s = editHabit(s, id, { name: 'y', icon: 'star', kind: 'do', days: [1] }, MON)
    expect(s.habits).toHaveLength(1)
    expect(s.habits[0]).toMatchObject({ id, name: 'y' })
  })

  it('archiving keeps earlier history', () => {
    let s = quest([habit('a', 'do')])
    s = setLog(s, MON, 'a', 'done')
    s = archiveHabit(s, 'a', TUE)
    expect(computeProgress(s, WED)).toMatchObject({ xp: 15, hp: 80 })
  })
})

describe('week summary', () => {
  it('counts only past and present days', () => {
    let s = quest([habit('a', 'do')])
    s = setLog(s, MON, 'a', 'done')
    s = setSleep(s, MON, 8)
    const w = summarizeWeek(s, WED, TUE)
    expect(w.days).toHaveLength(7)
    expect(w.good).toBe(1)
    expect(w.scheduled).toBe(2)
    expect(w.sleepHits).toBe(1)
    expect(w.days[2].future).toBe(true)
  })
})
