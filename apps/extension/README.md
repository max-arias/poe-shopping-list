# Extension prototype

Run the reusable Vue side panel in a normal browser with seeded local mocks:

```sh
vp run ext:prototype
```

Vite serves the prototype at the URL it prints (normally `http://localhost:5173`).
The prototype uses in-memory storage, a sample trade-page message, and browser-tab
adapters; WXT entrypoints and the production extension commands are unchanged.

For the read-only sidepanel design comparison, start the same server and open:

```text
http://localhost:5173/directions.html
```

It is also available through the repository convention:

```sh
vp run ext:prototype
```

The comparison page is a standalone, read-only mockup with self-contained CSS;
it does not change the production extension UI or behavior. Its five panels use
the same dark Trade Bench palette and remain constrained to a 360px side-panel
width for an honest comparison.
