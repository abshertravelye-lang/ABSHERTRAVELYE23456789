/**
 * Sign-up now lives in the unified Auth screen (app/auth/login.tsx) as a
 * segmented tab. This route is kept for backward-compatible deep links /
 * existing `router.push('/auth/register')` calls and simply redirects to the
 * unified screen with the register tab pre-selected.
 */
import { Redirect } from 'expo-router';

export default function RegisterRedirect() {
  return <Redirect href="/auth/login?tab=register" />;
}
