// FIX: Corrected the type definition for `process.env` to prevent conflicts.
// The previous `declare var process` was overriding the Node.js global `process` type,
// which caused a "Cannot redeclare" error and broke type checking in `vite.config.ts`.
// Augmenting the existing `NodeJS.ProcessEnv` interface is the correct way to add
// environment variable types for client-side code without creating conflicts.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
