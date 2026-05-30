/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for OTCFlow API (no trailing slash). Defaults to `http://localhost:3000`. */
  readonly VITE_API_URL?: string;
  /** Optional WebSocket URL. Defaults to `ws:`/`wss:` + `/ws/deals` derived from `VITE_API_URL`. */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
