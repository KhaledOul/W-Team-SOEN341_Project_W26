import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PreferencesPage from '../preferences-page';

/* ── mocks ─────────────────────────────────────────────────────────────────── */

const mockLoadPrefs = vi.fn();
const mockSavePrefs = vi.fn();

vi.mock('../../services/preferences-service', () => ({
  loadPreferences: (...args) => mockLoadPrefs(...args),
  savePreferences: (...args) => mockSavePrefs(...args),
}));

const mockCurrentUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
};

vi.mock('../../../auth/context/auth-context', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser }),
}));

/* ── helpers ───────────────────────────────────────────────────────────────── */

function renderPreferences() {
  return render(
    <MemoryRouter>
      <PreferencesPage />
    </MemoryRouter>
  );
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('PreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadPrefs.mockResolvedValue(null);
    mockSavePrefs.mockResolvedValue();
  });

  it('should render diet preference options', async () => {
    renderPreferences();

    await waitFor(() => {
      expect(screen.getByText('Vegan')).toBeInTheDocument();
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('Keto')).toBeInTheDocument();
      expect(screen.getByText('Halal')).toBeInTheDocument();
    });
  });

  it('should render allergy checkboxes', async () => {
    renderPreferences();

    await waitFor(() => {
      expect(screen.getByText('Peanuts')).toBeInTheDocument();
      expect(screen.getByText('Dairy')).toBeInTheDocument();
      expect(screen.getByText('Gluten')).toBeInTheDocument();
      expect(screen.getByText('Shellfish')).toBeInTheDocument();
    });
  });

  it('should pre-populate fields with existing user profile data', async () => {
    mockLoadPrefs.mockResolvedValue({
      diet: ['Vegetarian'],
      allergies: ['Nuts', 'Dairy'],
    });

    renderPreferences();

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /^nuts$/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /^dairy$/i })).toBeChecked();
    });
  });

  it('should call savePreferences with updated profile on save', async () => {
    mockLoadPrefs.mockResolvedValue(null);
    renderPreferences();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Vegan')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /vegan/i }));
    await user.click(screen.getByRole('checkbox', { name: /peanuts/i }));
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(mockSavePrefs).toHaveBeenCalledWith('test-uid', {
        diet: ['Vegan'],
        allergies: ['Peanuts'],
      });
    });
  });

  it('should show a success message after preferences are saved', async () => {
    mockLoadPrefs.mockResolvedValue(null);
    renderPreferences();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /vegan/i }));
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while preferences load', () => {
    mockLoadPrefs.mockImplementation(() => new Promise(() => {}));
    renderPreferences();

    expect(screen.getByText(/loading preferences/i)).toBeInTheDocument();
  });
});
