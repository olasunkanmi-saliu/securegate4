import { redirect } from "next/navigation";

export default function SignupPage(): JSX.Element {
  redirect("/auth?mode=signup");
}
