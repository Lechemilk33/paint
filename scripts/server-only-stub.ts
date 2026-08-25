// The real `server-only` package throws unless it is resolved under React's
// react-server condition. The seed runs in plain Node, where that condition is
// not in play, so scripts/tsconfig.json points the import here instead. The
// guard still applies everywhere the app itself is built.
export {};
