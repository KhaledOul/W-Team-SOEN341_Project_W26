import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const ENV_KEYS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

function clearFirebaseEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

function createMockAdmin({ apps = [] } = {}) {
  const mockCert = jest.fn((options) => ({ certOptions: options }));
  const mockInitializeApp = jest.fn();
  const mockAuth = jest.fn(() => 'mock-auth');
  const mockFirestore = jest.fn(() => 'mock-firestore');

  return {
    mockAdmin: {
      apps,
      credential: {
        cert: mockCert,
      },
      initializeApp: mockInitializeApp,
      auth: mockAuth,
      firestore: mockFirestore,
    },
    mockCert,
    mockInitializeApp,
    mockAuth,
    mockFirestore,
  };
}

async function loadFirebaseAdminModule(mockAdmin) {
  jest.resetModules();

  jest.unstable_mockModule('dotenv/config', () => ({}));
  jest.unstable_mockModule('firebase-admin', () => ({
    default: mockAdmin,
  }));

  return import('../src/firebaseAdmin.js');
}

describe('firebaseAdmin bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFirebaseEnv();
  });

  it('initializes with credential cert when env vars are present', async () => {
    process.env.FIREBASE_PROJECT_ID = 'project-id';
    process.env.FIREBASE_CLIENT_EMAIL = 'service-account@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'line-one\\nline-two';

    const {
      mockAdmin,
      mockCert,
      mockInitializeApp,
      mockAuth,
      mockFirestore,
    } = createMockAdmin();

    const module = await loadFirebaseAdminModule(mockAdmin);

    expect(mockCert).toHaveBeenCalledWith({
      projectId: 'project-id',
      clientEmail: 'service-account@example.com',
      privateKey: 'line-one\nline-two',
    });
    expect(mockInitializeApp).toHaveBeenCalledWith({
      credential: {
        certOptions: {
          projectId: 'project-id',
          clientEmail: 'service-account@example.com',
          privateKey: 'line-one\nline-two',
        },
      },
    });
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockFirestore).toHaveBeenCalledTimes(1);
    expect(module.adminAuth).toBe('mock-auth');
    expect(module.adminDb).toBe('mock-firestore');
  });

  it('initializes without credential options when env vars are missing', async () => {
    const {
      mockAdmin,
      mockCert,
      mockInitializeApp,
      mockAuth,
      mockFirestore,
    } = createMockAdmin();

    const module = await loadFirebaseAdminModule(mockAdmin);

    expect(mockCert).not.toHaveBeenCalled();
    expect(mockInitializeApp).toHaveBeenCalledWith(undefined);
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockFirestore).toHaveBeenCalledTimes(1);
    expect(module.adminAuth).toBe('mock-auth');
    expect(module.adminDb).toBe('mock-firestore');
  });

  it('skips initializeApp when a Firebase app already exists', async () => {
    const {
      mockAdmin,
      mockCert,
      mockInitializeApp,
      mockAuth,
      mockFirestore,
    } = createMockAdmin({ apps: [{}] });

    const module = await loadFirebaseAdminModule(mockAdmin);

    expect(mockCert).not.toHaveBeenCalled();
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockFirestore).toHaveBeenCalledTimes(1);
    expect(module.adminAuth).toBe('mock-auth');
    expect(module.adminDb).toBe('mock-firestore');
  });
});
