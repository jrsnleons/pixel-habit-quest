import type { DateKey } from './dates'

export type HabitKind = 'do' | 'avoid'
export type DoStatus = 'done' | 'missed'
export type AvoidStatus = 'kept' | 'broken'
export type LogStatus = DoStatus | AvoidStatus

export interface Habit {
  id: string
  name: string
  icon: string
  kind: HabitKind
  /** Weekdays the habit applies to, 0 = Sunday … 6 = Saturday. */
  days: number[]
  /** First day the habit counts. */
  createdOn: DateKey
  /** First day the habit no longer counts (exclusive). */
  archivedOn?: DateKey
}

export interface SleepEntry {
  hours: number
  /** Goal in force when the entry was logged; changing the goal later doesn't rewrite history. */
  goal: number
}

export type Species = 'cat' | 'bunny' | 'bear' | 'slime'
export type Accessory = 'none' | 'bow' | 'sprout' | 'scarf' | 'flower'

export interface PetLook {
  species: Species
  color: string
  accessory: Accessory
}

export interface QuestState {
  version: 1
  petName: string
  pet: PetLook
  sleepGoal: number
  mondayRecovery: boolean
  startDate: DateKey
  habits: Habit[]
  /** date → habitId → status */
  logs: Record<DateKey, Record<string, LogStatus>>
  sleep: Record<DateKey, SleepEntry>
}
