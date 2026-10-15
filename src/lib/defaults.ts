import type { DateKey } from './dates'
import { newId } from './quest'
import type { QuestState } from './types'

export function defaultState(today: DateKey): QuestState {
  return {
    version: 1,
    petName: 'Mochi',
    pet: { species: 'cat', color: 'lavender', accessory: 'bow' },
    sleepGoal: 8,
    mondayRecovery: true,
    startDate: today,
    habits: [
      { id: newId(), name: 'Drink enough water', icon: 'droplet', kind: 'do', days: [0, 1, 2, 3, 4, 5, 6], createdOn: today },
      { id: newId(), name: 'Walk after work', icon: 'footprints', kind: 'do', days: [2, 3, 4, 5], createdOn: today },
      { id: newId(), name: 'Avoid late-night scrolling', icon: 'smartphone', kind: 'avoid', days: [0, 1, 2, 3, 4, 5, 6], createdOn: today },
    ],
    logs: {},
    sleep: {},
  }
}

/** Guards against malformed saved data; fills anything missing from defaults. */
export function normalizeState(raw: unknown, today: DateKey): QuestState {
  const base = defaultState(today)
  if (!raw || typeof raw !== 'object') return base
  const s = raw as Partial<QuestState>
  return {
    version: 1,
    petName: typeof s.petName === 'string' && s.petName.trim() ? s.petName.slice(0, 24) : base.petName,
    pet: { ...base.pet, ...(s.pet ?? {}) },
    sleepGoal: typeof s.sleepGoal === 'number' ? s.sleepGoal : base.sleepGoal,
    mondayRecovery: typeof s.mondayRecovery === 'boolean' ? s.mondayRecovery : base.mondayRecovery,
    startDate: typeof s.startDate === 'string' ? s.startDate : base.startDate,
    habits: Array.isArray(s.habits) ? s.habits : base.habits,
    logs: s.logs && typeof s.logs === 'object' ? s.logs : {},
    sleep: s.sleep && typeof s.sleep === 'object' ? s.sleep : {},
  }
}
