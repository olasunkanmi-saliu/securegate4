import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth?mode=login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, emailVerified: true },
  });

  if (!user || !user.emailVerified) {
    redirect("/verify-email/please-verify");
  }

  return <DashboardContent userName={user.name} userEmail={user.email} />;
}
