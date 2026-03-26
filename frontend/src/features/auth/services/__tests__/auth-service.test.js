import {
  doCreateUserWithEmailAndPassword,
  doSignInWithEmailAndPassword,
  doSignOut,
  doPasswordReset,
} from '../auth-service';

/* ── Notes ─────────────────────────────────────────────────────────────────── *
 *  Firebase modules are globally mocked in src/test/setup.js.               *
 *  auth object is mocked as { currentUser, onAuthStateChanged, signOut }.   *
 * ────────────────────────────────────────────────────────────────────────── */

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../../services/firebase';

describe('auth-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createUserWithEmailAndPassword with auth, email, and password', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'new-uid' } });

    await doCreateUserWithEmailAndPassword('new@example.com', 'pass123');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'new@example.com',
      'pass123',
    );
  });

  it('should call signInWithEmailAndPassword with auth, email, and password', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'test-uid' } });

    await doSignInWithEmailAndPassword('test@example.com', 'pass');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'test@example.com',
      'pass',
    );
  });

  it('should propagate error when signIn rejects', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('auth/wrong-password'));

    await expect(doSignInWithEmailAndPassword('x@x.com', 'bad')).rejects.toThrow(
      'auth/wrong-password',
    );
  });

  it('should call auth.signOut when doSignOut is called', async () => {
    auth.signOut = vi.fn().mockResolvedValue(undefined);

    await doSignOut();

    expect(auth.signOut).toHaveBeenCalled();
  });
});
