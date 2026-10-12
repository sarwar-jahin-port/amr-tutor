export interface PendingGoogleSignupPayload {
  purpose: 'google_signup';
  googleId: string;
  email: string;
  name?: string;
}
