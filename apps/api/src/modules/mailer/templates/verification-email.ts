export function buildVerificationEmailHtml(verifyUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Confirm your email address</h2>
      <p>Thanks for signing up. Click the button below to verify your email address.</p>
      <p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; background: #1d4ed8; color: #fff; text-decoration: none; border-radius: 6px;">
          Verify email
        </a>
      </p>
      <p>Or paste this link into your browser:<br />${verifyUrl}</p>
      <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    </div>
  `;
}
