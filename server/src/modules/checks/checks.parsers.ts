export type InputKind = 'phone' | 'username' | 'unknown';

export interface ParsedQuery {
  query: string;
  kind: InputKind;
}

const SPLIT = /[\n,;]+/;

function detectKind(query: string): InputKind {
  const value = query.startsWith('@') ? query.slice(1) : query;
  const phone = query.replace(/[^\d+]/g, '');
  if (/^\+?\d{7,15}$/.test(phone)) return 'phone';
  if (/^[A-Za-z]\w{3,31}$/.test(value)) return 'username';
  return 'unknown';
}

export function parseQueries(input: unknown): ParsedQuery[] {
  const source = Array.isArray(input) ? input.map(String) : [String(input ?? '')];
  const seen = new Set<string>();
  const items: ParsedQuery[] = [];
  for (const chunk of source) {
    for (const part of chunk.split(SPLIT)) {
      const query = part.trim();
      if (!query || query.length > 64) continue;
      const key = query.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ query, kind: detectKind(query) });
    }
  }
  return items;
}
