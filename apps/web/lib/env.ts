// Next.js inlines `NEXT_PUBLIC_*` vars into the browser bundle only when it
// sees a static `process.env.NEXT_PUBLIC_X` expression at build time — a
// dynamic `process.env[name]` lookup can't be found-and-replaced, so it
// silently evaluates to undefined client-side even though it works fine
// during server rendering (where process.env is real). Keep this access
// direct and static.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL');
}

export const env = { apiUrl };
