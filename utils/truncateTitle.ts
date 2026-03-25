export function truncateTitle(prompt: string, max = 28) {
  const s = prompt.trim();
  if (!s) return "Percakapan Baru";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}