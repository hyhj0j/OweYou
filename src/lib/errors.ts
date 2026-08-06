/**
 * Supabase's errors (PostgrestError, AuthError, FunctionsError, ...) carry a
 * `.message` string but aren't instances of the native Error class, so
 * `err instanceof Error` misses them and `String(err)` on a plain object
 * just gives "[object Object]". This checks for a usable message shape
 * instead of assuming a specific error class.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return String(err)
}
