import {
  Apple,
  Bed,
  Bike,
  BookOpen,
  Candy,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  Gamepad2,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Pill,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Wine,
  type LucideIcon,
} from 'lucide-react'

export const HABIT_ICONS: Record<string, LucideIcon> = {
  droplet: Droplet,
  footprints: Footprints,
  smartphone: Smartphone,
  book: BookOpen,
  dumbbell: Dumbbell,
  apple: Apple,
  moon: Moon,
  coffee: Coffee,
  pill: Pill,
  music: Music,
  pen: PenLine,
  leaf: Leaf,
  heart: Heart,
  sun: Sun,
  bike: Bike,
  sparkles: Sparkles,
  candy: Candy,
  wine: Wine,
  gamepad: Gamepad2,
  bed: Bed,
  star: Star,
}

export function HabitIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = HABIT_ICONS[name] ?? Star
  return <Icon size={size} aria-hidden="true" />
}
