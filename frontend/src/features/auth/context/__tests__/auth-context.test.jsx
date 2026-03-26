import { render, screen, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthProvider, useAuth } from '../auth-context';

/* ── Firebase auth is globally mocked in src/test/setup.js ──────────────── */

/* ── Helper component to consume context ────────────────────────────────── */

function AuthConsumer() {
  const ctx = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(ctx?.loading ?? 'undefined')}</span>
      <span data-testid="user-logged-in">{String(ctx?.userLoggedIn ?? false)}</span>
      <span data-testid="user-email">{ctx?.currentUser?.email ?? 'none'}</span>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('AuthContext / useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide userLoggedIn=false initially when no user', async () => {
    // onAuthStateChanged mock calls callback with null (from setup.js)
    onAuthStateChanged.mockImplementation((authObj, cb) => {
      cb(null);
      return vi.fn();
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user-logged-in')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    });
  });

  it('should provide authenticated user after onAuthStateChanged fires with a user', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      providerData: [{ providerId: 'password' }],
    };

    onAuthStateChanged.mockImplementation((authObj, cb) => {
      cb(mockUser);
      return vi.fn();
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user-logged-in')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should set userLoggedIn=false after onAuthStateChanged fires with null (logged out)', async () => {
    onAuthStateChanged.mockImplementation((authObj, cb) => {
      cb(null);
      return vi.fn();
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user-logged-in')).toHaveTextContent('false');
    });
  });

  it('should unsubscribe from onAuthStateChanged on unmount', () => {
    const unsubscribe = vi.fn();
    onAuthStateChanged.mockImplementation((authObj, cb) => {
      cb(null);
      return unsubscribe;
    });

    const { unmount } = renderWithAuth();
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
