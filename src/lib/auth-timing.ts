/**
 * Min-duration padding for enumeration-defended endpoints.
 *
 * The goal: every response from /api/auth/signup, /api/verify-email/resend,
 * and /api/forgot-password should land at roughly the same wall-clock time
 * regardless of whether the email was found, already verified, or unknown.
 * Without this, response timing leaks user-existence even though the
 * response bodies are identical.
 *
 * Approach: capture a start timestamp at the top of the handler, do whatever
 * work the request needs (real or skip), then sleep the remainder of a fixed
 * window before returning. 1000ms covers a typical real-path on Vercel
 * (DB writes + Resend round-trip ≈ 500–900ms) with headroom. Outlier real
 * paths that exceed the target still leak slightly, but the dominant signal
 * is masked.
 */
const MIN_AUTH_RESPONSE_MS = 1000;

export async function padToMinDuration(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = MIN_AUTH_RESPONSE_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
