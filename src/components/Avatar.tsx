import { avatarEmoji } from '../lib/avatar'

const SIZES = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-9 w-9 text-base',
  lg: 'h-12 w-12 text-xl',
}

export function Avatar({
  seed,
  kind,
  size = 'md',
  className = '',
}: {
  seed: string
  kind: 'group' | 'member'
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {avatarEmoji(seed, kind)}
    </span>
  )
}
