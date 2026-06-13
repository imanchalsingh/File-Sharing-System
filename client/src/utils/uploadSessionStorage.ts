const STORAGE_KEY = "resumableUploadSessions";

export interface StoredUploadSession {
  sessionId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  totalChunks: number;
  chunkSizeBytes: number;
  receivedChunks: number[];
  uploadedBytes: number;
  status: string;
  lastUpdated: string;
}

export function loadStoredSessions(): StoredUploadSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSession(session: StoredUploadSession) {
  const sessions = loadStoredSessions().filter((s) => s.sessionId !== session.sessionId);
  sessions.unshift({ ...session, lastUpdated: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
}

export function removeStoredSession(sessionId: string) {
  const sessions = loadStoredSessions().filter((s) => s.sessionId !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getStoredSession(sessionId: string): StoredUploadSession | undefined {
  return loadStoredSessions().find((s) => s.sessionId === sessionId);
}
