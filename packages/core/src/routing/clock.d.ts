// The searches only read a monotonic millisecond clock for their timing fields (never for results).
// Core builds against ES2022 without the DOM lib, so declare the one global it uses.
declare const performance: { now(): number }
