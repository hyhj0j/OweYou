import { supabase } from './supabaseClient'
import type { CreateGroupResult, Group, GroupMember, JoinGroupResult, PreviewGroupResult } from './db.types'

export async function createGroup(name: string, currency: string, displayName: string): Promise<CreateGroupResult> {
  const { data, error } = await supabase
    .rpc('create_group', { p_name: name, p_currency: currency, p_display_name: displayName })
    .single()
  if (error) throw error
  return data as CreateGroupResult
}

export async function previewGroupByCode(inviteCode: string): Promise<PreviewGroupResult | null> {
  const { data, error } = await supabase.rpc('preview_group_by_code', { p_invite_code: inviteCode }).single()
  if (error) {
    // PGRST116: PostgREST's .single() error for "zero rows" -- an
    // unrecognized invite code, not a real failure worth surfacing as one.
    if (error.code === 'PGRST116') return null
    throw error
  }
  const row = data as PreviewGroupResult | null
  if (!row || !row.group_id) return null
  return row
}

export async function joinGroup(
  inviteCode: string,
  displayName: string,
  claimMemberId?: string,
): Promise<JoinGroupResult> {
  const { data, error } = await supabase
    .rpc('join_group', { p_invite_code: inviteCode, p_display_name: displayName, p_claim_member_id: claimMemberId ?? null })
    .single()
  if (error) throw error
  return data as JoinGroupResult
}

export type UnclaimedMember = { member_id: string; display_name: string }

export async function listUnclaimedMembers(inviteCode: string): Promise<UnclaimedMember[]> {
  const { data, error } = await supabase.rpc('list_unclaimed_members', { p_invite_code: inviteCode })
  if (error) throw error
  return (data ?? []) as UnclaimedMember[]
}

export async function createPlaceholderMember(groupId: string, displayName: string): Promise<GroupMember> {
  const { data, error } = await supabase
    .rpc('create_placeholder_member', { p_group_id: groupId, p_display_name: displayName })
    .single()
  if (error) throw error
  return data as GroupMember
}

export async function deletePlaceholderMember(memberId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_placeholder_member', { p_member_id: memberId })
  if (error) throw error
}

export type MyGroup = { member: GroupMember; group: Group }

export async function fetchMyGroups(userId: string): Promise<MyGroup[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('id, group_id, user_id, display_name, created_at, groups(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? [])
    .filter((row) => row.groups)
    .map((row) => {
      const { groups, ...member } = row as unknown as GroupMember & { groups: Group }
      return { member: member as GroupMember, group: groups }
    })
}

export async function fetchGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single()
  if (error) throw error
  return data as Group
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as GroupMember[]
}

export function inviteLinkFor(inviteCode: string): string {
  return `${window.location.origin}/join/${inviteCode}`
}
