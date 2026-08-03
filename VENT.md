# Workflow friction

- 2026-07-30 — A parallel specialist dispatch failed twice because the wrapper requires each `task` call's fields directly in `parameters`; nesting a second task object drops the required `prompt`. Prefer direct `task` calls or verify the wrapper schema before parallel dispatch.
- 2026-08-03 — Root `web:*` scripts invoke `pnpm` directly, but this environment exposes it only through `corepack pnpm`; `corepack pnpm web:check` still fails inside the script. Run package-scoped commands with `corepack pnpm --filter @poe-sl/web <script>` or make the root scripts Corepack-safe.
