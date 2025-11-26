// This file provides type definitions for environment variables
// that are injected into the client-side code via Vite's `define` config.

// FIX: To resolve the "Cannot redeclare block-scoped variable 'process'" error,
// we must augment the global namespace instead of declaring a new `process` variable.
// This is because a `process` global is likely already defined by the TypeScript
// environment (e.g., via @types/node). Augmenting `NodeJS.ProcessEnv` correctly
// adds our custom environment variable to the existing type.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly API_KEY: string;
    }
  }
}

// Adding an empty export statement transforms this file into a module.
// This is crucial for `declare global` to work as expected and helps prevent
// unintended global scope pollution.
export {};