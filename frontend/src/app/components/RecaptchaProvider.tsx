// ==========================================
// HyperPush — reCAPTCHA v3 Provider
// Wraps GoogleReCaptchaProvider for login/register pages
// ==========================================

import { type ReactNode, useCallback } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';

/**
 * Top-level reCAPTCHA provider.
 * Only renders the provider if a VITE_RECAPTCHA_SITE_KEY is configured.
 */
export function RecaptchaProvider({ children }: { children: ReactNode }) {
  if (!RECAPTCHA_SITE_KEY) {
    // No site key configured — skip reCAPTCHA entirely
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      {children}
    </GoogleReCaptchaProvider>
  );
}

/**
 * Hook to execute reCAPTCHA and return a token.
 * Returns a no-op function if reCAPTCHA is not configured.
 */
export function useRecaptchaToken() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(
    async (action: string): Promise<string | undefined> => {
      if (!RECAPTCHA_SITE_KEY || !executeRecaptcha) {
        return undefined;
      }
      try {
        return await executeRecaptcha(action);
      } catch {
        // reCAPTCHA failed silently — let the request proceed without token
        return undefined;
      }
    },
    [executeRecaptcha],
  );

  return { getRecaptchaToken: getToken };
}
