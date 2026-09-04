/**
 * Best-effort caller IP from the proxy chain. Shared by every API route that
 * needs it (currently the contact route's spam-trap logging and the
 * leaderboard route's rate limit) so the header-parsing logic exists once.
 */
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
