const STORAGE_KEY = 'novel_reading_history';
const MAX_HISTORY = 20;

export interface ReadingRecord {
  novelId: string;
  novelTitle: string;
  novelCover: string;
  novelAuthor: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  timestamp: number;
}

export function getHistory(): ReadingRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveProgress(record: Omit<ReadingRecord, 'timestamp'>) {
  const history = getHistory().filter(r => r.novelId !== record.novelId);
  const next: ReadingRecord[] = [
    { ...record, timestamp: Date.now() },
    ...history,
  ].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getNovelProgress(novelId: string): ReadingRecord | null {
  return getHistory().find(r => r.novelId === novelId) ?? null;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
