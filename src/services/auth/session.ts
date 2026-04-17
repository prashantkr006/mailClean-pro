const TOKEN_KEY = 'auth_token';
const PROFILE_KEY = 'user_profile';

export interface StoredProfile {
  email: string;
  name: string;
  pictureUrl?: string;
}

export async function getSessionToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.session.get(TOKEN_KEY, (result) => {
      const value = result[TOKEN_KEY];
      resolve(typeof value === 'string' ? value : null);
    });
  });
}

export async function setSessionToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.session.set({ [TOKEN_KEY]: token }, resolve);
  });
}

export async function clearSessionToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.session.remove(TOKEN_KEY, resolve);
  });
}

export async function getLocalProfile(): Promise<StoredProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(PROFILE_KEY, (result) => {
      const value = result[PROFILE_KEY];
      if (value && typeof value === 'object' && 'email' in value) {
        resolve(value as StoredProfile);
      } else {
        resolve(null);
      }
    });
  });
}

export async function setLocalProfile(profile: StoredProfile): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PROFILE_KEY]: profile }, resolve);
  });
}

export async function clearLocalProfile(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(PROFILE_KEY, resolve);
  });
}
