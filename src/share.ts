export function buildShareLink(shareId: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#share=${shareId}`;
}

export function shareIdFromHash(hash: string): string | null {
  const prefix = "#share=";
  if (!hash.startsWith(prefix)) return null;
  const id = hash.slice(prefix.length).trim();
  return id || null;
}
