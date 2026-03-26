import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../login-page';

/* ── mocks ─────────────────────────────────────────────────────────────────── */

const mockSignIn = vi.fn();
const mockGoogleSignIn = vi.fn();

vi.mock('../../services/auth-service', () => ({
  doSignInWithEmailAndPassword: (...args) => mockSignIn(...args),
  doSignInWithGoogle: (...args) => mockGoogleSignIn(...args),
}));

const mockUseAuth = vi.fn();
vi.mock('../../context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

/* ── helpers ───────────────────────────────────────────────────────────────── */

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ userLoggedIn: false });
    mockSignIn.mockResolvedValue({});
  });

  it('should render email and password fields and a submit button', () => {
    renderLogin();

    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should have required attribute on email and password inputs', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should validate email input type for format enforcement', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should call doSignInWithEmailAndPassword with correct args on valid submit', async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should display a user-friendly error when login fails with auth/wrong-password', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
  });

  it('should disable the submit button while login is in progress', async () => {
    let resolveSignIn;
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      expect(submitBtn).toBeDisabled();
      expect(submitBtn.textContent).toMatch(/signing in/i);
    });

    resolveSignIn({});
  });
});
