import { supabase } from './supabaseClient'
import type { Profile } from './db.types'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function createProfile(userId: string, email: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, email, display_name: displayName.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as Profile
}

export async function updateProfileDisplayName(userId: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data as Profile
}

// Changes the account's nickname everywhere at once: the profiles row (what
// autofills into new groups) and every group_members row this account
// already owns (what current groupmates actually see) -- otherwise a
// "nickname change" would silently only apply to future groups, and
// existing groupmates would keep seeing the old name. Both writes are
// allowed by existing RLS ("profiles: self can update" / "group_members:
// self can update display name"), so no RPC is needed.
export async function updateMyDisplayName(userId: string, displayName: string): Promise<Profile> {
  const trimmed = displayName.trim()
  const profile = await updateProfileDisplayName(userId, trimmed)

  const { error } = await supabase.from('group_members').update({ display_name: trimmed }).eq('user_id', userId)
  if (error) throw error

  return profile
}
