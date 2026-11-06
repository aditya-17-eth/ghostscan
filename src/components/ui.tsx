import { ArrowUpRight, Check, Copy, LoaderCircle } from "lucide-react";
import { GhostSymbol } from "./brand";
import { useState } from "react";
export function Mark() { return <span className="brand-mark"><GhostSymbol /></span>; }
export function Spinner() { return <LoaderCircle size={16} className="spin" aria-hidden="true" />; }
export function CopyButton({ text, label = "Copy address" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return <button className="icon-button" aria-label={label} title={error ? "Clipboard unavailable" : copied ? "Copied" : label} onClick={async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setError(true); }
  }}>{copied ? <Check size={15} /> : <Copy size={15} />}<span className="sr-only" role="status">{error ? "Clipboard unavailable" : copied ? "Copied" : ""}</span></button>;
}
export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer noopener" className="external-link">{children}<ArrowUpRight size={13} /></a>;
}
export function humanDuration(ms: number) { return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`; }
export function shorten(text: string, length = 8) { return `${text.slice(0, length)}…${text.slice(-6)}`; }
