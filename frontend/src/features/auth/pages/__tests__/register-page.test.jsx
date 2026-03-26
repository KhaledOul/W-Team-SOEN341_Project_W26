import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../register-page';

/* ── mocks ─────────────────────────────────────────────────────────────────── */

const mockRegister = vi.fn();

vi.mock('../../services/auth-service', () => ({
  doCreateUserWithEmailAndPassword: (...args) => mockRegister(...args),
}));

const mockUseAuth = vi.fn();
vi.mock('../../context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

/* ── helpers ───────────────────────────────────────────────────────────────── */

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

const getPasswordInputs = () => {
  const allPwInputs = document.querySelectorAll('input[type="password"]');
  return { password: allPwInputs[0], confirmPassword: allPwInputs[1] };
};

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ userLoggedIn: false });
    mockRegister.mockResolvedValue({});
  });

  it('should render email, password, and confirm password fields', () => {
    renderRegister();

    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm password/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    renderRegister();
    const user = userEvent.setup();
    const { password, confirmPassword } = getPasswordInputs();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(password, 'password123');
    await user.type(confirmPassword, 'different');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should call createUserWithEmailAndPassword with correct email and password', async () => {
    renderRegister();
    const user = userEvent.setup();
    const { password, confirmPassword } = getPasswordInputs();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'new@example.com');
    await user.type(password, 'password123');
    await user.type(confirmPassword, 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('new@example.com', 'password123');
    });
  });

  it('should show error on failed registration with auth/email-already-in-use', async () => {
    mockRegister.mockRejectedValueOnce({
      message: 'Firebase: Error (auth/email-already-in-use).',
      code: 'auth/email-already-in-use',
    });
    renderRegister();
    const user = userEvent.setup();
    const { password, confirmPassword } = getPasswordInputs();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'taken@example.com');
    await user.type(password, 'password123');
    await user.type(confirmPassword, 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email-already-in-use/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while registration is in progress', async () => {
    let resolveRegister;
    mockRegister.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        })
    );
    renderRegister();
    const user = userEvent.setup();
    const { password, confirmPassword } = getPasswordInputs();

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'new@example.com');
    await user.type(password, 'password123');
    await user.type(confirmPassword, 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing up/i })).toBeDisabled();
    });

    resolveRegister({});
  });

  it('should have required attributes on all input fields', () => {
    renderRegister();

    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeRequired();
    const { password, confirmPassword } = getPasswordInputs();
    expect(password).toBeRequired();
    expect(confirmPassword).toBeRequired();
  });
});
