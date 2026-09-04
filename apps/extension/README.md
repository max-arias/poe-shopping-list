# Extension prototype

Run the reusable Vue side panel in a normal browser with seeded local mocks:

```sh
vp run ext:prototype
```

Vite serves the prototype at the URL it prints (normally `http://localhost:5173`).
The prototype uses in-memory storage, a sample trade-page message, and browser-tab
adapters; WXT entrypoints and the production extension commands are unchanged.
