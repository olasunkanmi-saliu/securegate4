import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  expiresIn,
}: PasswordResetEmailProps): JSX.Element {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Reset your password</Text>
          <Text style={paragraph}>
            Hi {userName}, we received a request to reset your password.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={footnote}>
            This link expires in {expiresIn}. If you did not request a password
            reset, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>SecureGate — Secure Authentication System</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#F0F4F8",
  fontFamily: "'Inter', -apple-system, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#0D1B2A",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#334155",
  marginBottom: "24px",
};

const buttonSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#0EA5E9",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: "500" as const,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
};

const footnote = {
  fontSize: "12px",
  color: "#64748B",
  marginBottom: "24px",
};

const hr = {
  borderColor: "#E2E8F0",
  marginBottom: "16px",
};

const footer = {
  fontSize: "12px",
  color: "#94A3B8",
  textAlign: "center" as const,
};
