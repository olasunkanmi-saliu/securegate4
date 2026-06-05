import { redirect } from "next/navigation";

export default function ForgotPasswordPage(): JSX.Element {
  redirect("/auth?mode=forgot-password");
}
