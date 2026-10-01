/** Technical input limits; product policy can be tightened before launch. */
export const PROFILE_LIMITS = { min: 2, max: 20 } as const;
export class InputError extends Error {}
export function safeReturnPath(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://kickx.invalid");
    if (url.origin !== "https://kickx.invalid" || /^\/(?:api|auth|login|onboarding)(?:\/|$)/.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
export function parseProfile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("입력 내용을 확인해 주세요.");
  const input = value as Record<string, unknown>;
  const nickname = typeof input.nickname === "string" ? input.nickname.normalize("NFC").trim() : "";
  if ([...nickname].length < PROFILE_LIMITS.min || [...nickname].length > PROFILE_LIMITS.max || !/^[\p{L}\p{N}_ -]+$/u.test(nickname))
    throw new InputError("닉네임은 2–20자의 문자, 숫자, 공백, 밑줄, 하이픈을 사용할 수 있습니다.");
  const team = input.team == null || input.team === "" ? null : input.team;
  if (team !== null && (typeof team !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(team)))
    throw new InputError("응원 구단을 다시 선택해 주세요.");
  return { nickname, team: team as string | null };
}
export function parseWatch(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("요청을 확인해 주세요.");
  const input = value as Record<string, unknown>;
  if (typeof input.playerId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.playerId) || typeof input.watched !== "boolean")
    throw new InputError("선수와 관심 상태를 확인해 주세요.");
  return { playerId: input.playerId, watched: input.watched };
}
export function isSameOrigin(origin: string | null, requestUrl: string) {
  try { return !!origin && new URL(origin).origin === new URL(requestUrl).origin; }
  catch { return false; }
}
