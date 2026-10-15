import type { ReactNode } from 'react'
import type { Mood, PlantStage, RewardId } from '../lib/quest'

interface Props {
  mood: Mood
  plant: PlantStage
  rewards: Set<RewardId>
  children?: ReactNode
}

// A 128×80 pixel bedroom drawn with plain rects so it stays crisp at any size.
// Mood changes the light, the window weather and the plant.

const WALL = { happy: '#fbe4d5', tired: '#eadbe6', sad: '#a29ab8' }
const WALL_STRIPE = { happy: '#f6d6c4', tired: '#ddcbdb', sad: '#968eae' }
const FLOOR = { happy: '#d3a37c', tired: '#c39a7d', sad: '#8d7468' }
const SKY = { happy: '#8fd3ff', tired: '#c7cde2', sad: '#5e6787' }

export function Room({ mood, plant, rewards, children }: Props) {
  const flower = rewards.has('sunflower') && (plant === 'leafy' || plant === 'bloom')
  return (
    <div className={`room room--${mood}`}>
      <svg className="room__art" viewBox="0 0 128 80" shapeRendering="crispEdges" aria-hidden="true">
        {/* wall + stripes */}
        <rect width="128" height="58" fill={WALL[mood]} />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={i * 8 + 3} y="0" width="2" height="58" fill={WALL_STRIPE[mood]} />
        ))}
        <rect y="56" width="128" height="2" fill="#00000018" />
        {/* floor planks */}
        <rect y="58" width="128" height="22" fill={FLOOR[mood]} />
        {[63, 69, 75].map((y) => (
          <rect key={y} y={y} width="128" height="1" fill="#00000014" />
        ))}

        {/* window */}
        <rect x="10" y="8" width="36" height="30" fill="#fffaf4" />
        <rect x="12" y="10" width="32" height="26" fill={SKY[mood]} />
        {mood === 'happy' && (
          <g className="sun">
            <rect x="33" y="13" width="6" height="6" fill="#ffd34d" />
            <rect x="32" y="14" width="8" height="4" fill="#ffd34d" />
            <rect x="34" y="12" width="4" height="8" fill="#ffd34d" />
          </g>
        )}
        {mood !== 'happy' && (
          <g className="cloud" fill={mood === 'sad' ? '#7d84a0' : '#f4f5fb'}>
            <rect x="16" y="15" width="14" height="4" />
            <rect x="19" y="12" width="7" height="3" />
            <rect x="28" y="17" width="10" height="3" />
          </g>
        )}
        {mood === 'sad' && (
          <g className="rain" fill="#b8d4ff">
            {[15, 20, 25, 30, 35, 40].map((x, i) => (
              <rect key={x} x={x} y={20 + (i % 3) * 4} width="1" height="3" />
            ))}
          </g>
        )}
        <rect x="27" y="10" width="2" height="26" fill="#fffaf4" />
        <rect x="12" y="22" width="32" height="2" fill="#fffaf4" />
        <rect x="8" y="38" width="40" height="3" fill="#e9d7c6" />

        {/* shelf with books */}
        <rect x="56" y="22" width="26" height="2" fill="#9b6b4f" />
        <rect x="58" y="14" width="3" height="8" fill="#e8566f" />
        <rect x="61" y="15" width="3" height="7" fill="#7fb7e8" />
        <rect x="64" y="13" width="3" height="9" fill="#9fdcc0" />
        <rect x="70" y="17" width="5" height="5" fill="#ffd34d" />
        <rect x="76" y="16" width="4" height="6" fill="#b9a3e3" />

        {/* fairy lights reward */}
        {rewards.has('stars') && (
          <g className="lights">
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={86 + i * 4} y={28 + (i % 2)} width="2" height="2" fill={['#ffd34d', '#f48fb1', '#9fdcc0'][i % 3]} />
            ))}
          </g>
        )}

        {/* bed */}
        <rect x="88" y="34" width="4" height="30" fill="#9b6b4f" />
        <rect x="92" y="46" width="34" height="12" fill="#fffaf4" />
        <rect x="92" y="44" width="10" height="5" fill="#ffffff" />
        <rect x="102" y="46" width="24" height="12" fill={mood === 'sad' ? '#8f7fb3' : '#b9a3e3'} />
        <rect x="102" y="50" width="24" height="1" fill="#00000018" />
        <rect x="92" y="58" width="34" height="6" fill="#9b6b4f" />

        {/* rug */}
        <rect x="40" y="66" width="44" height="8" fill={mood === 'sad' ? '#b07f8f' : '#f2a6a0'} />
        <rect x="42" y="68" width="40" height="4" fill={mood === 'sad' ? '#c79aa7' : '#fbc8c0'} />

        {/* plant */}
        <Plant stage={plant} flower={flower} />

        {mood === 'sad' && <rect width="128" height="80" fill="#2a2045" opacity="0.18" />}
      </svg>

      {rewards.has('sparkle') && mood !== 'sad' && (
        <div className="sparkles" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      <div className="room__pet">{children}</div>
    </div>
  )
}

function Plant({ stage, flower }: { stage: PlantStage; flower: boolean }) {
  const leaf = stage === 'wilted' ? '#a3a06a' : '#5fbf6a'
  const dark = stage === 'wilted' ? '#857f4f' : '#3f8f4a'
  return (
    <g className={`plant plant--${stage}`}>
      <rect x="10" y="60" width="12" height="9" fill="#c8714f" />
      <rect x="9" y="58" width="14" height="3" fill="#e08a64" />
      {stage === 'wilted' ? (
        <>
          <rect x="15" y="52" width="2" height="6" fill={dark} />
          <rect x="11" y="54" width="4" height="2" fill={leaf} />
          <rect x="17" y="55" width="4" height="2" fill={leaf} />
        </>
      ) : (
        <>
          <rect x="15" y={stage === 'sprout' ? 52 : 44} width="2" height={stage === 'sprout' ? 6 : 14} fill={dark} />
          <rect x="11" y={stage === 'sprout' ? 52 : 48} width="4" height="3" fill={leaf} />
          <rect x="17" y={stage === 'sprout' ? 50 : 46} width="4" height="3" fill={leaf} />
          {stage !== 'sprout' && (
            <>
              <rect x="10" y="41" width="5" height="3" fill={leaf} />
              <rect x="17" y="39" width="5" height="3" fill={leaf} />
            </>
          )}
          {(stage === 'bloom' || flower) && (
            <g>
              <rect x="13" y="38" width="6" height="6" fill={flower ? '#ffd34d' : '#f48fb1'} />
              <rect x="15" y="40" width="2" height="2" fill={flower ? '#9b6b4f' : '#ffd34d'} />
            </g>
          )}
        </>
      )}
    </g>
  )
}
