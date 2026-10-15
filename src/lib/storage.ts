import { supabase } from './supabase'
import type { QuestState } from './types'

export interface Saved {
  state: QuestState
  revision: number
}

export type SaveResult = { ok: true; revision: number } | { ok: false; conflict: Saved }

export interface QuestStore {
  /** Returns null when this player has no quest yet. */
  load(): Promise<Saved | null>
  create(state: QuestState): Promise<Saved>
  save(state: QuestState, revision: number): Promise<SaveResult>
}

const GUEST_KEY = 'pixel-habit-quest:guest'

export function readGuest(): Saved | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

export function clearGuest() {
  try {
    localStorage.removeItem(GUEST_KEY)
  } catch {
    /* storage unavailable */
  }
}

/** Plays without an account; progress lives in this browser only. */
export const guestStore: QuestStore = {
  async load() {
    return readGuest()
  },
  async create(state) {
    return this.save(state, 0).then(() => ({ state, revision: 1 }))
  },
  async save(state, revision) {
    const next = { state, revision: revision + 1 }
    localStorage.setItem(GUEST_KEY, JSON.stringify(next))
    return { ok: true, revision: next.revision }
  },
}

export class StoreError extends Error {}

function fail(message: string, cause?: unknown): never {
  console.error(message, cause)
  throw new StoreError(message)
}

export function accountStore(userId: string): QuestStore {
  const db = supabase
  if (!db) fail('Accounts are not configured for this build.')
  return {
    async load() {
      const { data, error } = await db
        .from('quests')
        .select('state, revision')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) fail('Could not load your quest.', error)
      return data ? { state: data.state as QuestState, revision: data.revision as number } : null
    },
    async create(state) {
      const { error } = await db.from('quests').insert({ user_id: userId, state, revision: 1 })
      if (error) {
        // Another tab created it first: use that one.
        const existing = await this.load()
        if (existing) return existing
        fail('Could not start your quest.', error)
      }
      return { state, revision: 1 }
    },
    async save(state, revision) {
      // Only write if nobody else saved since we loaded (optimistic concurrency).
      const { data, error } = await db
        .from('quests')
        .update({ state, revision: revision + 1 })
        .eq('user_id', userId)
        .eq('revision', revision)
        .select('revision')
      if (error) fail('Could not save your progress.', error)
      if (data && data.length === 1) return { ok: true, revision: data[0].revision as number }
      const latest = await this.load()
      if (!latest) fail('Your saved quest is missing.')
      return { ok: false, conflict: latest }
    },
  }
}
