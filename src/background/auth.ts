import { signIn, signOut as authSignOut } from '@/services/auth/authService';
import { clearLocalProfile, getLocalProfile, getSessionToken } from '@/services/auth/session';
import { safeBroadcast } from './broadcast';
import type { BGMessage } from '@/types/messages';
import type { UserProfile } from '@/types/domain';

export async function getAuthStatusPayload(): Promise<Extract<BGMessage, { type: 'AUTH_STATUS' }>> {
  const profile = await getLocalProfile();
  return {
    type: 'AUTH_STATUS',
    signedIn: !!profile,
    ...(profile ? { user: profile as UserProfile } : {}),
  };
}

export async function checkAuthStatus(): Promise<void> {
  const payload = await getAuthStatusPayload();
  safeBroadcast(payload);
}

export async function performSignIn(): Promise<void> {
  const result = await signIn();
  if (result.ok) {
    safeBroadcast({ type: 'AUTH_STATUS', signedIn: true, user: result.value });
  } else {
    safeBroadcast({ type: 'AUTH_STATUS', signedIn: false });
  }
}

export async function performSignOut(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await authSignOut(token);
  } else {
    // Session storage was cleared (SW restart) but local profile may still exist — clear it.
    await clearLocalProfile();
  }
  safeBroadcast({ type: 'AUTH_STATUS', signedIn: false });
}
