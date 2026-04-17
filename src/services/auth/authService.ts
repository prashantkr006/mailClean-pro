import type { Result } from '@/types/gmail';
import type { UserProfile } from '@/types/domain';
import { ok, err } from '@/types/gmail';
import {
  setSessionToken,
  clearSessionToken,
  setLocalProfile,
  clearLocalProfile,
} from './session';

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

export async function getAuthToken(interactive: boolean): Promise<Result<string>> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        resolve(
          err({
            code: 'AuthExpired',
            message: chrome.runtime.lastError?.message ?? 'Failed to get auth token',
          }),
        );
        return;
      }
      resolve(ok(token));
    });
  });
}

export async function removeCachedToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

export async function refreshToken(): Promise<Result<string>> {
  const current = await getAuthToken(false);
  if (current.ok) {
    await removeCachedToken(current.value);
  }
  return getAuthToken(false);
}

export async function fetchUserProfile(token: string): Promise<Result<UserProfile>> {
  try {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return err({
        code: response.status === 401 ? 'AuthExpired' : 'Unknown',
        message: `Failed to fetch user profile: ${response.status}`,
        status: response.status,
      });
    }

    const data = (await response.json()) as {
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!data.email) {
      return err({ code: 'Unknown', message: 'Missing email in profile response' });
    }

    return ok({
      email: data.email,
      name: data.name ?? data.email,
      ...(data.picture && { pictureUrl: data.picture }),
    });
  } catch {
    return err({ code: 'Network', message: 'Network error fetching user profile' });
  }
}

export async function signIn(): Promise<Result<UserProfile>> {
  const tokenResult = await getAuthToken(true);
  if (!tokenResult.ok) return tokenResult;

  const token = tokenResult.value;
  const profileResult = await fetchUserProfile(token);
  if (!profileResult.ok) return profileResult;

  await setSessionToken(token);
  await setLocalProfile({
    email: profileResult.value.email,
    name: profileResult.value.name,
    ...(profileResult.value.pictureUrl && { pictureUrl: profileResult.value.pictureUrl }),
  });

  return profileResult;
}

export async function signOut(token: string): Promise<void> {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    });
  } catch {
    // Best-effort revoke
  }

  await removeCachedToken(token);
  await clearSessionToken();
  await clearLocalProfile();
}
