# Workflow friction

- 2026-07-30 — A parallel specialist dispatch failed twice because the wrapper requires each `task` call's fields directly in `parameters`; nesting a second task object drops the required `prompt`. Prefer direct `task` calls or verify the wrapper schema before parallel dispatch.
