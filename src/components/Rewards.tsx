import { Lock } from 'lucide-react'
import { computeProgress, REWARDS } from '../lib/quest'
import type { DateKey } from '../lib/dates'
import type { QuestState } from '../lib/types'
import { PixelPet } from '../pet/PixelPet'

export function RewardsPage({ state, today }: { state: QuestState; today: DateKey }) {
  const { level, xp } = computeProgress(state, today)
  return (
    <div className="page">
      <div className="page__head">
        <h2>Rewards</h2>
        <span className="badge">Level {level} · {xp} XP total</span>
      </div>
      <ul className="rewards">
        {REWARDS.map((r) => {
          const open = level >= r.level
          return (
            <li key={r.id} className={`card reward ${open ? 'is-open' : ''}`}>
              <div className="reward__art" aria-hidden="true">
                {r.id === 'crown' ? (
                  <PixelPet look={state.pet} face="happy" crown blink={false} className="reward__pet" />
                ) : (
                  <span className={`reward__glyph reward__glyph--${r.id}`} />
                )}
              </div>
              <div>
                <h3>{r.name}</h3>
                <p>{r.blurb}</p>
                <small>{open ? 'Unlocked' : <><Lock size={12} /> Reach level {r.level}</>}</small>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="hint hint--small">Every 100 XP is a new level. Completing habits earns 15 XP, and meeting your sleep goal earns 20.</p>
    </div>
  )
}
