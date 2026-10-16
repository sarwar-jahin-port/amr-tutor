/**
 * The access token lives in memory only, never in localStorage or a
 * readable cookie (blueprint Phase 3: "do not store long-lived
 * authentication tokens in browser local storage"). A plain module-level
 * variable — rather than React state — lets the API client read it
 * synchronously from outside the component tree.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
