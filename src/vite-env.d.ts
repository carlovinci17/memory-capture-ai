/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: 'guest' | 'swa';
  readonly VITE_AI_MODE?: 'azure' | 'offline';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
