export interface QueuedUpload {
  id: string;
  file: File;
  queuedAt: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

const DB_NAME = 'SecureShareOfflineQueue';
const STORE_NAME = 'uploads';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export const initOfflineQueue = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB init error:', event);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const enqueueUpload = async (file: File): Promise<QueuedUpload> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const queuedUpload: QueuedUpload = {
      id: crypto.randomUUID(),
      file,
      queuedAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(queuedUpload);

    request.onsuccess = () => resolve(queuedUpload);
    request.onerror = () => reject(request.error);
  });
};

export const getQueuedUploads = async (): Promise<QueuedUpload[]> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const updateQueuedUpload = async (upload: QueuedUpload): Promise<void> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(upload);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const removeQueuedUpload = async (id: string): Promise<void> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearQueuedUploads = async (): Promise<void> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
