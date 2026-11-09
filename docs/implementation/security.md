# Authentication implementation

Nest owns authentication. The maintained [express-session middleware](https://expressjs.com/en/resources/middleware/session/) stores opaque sessions in PostgreSQL through connect-pg-simple; csrf-sync provides the session-bound synchronizer token. No JWT/localStorage session or public registration exists.

Passwords use node-argon2 Argon2id with 64 MiB memory, three iterations and parallelism one; the library generates salts. Owner setup accepts passwords only through a masked interactive terminal prompt. The database singleton constraint and an advisory transaction lock prevent a second owner. Recovery requires the existing email and invalidates every session.

After building the API, run `pnpm owner <your-email>` locally, or `pnpm owner <your-email> --recover` for recovery. Passwords are never accepted as command arguments. This project has received the owner's email, but no real account or password has been created automatically.

Session lifetime is seven days, absolute and non-rolling. Login regenerates the session identifier. Every private request checks the owner and session generation. Logout destroys the current PostgreSQL record; revoke-all and password changes advance the generation and remove stored sessions. The store prunes expired rows approximately every 15 minutes. An expired row is refused even before pruning.

Cookies are host-only, HttpOnly, SameSite=Lax and Path=/. HTTPS uses Secure and the `__Host-sarvin.sid` name. The deliberately configured localhost HTTP mode uses `sarvin.sid`. Startup rejects insecure cookies for non-loopback app origins. Set a random SESSION_SECRET (at least 32 characters); the example placeholder is rejected. Keep it out of browser variables and version control.

State-changing requests require both an exact allowed Origin and X-CSRF-Token from `/api/auth/csrf`. Refresh the CSRF token after login because session rotation invalidates the anonymous token. Requests are limited to 64 KiB. Login and password-change attempts are limited to 10 per IP per 15 minutes; anonymous auth calls also have a 120-request limit. The rate-limit store is in process for this single API instance; a restart resets counters. Horizontal scaling requires a shared limiter store and deployment review.

TRUST_PROXY defaults to loopback. Local Docker includes private networks because only Caddy can reach the unexposed API. Production must verify the actual network path and restrict trusted proxies to that topology. No CORS is enabled: browsers use the same-origin `/api` proxy. Public routes are health, liveness, CSRF bootstrap and login; health reveals only readiness status. Every response disables shared caching. Logs and exports must exclude passwords, cookies, session contents and CSRF tokens.

`pnpm test:auth` builds and tests the real HTTP stack in disposable PostgreSQL databases, both local HTTP and simulated HTTPS proxy mode. It verifies generic credential errors, rotation, persistence, expiry, logout, revoke-all, password change, CSRF/Origin rejection, cookie flags and rate limits. This is not a claim of real-domain TLS deployment.
