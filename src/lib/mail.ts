import { Resend } from "resend";

import { VerificationEmail } from "@/components/emails/VerificationEmail";

interface SendEmailResult {
  success: boolean;
  error?: string;
}

interface MailService {
  sendVerification(input: {
    email: string;
    userName: string;
    rawToken: string;
  }): Promise<SendEmailResult>;
}

const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const fromAddress = process.env.EMAIL_FROM ?? "noreply@example.com";

class ResendMailService implements MailService {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendVerification({
    email,
    userName,
    rawToken,
  }: {
    email: string;
    userName: string;
    rawToken: string;
  }): Promise<SendEmailResult> {
    try {
      await this.client.emails.send({
        from: fromAddress,
        to: email,
        subject: "Verify your email — SecureGate",
        react: VerificationEmail({
          userName,
          verificationUrl: `${baseUrl}/verify-email/${rawToken}`,
          expiresIn: "15 minutes",
        }),
      });
      return { success: true };
    } catch (error) {
      console.error("[MAIL:VERIFICATION]", error);
      return { success: false, error: "Failed to send verification email." };
    }
  }
}

class ConsoleMailService implements MailService {
  async sendVerification({
    email,
    rawToken,
  }: {
    email: string;
    userName: string;
    rawToken: string;
  }): Promise<SendEmailResult> {
    const url = `${baseUrl}/verify-email/${rawToken}`;
    console.log(`[MAIL:VERIFICATION:STUB] to=${email} url=${url}`);
    return { success: true };
  }
}

const mailService: MailService = process.env.RESEND_API_KEY
  ? new ResendMailService(process.env.RESEND_API_KEY)
  : new ConsoleMailService();

export async function sendVerificationEmail(
  email: string,
  userName: string,
  rawToken: string
): Promise<SendEmailResult> {
  return mailService.sendVerification({ email, userName, rawToken });
}
