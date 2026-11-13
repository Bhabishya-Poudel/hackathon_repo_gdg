export interface SavedMatch {
  id: string;
  grantId: string;
  message: string;
  draft: string;
  savedAt: string;
}

const key = (userId: string) => `civictext.saved.${userId}`;
const EVENT = 'civictext:saved-changed';

export function getSaved(userId: string): SavedMatch[] {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as SavedMatch[]) : [];
  } catch {
    return [];
  }
}

function write(userId: string, items: SavedMatch[]) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function saveMatch(userId: string, item: Omit<SavedMatch, 'id' | 'savedAt'>): SavedMatch {
  const items = getSaved(userId);
  const existing = items.find((s) => s.grantId === item.grantId);
  if (existing) {
    existing.draft = item.draft;
    existing.message = item.message;
    write(userId, items);
    return existing;
  }
  const saved: SavedMatch = { ...item, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
  write(userId, [saved, ...items]);
  return saved;
}

export function removeMatch(userId: string, id: string) {
  write(userId, getSaved(userId).filter((s) => s.id !== id));
}

export function isSaved(userId: string, grantId: string): boolean {
  return getSaved(userId).some((s) => s.grantId === grantId);
}

export function onSavedChange(handler: () => void): () => void {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
