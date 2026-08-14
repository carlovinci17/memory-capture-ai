/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: 'guest' | 'swa';
  readonly VITE_AI_MODE?: 'azure' | 'offline';
  readonly VITE_APPINSIGHTS_CONNECTION_STRING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
