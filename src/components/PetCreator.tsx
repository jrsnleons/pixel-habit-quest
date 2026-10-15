import type { PetLook, Species } from '../lib/types'
import { PixelPet } from '../pet/PixelPet'
import { ACCESSORIES, COLORS, SPECIES, type Face } from '../pet/sprites'

interface Props {
  look: PetLook
  name: string
  onChange: (look: PetLook, name: string) => void
}

const PREVIEW_FACES: Face[] = ['normal', 'happy', 'tired', 'sad']

/** Build-your-own companion: species, colour, accessory and name. */
export function PetCreator({ look, name, onChange }: Props) {
  const set = (patch: Partial<PetLook>) => onChange({ ...look, ...patch }, name)
  return (
    <div className="creator">
      <div className="creator__stage">
        <PixelPet look={look} face="normal" className="creator__pet bob" title={`${name}, your companion`} />
        <div className="creator__moods" aria-label="How your companion looks in each mood">
          {PREVIEW_FACES.map((f) => (
            <PixelPet key={f} look={look} face={f} blink={false} className="creator__mood" title={f} />
          ))}
        </div>
      </div>

      <div className="creator__controls">
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            maxLength={24}
            onChange={(e) => onChange(look, e.target.value)}
            placeholder="Mochi"
          />
        </label>

        <fieldset className="field">
          <legend>Species</legend>
          <div className="chips">
            {(Object.keys(SPECIES) as Species[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip chip--pet ${look.species === s ? 'is-on' : ''}`}
                aria-pressed={look.species === s}
                onClick={() => set({ species: s })}
              >
                <PixelPet look={{ ...look, species: s }} face="normal" blink={false} className="chip__pet" />
                {SPECIES[s].label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>Colour</legend>
          <div className="swatches">
            {Object.entries(COLORS).map(([id, c]) => (
              <button
                key={id}
                type="button"
                className={`swatch ${look.color === id ? 'is-on' : ''}`}
                style={{ background: c.B, borderColor: c.O }}
                aria-label={c.label}
                aria-pressed={look.color === id}
                title={c.label}
                onClick={() => set({ color: id })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>Accessory</legend>
          <div className="chips">
            {ACCESSORIES.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`chip ${look.accessory === a.id ? 'is-on' : ''}`}
                aria-pressed={look.accessory === a.id}
                onClick={() => set({ accessory: a.id })}
              >
                {a.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
