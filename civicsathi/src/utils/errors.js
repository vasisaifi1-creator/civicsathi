// Turns Supabase / network errors into a short message in the user's language.
export function friendlyError(error, t) {
  if (!error) return t('err.generic');
  const message = String(error.message || error.error_description || '');
  const lower = message.toLowerCase();
  const code = error.code || error.status;

  if (
    (typeof navigator !== 'undefined' && navigator.onLine === false) ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  ) {
    return t('err.network');
  }
  if (error.code === 'SESSION_EXPIRED') return t('err.sessionExpired');
  if (lower.includes('invalid login credentials')) return t('err.invalidLogin');
  if (lower.includes('email not confirmed')) return t('err.emailNotConfirmed');
  if (lower.includes('already registered')) return t('err.userExists');
  if (lower.includes('rate limit') || code === 429) return t('err.rateLimit');
  if (lower.includes('same password')) return t('err.samePassword');
  // A sequence privilege problem is a server-side bug, not a user authorization failure.
  // Do not present it as "you do not have permission".
  if (lower.includes('permission denied for sequence')) {
    return t('err.submitFailed');
  }
  if (lower.includes('row-level security') || lower.includes('not authorized') || code === '42501') {
    return t('err.permission');
  }
  if (lower.includes('a reason is required')) return t('err.reasonRequired');
  if (lower.includes('already has this status')) return t('err.sameStatus');
  if (lower.includes('payload too large') || lower.includes('exceeded the maximum')) {
    return t('val.imageSize');
  }
  return message || t('err.generic');
}
