import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth?mode=login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
