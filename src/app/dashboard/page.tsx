import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { GENERIC_SERVER_ERROR } from "@/lib/constants";
import { db } from "@/lib/db";

import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth?mode=login");
  }

  let user;
  try {
    user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true, emailVerified: true },
    });
  } catch (error) {
    console.error("[DASHBOARD]", error);
    return <DashboardContent userName="" userEmail="" error={GENERIC_SERVER_ERROR} />;
  }

  if (!user) {
    redirect("/auth?mode=login");
  }

  if (!user.emailVerified) {
    redirect("/verify-email/please-verify");
  }

  return <DashboardContent userName={user.name} userEmail={user.email} />;
}
