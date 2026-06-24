// Patches console.error/warn before any module loads so Expo Go's
// red/yellow overlay never shows the expo-notifications SDK 53 removal message.
// This file must be the FIRST import in index.ts.
const _error = console.error.bind(console);
const _warn  = console.warn.bind(console);

const isNotifMsg = (msg: unknown) =>
  typeof msg === 'string' && msg.includes('expo-notifications');

console.error = (...args: unknown[]) => { if (!isNotifMsg(args[0])) _error(...args); };
console.warn  = (...args: unknown[]) => { if (!isNotifMsg(args[0])) _warn(...args);  };
