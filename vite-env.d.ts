// FIX: The original reference to "vite/client" was causing a "Cannot find type definition" error.
// Since the application logic was updated to use `process.env.API_KEY` instead of `import.meta.env`,
// this reference is no longer needed. It has been replaced with a type declaration for `process.env`
// to ensure type safety for the API key access.
declare var process: {
  env: {
    API_KEY: string;
  };
};
