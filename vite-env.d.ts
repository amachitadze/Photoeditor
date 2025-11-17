/// <reference types="vite/client" />

// FIX: Replaced `declare var process` with an augmentation of `NodeJS.ProcessEnv`.
// This resolves the "Cannot redeclare block-scoped variable 'process'" error by merging
// with existing global type definitions instead of creating a conflicting declaration.
// This correctly types the `process.env.API_KEY` shimmed in `vite.config.ts`.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}
