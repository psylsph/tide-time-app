// Base URL of the tide-data serverless function. In production (Netlify) this
// is served at `/.netlify/functions/tides`. Set `EXPO_PUBLIC_TIDES_API` to
// point at a different host during local development, e.g. when running the
// function via `netlify dev`.
//
// The cast keeps the strict type-checker happy: Expo merges its own global
// `process` declaration with @types/node's, producing an intersection type that
// tsc cannot resolve arbitrary keys on. (babel-preset-expo still inlines the
// literal `process.env.EXPO_PUBLIC_TIDES_API` at build time.)
const DEFAULT_ENDPOINT = '/.netlify/functions/tides';

const override = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_TIDES_API;

export const TIDES_ENDPOINT: string = override || DEFAULT_ENDPOINT;
