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
