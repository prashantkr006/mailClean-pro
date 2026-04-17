import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { BGMessage, MessageResponse } from '@/types/messages';
import type { UserProfile } from '@/types/domain';

export function useAuth() {
  const { signedIn, user, setAuth } = useAuthStore();

  useEffect(() => {
    // Listen for broadcasts from background (sign-in/out results, auth changes)
    const listener = (message: BGMessage) => {
      if (message.type === 'AUTH_STATUS') {
        setAuth(message.signedIn, message.user ?? null);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    // Also fetch current auth state via response callback — handles the case
    // where the popup was closed during OAuth and has just reopened.
    chrome.runtime.sendMessage(
      { type: 'GET_AUTH_STATUS' },
      (response: MessageResponse<BGMessage>) => {
        if (chrome.runtime.lastError) return; // SW not yet awake — listener handles it
        if (response?.ok && response.data) {
          const data = response.data as Extract<BGMessage, { type: 'AUTH_STATUS' }>;
          if (data.type === 'AUTH_STATUS') {
            setAuth(data.signedIn, (data.user as UserProfile | undefined) ?? null);
          }
        }
      },
    );

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setAuth]);

  const signIn = () => {
    chrome.runtime.sendMessage({ type: 'AUTH_REQUEST' });
  };

  const signOut = () => {
    chrome.runtime.sendMessage({ type: 'AUTH_SIGN_OUT' });
  };

  return { signedIn, user, signIn, signOut };
}
