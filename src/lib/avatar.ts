const GROUP_EMOJIS = ['🏠', '🏡', '🏢', '🏙️', '🛋️', '🧺', '🎉', '📦', '🍽️', '🛒']
const MEMBER_EMOJIS = ['🦊', '🐱', '🐶', '🐼', '🐻', '🐨', '🦁', '🐯', '🐸', '🐵', '🦉', '🐧', '🐰', '🐹', '🦄', '🐢']

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
