"use client";
import FaultyTerminal from "./react-bits/FaultyTerminal";

export function HeroTerminalBackground() {
  return <div className="hero-terminal-background" aria-hidden="true"><FaultyTerminal
    tint="#A7EF9E" glyphs="blocks" scale={1.5} digitSize={1.2}
    timeScale={0.5} brightness={0.75} glow={0.5} persistence={0.5}
    mouseStrength={0.5} mouseGlow={0.6} curvature={0.1} vignette={0.25}
    clickEffect="glitch" scramble={0.5} scanlineIntensity={0.5}
    glitchAmount={1} flickerAmount={1} noiseAmp={1} chromaticAberration={0}
    mouseReact pageLoadAnimation pause={false} lightMode={false}
    variation={undefined} dpr={1} style={{ width: "100%", height: "100%" }}
  /></div>;
}
