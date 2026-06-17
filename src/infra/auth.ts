import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'
import type { Profile } from '@models/domain'

interface ProfileRow {
  id: string
  username: string
  display_name: string | null
  created_at: string
}

/**
 * Supabase Auth is email-based, but we expose username-only login. We derive a
 * deterministic synthetic email from the (normalized) username and use it under
 * the hood. This requires "Confirm email" to be OFF in the project, since these
 * addresses can't receive a confirmation link.
 */
const EMAIL_DOMAIN = 'tabletop.local'
const USERNAME_RE = /^[a-z0-9_]{3,32}$/

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    createdAt: row.created_at
  }
}

/** Fetches the profile for a user id, or null if none exists yet. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    logger.error('getProfile failed', error.message)
    throw error
  }
  return data ? mapProfile(data as ProfileRow) : null
}

/** Creates the profile row for the current user (carries the invite username). */
export async function createProfile(userId: string, username: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, username, display_name: username })
    .select('id, username, display_name, created_at')
    .single()
  if (error) {
    logger.error('createProfile failed', error.message)
    throw error
  }
  logger.info('profile created', username)
  return mapProfile(data as ProfileRow)
}

/**
 * Single entry point: creates the account if the username is new, otherwise
 * signs in. We try signUp first because it's the only call that reliably tells
 * "new" from "existing" — signInWithPassword returns the same error for an
 * unknown user and a wrong password, so it can't distinguish the two.
 */
export async function join(username: string, password: string): Promise<void> {
  const normalized = normalizeUsername(username)
  if (!USERNAME_RE.test(normalized)) {
    throw new Error('Username must be 3–32 chars: letters, numbers or underscore')
  }
  const email = usernameToEmail(normalized)

  // New account → signUp returns a session immediately (email confirm is off).
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (!error && data.session && data.user) {
    await createProfile(data.user.id, normalized)
    logger.info('joined (new account)', normalized)
    return
  }

  // Username already exists → sign in with the given password.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    logger.warn('join failed', error?.message ?? signInError.message)
    throw new Error('Wrong password for this username')
  }

  // Safety: ensure a profile exists for older accounts that never got one.
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user && !(await getProfile(userData.user.id))) {
    await createProfile(userData.user.id, normalized)
  }
  logger.info('joined (existing account)', normalized)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
  logger.info('signOut')
}
