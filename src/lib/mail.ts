import nodemailer from "nodemailer";
import { Resend } from "resend";

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
  sendPasswordReset(input: {
    email: string;
    userName: string;
    rawToken: string;
  }): Promise<SendEmailResult>;
}

const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const fromAddress = process.env.EMAIL_FROM ?? "noreply@example.com";

function verificationHtml(userName: string, url: string, expiresIn: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="background-color:#F0F4F8;font-family:'Inter',-apple-system,sans-serif;margin:0;padding:0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 24px">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px">
          <tr><td style="font-size:24px;font-weight:600;color:#0D1B2A;padding-bottom:16px">Verify your email</td></tr>
          <tr><td style="font-size:14px;line-height:1.6;color:#334155;padding-bottom:24px">Hi ${userName}, please verify your email address to access your SecureGate dashboard.</td></tr>
          <tr><td align="center" style="padding-bottom:24px">
            <a href="${url}" style="display:inline-block;background-color:#0EA5E9;color:#FFFFFF;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none">Verify Email Address</a>
          </td></tr>
          <tr><td style="font-size:12px;color:#64748B;padding-bottom:24px">This link expires in ${expiresIn}. If you did not create an account, you can safely ignore this email.</td></tr>
          <tr><td><hr style="border:none;border-top:1px solid #E2E8F0;margin-bottom:16px"></td></tr>
          <tr><td style="font-size:12px;color:#94A3B8;text-align:center">SecureGate — Secure Authentication System</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function passwordResetHtml(userName: string, url: string, expiresIn: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="background-color:#F0F4F8;font-family:'Inter',-apple-system,sans-serif;margin:0;padding:0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 24px">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px">
          <tr><td style="font-size:24px;font-weight:600;color:#0D1B2A;padding-bottom:16px">Reset your password</td></tr>
          <tr><td style="font-size:14px;line-height:1.6;color:#334155;padding-bottom:24px">Hi ${userName}, we received a request to reset your password.</td></tr>
          <tr><td align="center" style="padding-bottom:24px">
            <a href="${url}" style="display:inline-block;background-color:#0EA5E9;color:#FFFFFF;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none">Reset Password</a>
          </td></tr>
          <tr><td style="font-size:12px;color:#64748B;padding-bottom:24px">This link expires in ${expiresIn}. If you did not request a password reset, you can safely ignore this email.</td></tr>
          <tr><td><hr style="border:none;border-top:1px solid #E2E8F0;margin-bottom:16px"></td></tr>
          <tr><td style="font-size:12px;color:#94A3B8;text-align:center">SecureGate — Secure Authentication System</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

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
        html: verificationHtml(userName, `${baseUrl}/verify-email/${rawToken}`, "15 minutes"),
      });
      return { success: true };
    } catch (error) {
      console.error("[MAIL:VERIFICATION]", error);
      return { success: false, error: "Failed to send verification email." };
    }
  }

  async sendPasswordReset({
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
        subject: "Reset your password — SecureGate",
        html: passwordResetHtml(userName, `${baseUrl}/reset-password/${rawToken}`, "1 hour"),
      });
      return { success: true };
    } catch (error) {
      console.error("[MAIL:RESET]", error);
      return { success: false, error: "Failed to send reset email." };
    }
  }
}

class SmtpMailService implements MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
      },
    });
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
      await this.transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: "Verify your email — SecureGate",
        html: verificationHtml(userName, `${baseUrl}/verify-email/${rawToken}`, "15 minutes"),
      });
      return { success: true };
    } catch (error) {
      console.error("[MAIL:VERIFICATION]", error);
      return { success: false, error: "Failed to send verification email." };
    }
  }

  async sendPasswordReset({
    email,
    userName,
    rawToken,
  }: {
    email: string;
    userName: string;
    rawToken: string;
  }): Promise<SendEmailResult> {
    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: "Reset your password — SecureGate",
        html: passwordResetHtml(userName, `${baseUrl}/reset-password/${rawToken}`, "1 hour"),
      });
      return { success: true };
    } catch (error) {
      console.error("[MAIL:RESET]", error);
      return { success: false, error: "Failed to send reset email." };
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

  async sendPasswordReset({
    email,
    rawToken,
  }: {
    email: string;
    userName: string;
    rawToken: string;
  }): Promise<SendEmailResult> {
    const url = `${baseUrl}/reset-password/${rawToken}`;
    console.log(`[MAIL:RESET:STUB] to=${email} url=${url}`);
    return { success: true };
  }
}

const mailService: MailService = process.env.SMTP_HOST
  ? new SmtpMailService()
  : process.env.RESEND_API_KEY
    ? new ResendMailService(process.env.RESEND_API_KEY)
    : new ConsoleMailService();

export async function sendVerificationEmail(
  email: string,
  userName: string,
  rawToken: string
): Promise<SendEmailResult> {
  return mailService.sendVerification({ email, userName, rawToken });
}

export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  rawToken: string
): Promise<SendEmailResult> {
  return mailService.sendPasswordReset({ email, userName, rawToken });
}
