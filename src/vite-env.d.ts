/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: 'guest' | 'swa';
  readonly VITE_AI_MODE?: 'azure' | 'offline';
  /** SHA-256 hex digest of the admin password. Generate: echo -n "pw" | shasum -a 256 */
  readonly VITE_ADMIN_PASSWORD_HASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
