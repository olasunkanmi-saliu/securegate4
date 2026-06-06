/** @type {import('next').NextConfig} */

// 'unsafe-inline' for scripts is required by Next.js for its inline runtime bundles.
// A nonce-based CSP would require Next.js experimental nonce support and a server-side
// nonce generation middleware. This is a documented trade-off: without it, Next.js
// bootstrapping breaks. All user-supplied content is rendered server-side and escaped.
const SCRIPT_CSP =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; ${SCRIPT_CSP}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
