/// <reference types="vite/client" />

import type { AttributifyAttributes } from "unocss/dist/preset-attributify";

declare module "react" {
  /* eslint-disable-next-line @typescript-eslint/no-empty-interface */
  interface HTMLAttributes<T> extends AttributifyAttributes {}
}

declare global {
  /** Link to the CV PDF, or "" when public/resume/ has no file (set in vite.config.ts). */
  const __RESUME_URL__: string;
  /** The profile photo, or "" when public/profile/ has no file (set in vite.config.ts). */
  const __PHOTO_URL__: string;
}
