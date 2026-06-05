import { redirect } from "next/navigation";

export default function LoginPage(): JSX.Element {
  redirect("/auth?mode=login");
}
