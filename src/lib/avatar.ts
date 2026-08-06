const GROUP_EMOJIS = ['🏠', '🏡', '🏢', '🏙️', '🛋️', '🧺', '🎉', '📦', '🍽️', '🛒']
const MEMBER_EMOJIS = ['🦊', '🐱', '🐶', '🐼', '🐻', '🐨', '🦁', '🐯', '🐸', '🐵', '🦉', '🐧', '🐰', '🐹', '🦄', '🐢']

// Tailwind's scanner needs full class strings literally in source, so this
// is a fixed lookup table rather than a computed `bg-${color}-100` string.
const PALETTE = [
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
]

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Deterministic per-id emoji so the same group/member always gets the same icon. */
export function avatarEmoji(seed: string, kind: 'group' | 'member'): string {
  const set = kind === 'group' ? GROUP_EMOJIS : MEMBER_EMOJIS
  return set[hashSeed(seed) % set.length]
}

/** Deterministic per-id background/text color pair, offset from the emoji hash so the two don't always move together. */
export function avatarColorClasses(seed: string): string {
  return PALETTE[hashSeed(`${seed}:color`) % PALETTE.length]
}
