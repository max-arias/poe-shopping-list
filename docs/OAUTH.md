# OAuth Implementation Guide — PoE Shopping List

This document covers everything needed to implement PoE OAuth login in the extension (Flow G). It includes the official PoE OAuth spec, why we use the approach we do, the exact flow architecture, implementation code, and security rationale.

---

## Table of Contents

1. [PoE OAuth 2.1 Reference](#1-poe-oauth-21-reference)
2. [Extension Client Type — Why Public Client](#2-extension-client-type--why-public-client)
3. [Why We Don't Use `chrome.identity`](#3-why-we-dont-use-chromeidentity)
4. [Architecture Overview](#4-architecture-overview)
5. [The PKCE Algorithm](#5-the-pkce-algorithm)
6. [The `state` Trick — Passing the Verifier to the Worker](#6-the-state-trick--passing-the-verifier-to-the-worker)
7. [Full Flow Step-by-Step](#7-full-flow-step-by-step)
8. [Worker Changes Required](#8-worker-changes-required)
9. [Extension Implementation — `background.ts`](#9-extension-implementation--backgroundts)
10. [Session JWT vs PoE Token — The Distinction](#10-session-jwt-vs-poe-token--the-distinction)
11. [Token Refresh Strategy](#11-token-refresh-strategy)
12. [Firefox Compatibility](#12-firefox-compatibility)
13. [Security Considerations](#13-security-considerations)
14. [Pre-Launch Checklist](#14-pre-launch-checklist)

---

## 1. PoE OAuth 2.1 Reference

Source: https://www.pathofexile.com/developer/docs/authorization

### Authorization Server

Base URL: `https://www.pathofexile.com`

| Endpoint | Purpose |
|---|---|
| `GET /oauth/authorize` | User consent page |
| `POST /oauth/token` | Code exchange, token refresh |
| `POST /oauth/token/revoke` | Revoke a token (requires `oauth:revoke` scope) |
| `POST /oauth/token/introspect` | Validate a token (requires `oauth:introspect` scope) |

### Client Types

| Property | Confidential | Public |
|---|---|---|
| Typical host | Backend server | Desktop app, browser extension |
| Can store secret | Yes | **No** |
| Grant types | All | **Auth Code + PKCE only** |
| Access token TTL | 28 days | **10 hours** |
| Refresh token TTL | 90 days | **7 days** |
| Rate limits | Per-client | Shared across all public clients |
| Service scopes | Yes | **No** |
| User-visible warning | No | **Yes** ("this app may not be safe") |

### Scopes

| Scope | Access |
|---|---|
| `account:profile` | Account name, UUID — **all we need** |
| `account:leagues` | Private leagues list |
| `account:stashes` | Stash contents |
| `account:characters` | Characters + inventory |
| `account:league_accounts` | Atlas passive allocations |
| `account:item_filter` | Manage item filters |
| `service:*` | Confidential clients only — not available to extensions |

We only request **`account:profile`**. This is the minimum scope that gives us the account `username` and `sub` (UUID) needed to verify ownership of published lists.

### Token Response Shape

```json
{
  "access_token": "TOKEN_STRING",
  "expires_in": 36000,
  "token_type": "bearer",
  "scope": "account:profile",
  "username": "AccountName",
  "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "refresh_token": "REFRESH_TOKEN"
}
```

`expires_in` is in seconds. For public clients = `36000` (10 hours).

### Error Codes

- `401` — Token expired or revoked; prompt re-login
- `403` — Insufficient scope for the requested resource
- Auth code redirect errors follow RFC 6749 §4.1.2.1 (error in query string)

### Authorization Code Expiry

**Authorization codes expire in 30 seconds.** The Worker must exchange the code immediately upon receiving the callback.

### Token Storage Requirements (from PoE docs)

> "Access tokens can be stored client-side (cookies/localStorage) if transmitted over HTTPS."  
> "Refresh tokens **must always be stored in a secure manner server-side.**"

This is the primary architectural constraint — it means refresh tokens cannot live in `browser.storage.local`. They must stay in our Cloudflare Worker's KV store.

---

## 2. Extension Client Type — Why Public Client

A browser extension **cannot be a confidential client** because:

1. Extension source code is readable by anyone who installs it or downloads the `.crx`/`.xpi`
2. `chrome.storage` is not secure storage — it's accessible to any code in the extension context
3. There is no trusted execution environment in a browser extension

Therefore, we register as a **public client** with no `client_secret`. The PKCE flow compensates for the lack of a secret by proving that the party that initiated the authorization is the same party completing the token exchange (the code verifier/challenge binding).

Public client limitations we accept:
- 10h access token TTL → handled by Worker-issued session JWT with its own TTL and refresh mechanism
- 7-day refresh token TTL → Worker refreshes before expiry; user re-auths if they go >7 days without opening the extension
- Shared rate limits → fine; we request one token per user login, not per API call
- Auth warning shown to users → document this in onboarding ("PoE may show a warning — this is expected for third-party extensions")

### Redirect URI for a Public Client

The PoE docs mention `http://127.0.0.1:PORT/callback` as a local redirect URI option for public clients (desktop apps). **We do not use this.** We use our Cloudflare Worker as the redirect target instead, because:

1. `127.0.0.1` loopback requires binding a local HTTP server — complex in a service worker, unreliable
2. Our Worker approach centralizes token exchange server-side, which is where the refresh token must live anyway
3. Using `https://<worker>/auth/callback` as redirect URI is valid for public clients when registered

The Worker's domain must be registered as the redirect URI in the PoE developer portal before OAuth can be tested.

---

## 3. Why We Don't Use `chrome.identity`

`chrome.identity.launchWebAuthFlow()` is Chrome's built-in OAuth helper. We deliberately avoid it because:

1. **Chrome-only** — `browser.identity` is not available in Firefox; WXT targets both
2. **Requires Google OAuth** registration for Google-hosted redirect URIs (`*.chromiumapp.org`) — PoE's OAuth server would need to allowlist that, which we can't guarantee
3. **No control over the redirect** — Chrome intercepts the redirect URL, which means we can't run any server-side logic (token exchange, refresh token storage) before the extension sees the response
4. **No refresh token server storage** — `launchWebAuthFlow` hands everything to the extension; we'd need to store the PoE refresh token in `browser.storage`, violating the PoE docs requirement

Our approach — opening a tab manually and watching for the callback via `tabs.onUpdated` — works identically in Chrome and Firefox and keeps the refresh token server-side.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Extension (WXT)                                                     │
│                                                                      │
│  background.ts                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 1. generatePKCE() → { verifier, challenge }                   │  │
│  │ 2. chrome.tabs.create({ url: authUrl })                       │  │
│  │ 3. tabs.onUpdated → watch for /auth/success?token=            │  │
│  │ 4. extract JWT → store in local:auth:v1                       │  │
│  │ 5. chrome.tabs.remove(authTabId)                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTPS tab navigation
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  pathofexile.com/oauth/authorize                                     │
│  (user clicks "Authorize")                                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  302 redirect with code + state
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Cloudflare Worker  GET /auth/callback                               │
│                                                                      │
│  1. Decode verifier from state param                                 │
│  2. POST /oauth/token (code + verifier) → PoE access + refresh      │
│  3. GET account profile → { username, sub }                         │
│  4. UPSERT authors table (poe_account_id = sub)                     │
│  5. KV.put(`refresh:${sub}`, refresh_token, { expirationTtl: 7d }) │
│  6. Sign session JWT { poeAccountId, displayName, exp: +24h }       │
│  7. 302 → https://<website>/auth/success?token=<jwt>                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  tab navigates to /auth/success
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Website  /auth/success                                              │
│  (static page — just surfaces the token in the URL for the         │
│   extension to detect; no JS needed)                                │
└─────────────────────────────────────────────────────────────────────┘
```

The extension **never sees the PoE access token or refresh token**. It only ever holds our own session JWT. All PoE API calls that require auth go through the Worker.

---

## 5. The PKCE Algorithm

PKCE (RFC 7636) replaces the client secret for public clients. The extension proves that the entity completing the token exchange is the same one that initiated the authorization.

```
code_verifier  = base64url( crypto.getRandomValues(new Uint8Array(32)) )
code_challenge = base64url( SHA-256( ASCII(code_verifier) ) )
```

`base64url` = standard base64 with `+`→`-`, `/`→`_`, and `=` padding stripped.

Implementation in `background.ts`:

```ts
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(array);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  return { verifier, challenge };
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
```

`crypto.subtle` and `crypto.getRandomValues` are available in both Chrome MV3 service workers and Firefox background scripts. No external library needed.

---

## 6. The `state` Trick — Passing the Verifier to the Worker

The Worker needs the `code_verifier` to complete the token exchange, but it has no shared state with the extension. We pass it through the `state` parameter:

```ts
// Extension generates:
const { verifier, challenge } = await generatePKCE();
const state = btoa(verifier); // base64-encode the verifier into state

// Authorization URL:
const authUrl = new URL("https://www.pathofexile.com/oauth/authorize");
authUrl.searchParams.set("client_id",              CLIENT_ID);
authUrl.searchParams.set("response_type",          "code");
authUrl.searchParams.set("scope",                  "account:profile");
authUrl.searchParams.set("state",                  state);
authUrl.searchParams.set("redirect_uri",           WORKER_CALLBACK_URL);
authUrl.searchParams.set("code_challenge",         challenge);
authUrl.searchParams.set("code_challenge_method",  "S256");
```

```ts
// Worker receives /auth/callback?code=XXX&state=YYY
const verifier = atob(url.searchParams.get("state")!);
// Exchange:
body.append("code_verifier", verifier);
```

**Security note:** The `state` param is transmitted over HTTPS and only ever reaches our own Worker. An attacker who intercepted the authorization code would also need the verifier to exchange it — the PKCE binding holds. The PoE docs say to check `state` matches a stored value; since we're encoding the verifier in `state`, the binding is implicit (Worker only accepts states it can decode as valid base64).

If stricter CSRF protection is needed, the extension can also store a random `nonce` alongside the verifier in memory and include it in the state: `state = base64url(JSON.stringify({ verifier, nonce }))`.

---

## 7. Full Flow Step-by-Step

```
Extension background.ts                  Worker                     PoE
─────────────────────────────────────────────────────────────────────────

1. User clicks "Login with PoE"
2. generatePKCE() → { verifier, challenge }
3. state = btoa(verifier)
4. Build authUrl (see §6)
5. tabId = chrome.tabs.create({ url: authUrl })
6. Register tabs.onUpdated listener (keyed to tabId)

                                                        7. User sees PoE consent page
                                                        8. User clicks Authorize
                                                        9. PoE 302 → /auth/callback?code=XXX&state=state

                                         10. GET /auth/callback received
                                         11. verifier = atob(state)
                                         12. POST /oauth/token {
                                               client_id, grant_type=authorization_code,
                                               code=XXX, redirect_uri, code_verifier=verifier
                                             }
                                                        13. PoE returns {
                                                              access_token, refresh_token,
                                                              username, sub
                                                            }
                                         14. GET https://api.pathofexile.com/profile
                                             Authorization: Bearer access_token
                                         15. { uuid, name } → UPSERT authors
                                         16. KV.put("refresh:" + sub, refresh_token, 7d TTL)
                                         17. Sign session JWT {
                                               poeAccountId: sub,
                                               displayName: name,
                                               exp: now + 24h
                                             }
                                         18. 302 → https://<website>/auth/success?token=<jwt>

19. tabs.onUpdated fires: url starts with /auth/success
20. jwt = new URL(tab.url).searchParams.get("token")
21. Validate JWT (exp check)
22. storage.setItem("local:auth:v1", { token: jwt, poeAccountId, displayName, exp })
23. chrome.tabs.remove(tabId)
24. Notify sidepanel → update UI (show "Logged in as <name>", enable Publish)
```

---

## 8. Worker Changes Required

### New: KV Namespace

Create a KV namespace `POE_REFRESH_TOKENS` in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "REFRESH_TOKENS"
id      = "<kv-namespace-id>"
```

### Modified: `GET /auth/callback`

```ts
// Existing: exchanges code, issues JWT, returns slug
// Add:
//   1. Decode verifier from state param
//   2. Include code_verifier in token exchange body (no client_secret for public client)
//   3. Store refresh_token in KV with 7-day TTL
//   4. Redirect to /auth/success?token=<jwt> instead of returning JSON

const verifier = atob(state); // decode verifier
const body = new URLSearchParams({
  client_id:    env.POE_CLIENT_ID,
  grant_type:   "authorization_code",
  code,
  redirect_uri: env.WORKER_URL + "/auth/callback",
  code_verifier: verifier,
  // NO client_secret — public client
});
const tokenRes = await fetch("https://www.pathofexile.com/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});
const { access_token, refresh_token, username, sub } = await tokenRes.json();

// Store refresh token server-side (required by PoE docs)
await env.REFRESH_TOKENS.put(`refresh:${sub}`, refresh_token, {
  expirationTtl: 7 * 24 * 60 * 60, // 7 days in seconds
});

// UPSERT author record
// ... existing D1 logic ...

// Issue our own session JWT
const sessionJwt = await signJwt({ poeAccountId: sub, displayName: username }, env.JWT_SECRET);

// Redirect (extension tab detects this URL)
return Response.redirect(`${env.WEBSITE_URL}/auth/success?token=${sessionJwt}`, 302);
```

### New: `POST /auth/refresh`

Called by extension when session JWT is within 1h of expiry.

```ts
// Verify incoming session JWT, extract poeAccountId
// Look up refresh_token from KV
// POST /oauth/token with grant_type=refresh_token
// Store new refresh_token (old one is immediately invalidated)
// Issue new session JWT, return it
```

### New: `POST /auth/revoke`

Called by extension on logout.

```ts
// Verify session JWT
// Look up refresh_token from KV
// POST /oauth/token/revoke (if we have oauth:revoke scope — otherwise just delete from KV)
// Delete KV entry
// Return 200
```

---

## 9. Extension Implementation — `background.ts`

### Tab Detection Pattern

```ts
let authTabId: number | null = null;

async function startOAuthFlow() {
  const { verifier, challenge } = await generatePKCE();
  const state = btoa(verifier);

  const authUrl = new URL("https://www.pathofexile.com/oauth/authorize");
  authUrl.searchParams.set("client_id",             import.meta.env.VITE_POE_CLIENT_ID);
  authUrl.searchParams.set("response_type",         "code");
  authUrl.searchParams.set("scope",                 "account:profile");
  authUrl.searchParams.set("state",                 state);
  authUrl.searchParams.set("redirect_uri",          import.meta.env.VITE_API_BASE + "/auth/callback");
  authUrl.searchParams.set("code_challenge",        challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const tab = await browser.tabs.create({ url: authUrl.toString() });
  authTabId = tab.id ?? null;
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== authTabId) return;
  if (changeInfo.status !== "complete") return;
  if (!tab.url?.startsWith(import.meta.env.VITE_WEBSITE_URL + "/auth/success")) return;

  const jwt = new URL(tab.url).searchParams.get("token");
  if (!jwt) return;

  // Decode payload (no need to verify signature in extension — Worker already signed it)
  const payload = JSON.parse(atob(jwt.split(".")[1]));

  await storage.setItem("local:auth:v1", {
    token:         jwt,
    poeAccountId:  payload.poeAccountId,
    displayName:   payload.displayName,
    exp:           payload.exp,
  });

  await browser.tabs.remove(tabId);
  authTabId = null;

  // Notify all sidepanel instances to refresh auth state
  browser.runtime.sendMessage({ type: "auth:updated" }).catch(() => {});
});
```

### Wiring to message handler

```ts
// Inside defineBackground's message listener:
if (msg.type === "auth:login") {
  await startOAuthFlow();
  return;
}
if (msg.type === "auth:logout") {
  await storage.removeItem("local:auth:v1");
  // Optional: call Worker /auth/revoke
  browser.runtime.sendMessage({ type: "auth:updated" }).catch(() => {});
  return;
}
```

### Handling tab closed by user mid-flow

```ts
browser.tabs.onRemoved.addListener((tabId) => {
  if (tabId === authTabId) {
    authTabId = null;
    // Optionally notify UI that login was cancelled
  }
});
```

---

## 10. Session JWT vs PoE Token — The Distinction

| Property | PoE Access Token | Our Session JWT |
|---|---|---|
| Issued by | pathofexile.com | Our Cloudflare Worker |
| Stored in | Worker KV (refresh) | `browser.storage.local` |
| TTL | 10 hours | 24 hours (configurable) |
| What it proves | User authorized our PoE app | User logged into our service |
| Used for | Worker → PoE API calls | Extension → Worker API calls |
| Seen by extension | Never | Yes |

The extension authenticates to our Worker using the session JWT. The Worker authenticates to PoE using the PoE access token (refreshing via KV-stored refresh token as needed). The two auth layers are fully independent. If a user's PoE tokens expire or are revoked, the session JWT remains valid until its own expiry — but the next publish or ownership check would fail with a 401 from PoE, and the Worker would propagate that back.

---

## 11. Token Refresh Strategy

### PoE Token Refresh (Worker-side, invisible to extension)

The Worker refreshes the PoE access token opportunistically — either before it expires (if the Worker tracks expiry in KV) or on a 401 from PoE. Since the PoE refresh token has a 7-day TTL, a user who doesn't use the extension for 7 days will need to re-authenticate.

```ts
// In Worker, before calling PoE API:
async function getPoeAccessToken(poeAccountId: string, env: Env): Promise<string> {
  // If we stored access_token + its expiry in KV, check it first
  const cached = await env.REFRESH_TOKENS.get(`access:${poeAccountId}`, "json");
  if (cached && cached.exp > Date.now() / 1000 + 300) return cached.token;

  // Otherwise refresh
  const refreshToken = await env.REFRESH_TOKENS.get(`refresh:${poeAccountId}`);
  if (!refreshToken) throw new Error("No refresh token — user must re-authenticate");

  const res = await fetch("https://www.pathofexile.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     env.POE_CLIENT_ID,
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const { access_token, refresh_token: newRefresh, expires_in } = await res.json();

  // Store new refresh token (old one is now invalid)
  await env.REFRESH_TOKENS.put(`refresh:${poeAccountId}`, newRefresh, {
    expirationTtl: 7 * 24 * 60 * 60,
  });
  // Cache access token
  await env.REFRESH_TOKENS.put(`access:${poeAccountId}`, JSON.stringify({
    token: access_token,
    exp:   Math.floor(Date.now() / 1000) + expires_in,
  }), { expirationTtl: expires_in });

  return access_token;
}
```

### Session JWT Refresh (Extension → Worker)

Extension checks JWT expiry before any authenticated action:

```ts
function isJwtExpiringSoon(session: AuthSession): boolean {
  return session.exp - Date.now() / 1000 < 3600; // within 1 hour
}

async function getValidSession(): Promise<AuthSession | null> {
  const session = await storage.getItem<AuthSession>("local:auth:v1");
  if (!session) return null;
  if (session.exp < Date.now() / 1000) return null; // expired
  if (isJwtExpiringSoon(session)) {
    // Refresh in background
    refreshSession(session).catch(() => {});
  }
  return session;
}
```

---

## 12. Firefox Compatibility

WXT handles the `chrome.*` vs `browser.*` namespace difference via `@wxt-dev/browser`. The OAuth flow itself is identical on both browsers:

| Step | Chrome | Firefox |
|---|---|---|
| PKCE generation | `crypto.subtle` (service worker) | `crypto.subtle` (background script) |
| Tab creation | `browser.tabs.create()` | `browser.tabs.create()` |
| Tab URL watching | `browser.tabs.onUpdated` | `browser.tabs.onUpdated` |
| Tab removal | `browser.tabs.remove()` | `browser.tabs.remove()` |
| Token storage | `browser.storage.local` | `browser.storage.local` |

Firefox MV2 background scripts are persistent (not service workers) so there's no concern about service worker lifecycle interrupting the tab watch. For Chrome MV3 service workers:

- **The service worker may be terminated** between `tabs.create()` and the user completing auth (if they take more than ~30 seconds before the SW idles). The `tabs.onUpdated` listener is re-registered on SW wake, but `authTabId` (in-memory) is lost.
- **Mitigation**: Persist `authTabId` to `sessionStorage` or `chrome.storage.session` before the SW can idle.

```ts
// Persist across SW restarts:
async function setAuthTab(tabId: number) {
  authTabId = tabId;
  await chrome.storage.session.set({ authTabId: tabId });
}

// On SW startup, restore:
const { authTabId: stored } = await chrome.storage.session.get("authTabId");
if (stored) authTabId = stored;
```

`chrome.storage.session` is Chrome MV3 only. For Firefox (MV2, persistent background), in-memory is fine.

---

## 13. Security Considerations

### PKCE Binding
The verifier/challenge pair ensures that even if an attacker intercepts the authorization code (e.g., via a malicious redirect), they cannot exchange it without the verifier. The extension generates the verifier; it travels to the Worker in `state`; the Worker uses it in the exchange. No one else can complete the exchange.

### Refresh Token Never Leaves the Server
Storing the PoE refresh token in `browser.storage.local` would violate both the PoE ToS requirement and security best practice (extensions can be compromised via XSS in content scripts). Keeping it in Cloudflare KV means compromise of the extension still doesn't leak the refresh token.

### Session JWT in `browser.storage.local`
The PoE docs allow access tokens in `localStorage` if transmitted over HTTPS. Our session JWT is functionally equivalent — it's short-lived (24h) and scoped to our own Worker. If it leaks, the attacker can call our Worker but cannot call PoE APIs directly (they don't have the PoE access token).

### State Parameter
We encode the verifier in `state`. This is acceptable because:
- `state` is transmitted over HTTPS between extension, PoE, and our Worker
- The verifier alone does not grant access — it only completes the PKCE exchange for a specific, one-time-use auth code

### Auth Code 30-Second Window
The PoE auth code expires in 30 seconds. Our Worker performs the exchange server-side as the first action in the callback handler. There is no user interaction or additional network round-trip between code receipt and exchange. This window is comfortably achievable.

### Logout
On logout, the extension removes `local:auth:v1`. It should also call `POST /auth/revoke` so the Worker can remove the refresh token from KV. Without this, the KV entry persists until its 7-day TTL, which is acceptable but non-ideal.

---

## 14. Pre-Launch Checklist

### PoE Developer Portal (one-time setup)

- [ ] Register at https://www.pathofexile.com/developer/docs — create a new application
- [ ] Set **client type** = **public** (no secret)
- [ ] Register **redirect URI** = `https://<worker-domain>/auth/callback`
- [ ] Copy the issued `client_id` → `VITE_POE_CLIENT_ID` env var

### Cloudflare Worker

- [ ] Create KV namespace `POE_REFRESH_TOKENS`, add binding in `wrangler.toml`
- [ ] `wrangler secret put JWT_SECRET` (if not already done)
- [ ] Add `POE_CLIENT_ID` to Worker env (plain env var, not secret)
- [ ] Implement modified `GET /auth/callback` (decode state, no client_secret, store refresh_token)
- [ ] Implement `POST /auth/refresh` route
- [ ] Implement `POST /auth/revoke` route
- [ ] Deploy and verify the redirect URI resolves

### Website

- [ ] Add static `/auth/success` page — renders "Logging you in…" and nothing else (the extension reads `?token=` from the URL and closes the tab)

### Extension

- [ ] Implement `generatePKCE()` + `base64url()` in background
- [ ] Implement `startOAuthFlow()` (tab create + URL build)
- [ ] Add `tabs.onUpdated` listener with success URL detection
- [ ] Add `tabs.onRemoved` listener for user-cancelled flow
- [ ] Persist `authTabId` to `chrome.storage.session` for Chrome MV3 SW restarts
- [ ] Wire `auth:login` + `auth:logout` messages
- [ ] Wire `getValidSession()` + proactive JWT refresh
- [ ] Update `PublishSheet.vue` — read session from `useAuth()`, show "Login to publish" when unauthenticated, send Bearer token in publish request
- [ ] Update `ChromeBar.vue` / `SettingsPopover.vue` — show account name + Logout button when authenticated

### Testing

- [ ] Full happy-path: login → name appears → publish succeeds
- [ ] Tab closed by user mid-flow — no crash, UI stays consistent
- [ ] Session JWT expiry — re-login prompt on next publish
- [ ] PoE refresh token expiry (>7 days idle) — graceful re-auth prompt
- [ ] Logout — clears session, disables Publish
- [ ] Firefox: same flow without `chrome.storage.session`
