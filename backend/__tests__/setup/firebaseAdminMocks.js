import { jest } from '@jest/globals';

export const mockAdminAuth = {
  verifyIdToken: jest.fn(),
};

export const mockEntryRef = {
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

export const mockEntriesCollectionRef = {
  doc: jest.fn(() => mockEntryRef),
};

export const mockMealPlanDocRef = {
  collection: jest.fn(() => mockEntriesCollectionRef),
};

export const mockMealPlansCollectionRef = {
  doc: jest.fn(() => mockMealPlanDocRef),
};

export const mockAdminDb = {
  collection: jest.fn(() => mockMealPlansCollectionRef),
};

export function createSnapshot({ id = 'entry-1', exists = true, data = {} } = {}) {
  return {
    id,
    exists,
    data: jest.fn(() => data),
  };
}

export function queueEntrySnapshots(...snapshots) {
  mockEntryRef.get.mockReset();

  for (const snapshot of snapshots) {
    mockEntryRef.get.mockResolvedValueOnce(snapshot);
  }

  if (snapshots.length > 0) {
    mockEntryRef.get.mockResolvedValue(snapshots[snapshots.length - 1]);
  }
}

export function resetFirebaseAdminMocks() {
  jest.clearAllMocks();

  mockAdminAuth.verifyIdToken.mockResolvedValue({ uid: 'user-1', email: 'user@example.com' });

  mockAdminDb.collection.mockImplementation(() => mockMealPlansCollectionRef);
  mockMealPlansCollectionRef.doc.mockImplementation(() => mockMealPlanDocRef);
  mockMealPlanDocRef.collection.mockImplementation(() => mockEntriesCollectionRef);
  mockEntriesCollectionRef.doc.mockImplementation(() => mockEntryRef);

  queueEntrySnapshots(createSnapshot());
  mockEntryRef.update.mockResolvedValue(undefined);
  mockEntryRef.delete.mockResolvedValue(undefined);
}
