import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// ── Mock Firebase app (path used by services) ───────────────────────────────
const mockAuth = {
  currentUser: { uid: 'test-uid', email: 'test@test.com' },
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
};
const mockDb = {};

vi.mock('../services/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
  analytics: {},
  app: {},
}));

vi.mock('../services/firebase/config', () => ({
  auth: mockAuth,
  db: mockDb,
  analytics: {},
  default: {},
}));

// Legacy path (some imports may use ../firebase)
vi.mock('../firebase', () => ({
  db: mockDb,
  auth: mockAuth,
}));

// ── Mock Firebase Auth ───────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return vi.fn();
  }),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  updatePassword: vi.fn(),
}));

// ── Mock Firebase Firestore ──────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

// ── Mock Firebase Functions ──────────────────────────────────────────────────
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}));

// ── Mock Firebase Analytics ──────────────────────────────────────────────────
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
}));

// ── Mock Firebase App ───────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// ── Cleanup after each test ──────────────────────────────────────────────────
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
