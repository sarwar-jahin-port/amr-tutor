import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';
import { buildVerificationEmailHtml } from './templates/verification-email';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly brevo: BrevoClient;
  private readonly sender: { name: string; email: string };

  constructor(private readonly config: ConfigService) {
    this.brevo = new BrevoClient({ apiKey: this.config.getOrThrow<string>('BREVO_API_KEY') });
    this.sender = {
      name: this.config.getOrThrow<string>('BREVO_SENDER_NAME'),
      email: this.config.getOrThrow<string>('BREVO_SENDER_EMAIL'),
    };
  }

  /**
   * Never throws — a failed send shouldn't fail registration/resend. The
   * caller already has a "resend verification email" path for the user to
   * retry if this silently fails. Skips the real Brevo call under
   * NODE_ENV=test so the e2e suite's many registrations don't hit the
   * network with a placeholder API key.
   */
  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    if (this.config.get<string>('NODE_ENV') === 'test') {
      this.logger.debug(`Skipping verification email to ${to} in test environment.`);
      return;
    }

    try {
      await this.brevo.transactionalEmails.sendTransacEmail({
        subject: 'Verify your email address',
        htmlContent: buildVerificationEmailHtml(verifyUrl),
        sender: this.sender,
        to: [{ email: to }],
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
    }
  }
}
