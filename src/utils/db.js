const DB_NAME = 'TripItineraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'itineraries';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject(e.target.error);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllTrips = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const trips = request.result || [];
      // Sort by updatedAt desc
      trips.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      resolve(trips);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveTrip = async (trip) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const tripToSave = {
      ...trip,
      updatedAt: Date.now()
    };
    const request = store.put(tripToSave);
    request.onsuccess = () => resolve(tripToSave);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTrip = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
