import { useCallback, useEffect, useRef, useState } from 'react'
import { todayKey } from './dates'
import { normalizeState } from './defaults'
import type { QuestStore } from './storage'
import type { QuestState } from './types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface QuestHandle {
  state: QuestState
  update: (fn: (s: QuestState) => QuestState) => void
  status: SaveStatus
  notice: string | null
  clearNotice: () => void
  retry: () => void
}

/**
 * Loads a quest from a store and saves changes shortly after they happen.
 * Saves are serialized and revision-checked, so two open tabs can't silently
 * overwrite each other.
 */
export function useQuest(store: QuestStore, initial: { state: QuestState; revision: number }): QuestHandle {
  const [state, setState] = useState(initial.state)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [notice, setNotice] = useState<string | null>(null)
  const revision = useRef(initial.revision)
  const latest = useRef(initial.state)
  const dirty = useRef(false)
  const saving = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(async () => {
    if (saving.current || !dirty.current) return
    saving.current = true
    dirty.current = false
    setStatus('saving')
    const snapshot = latest.current
    let failed = false
    try {
      const res = await store.save(snapshot, revision.current)
      if (res.ok) {
        revision.current = res.revision
        setStatus(dirty.current ? 'saving' : 'saved')
      } else {
        // Someone else saved first (another tab or device). Take theirs.
        revision.current = res.conflict.revision
        const theirs = normalizeState(res.conflict.state, todayKey())
        latest.current = theirs
        setState(theirs)
        dirty.current = false
        setStatus('saved')
        setNotice('Your quest was updated on another device, so we loaded the latest version. Please redo your last change.')
      }
    } catch {
      failed = true
      dirty.current = true
      setStatus('error')
    } finally {
      saving.current = false
      // Changes made while this save was in flight go out next.
      if (dirty.current && !failed) timer.current = window.setTimeout(flush, 400)
    }
  }, [store])

  const update = useCallback(
    (fn: (s: QuestState) => QuestState) => {
      const next = fn(latest.current)
      if (next === latest.current) return
      latest.current = next
      setState(next)
      dirty.current = true
      setStatus('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, 500)
    },
    [flush],
  )

  const retry = useCallback(() => {
    dirty.current = true
    void flush()
  }, [flush])

  // Try to save before the tab goes away.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && dirty.current) void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.clearTimeout(timer.current)
    }
  }, [flush])

  return { state, update, status, notice, clearNotice: () => setNotice(null), retry }
}

/** Current local day; refreshes when the date rolls over or the app comes back into view. */
export function useToday(): string {
  const [today, setToday] = useState(todayKey())
  useEffect(() => {
    const tick = () => setToday((t) => (t === todayKey() ? t : todayKey()))
    const id = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}
