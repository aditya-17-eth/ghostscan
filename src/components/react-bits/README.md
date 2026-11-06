# React Bits Faulty Terminal

Source: https://reactbits.dev/r/FaultyTerminal-JS-TW.json

Component documentation: https://reactbits.dev/c/backgrounds/faulty-terminal

Retrieved 6 November 2026. Author: David Haz / React Bits. See LICENSE.md for the upstream MIT + Commons Clause terms. These terms apply to this component separately from GHOSTSCAN's own MIT-licensed code.

Local adaptation: move settingsRef assignment into an effect to comply with React's refs lint rule. The original shader and rendering behavior are retained. The host layers the canvas behind content, limits DPR to 1 for background cost, and applies an opacity/contrast overlay. Upstream implements reduced-motion behavior, offscreen/document visibility suspension and WebGL cleanup. No external network requests or runtime dependencies are added by this component.

The local cleanup also omits WEBGL_lose_context after deleting GPU resources, allowing React Strict Mode to initialize the same canvas context again. Verified WebGL error 0 and isContextLost false after development remount.
