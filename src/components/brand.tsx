export function GhostSymbol({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M23 7H8v15m33-15h15v15M8 42v15h15m33-15v15H41" stroke="currentColor" strokeWidth="3.5"/><path d="m32 14 17 18-17 18-17-18 17-18Z" stroke="currentColor" strokeWidth="3"/><path d="M3 32h21m16 0h21" stroke="currentColor" strokeWidth="3"/><circle cx="32" cy="32" r="4" fill="currentColor"/></svg>;
}
