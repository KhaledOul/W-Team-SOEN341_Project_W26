import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecipesPage from '../recipes-page';
import { mockRecipes, mockRecipe } from '../../../../test/mockData';

/* ── mocks ─────────────────────────────────────────────────────────────────── */

const mockDeleteRecipe = vi.fn();
const mockGetRecipeById = vi.fn();

vi.mock('../../context/recipe-context', () => ({
  useRecipe: () => ({
    recipes: mockRecipesState,
    loading: mockLoadingState,
    error: mockErrorState,
    deleteRecipe: mockDeleteRecipe,
    getRecipeById: mockGetRecipeById,
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
  }),
}));

vi.mock('../../../auth/context/auth-context', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-uid', email: 'test@example.com', displayName: 'Test User' },
    userLoggedIn: true,
  }),
}));

let mockRecipesState = mockRecipes;
let mockLoadingState = false;
let mockErrorState = null;

/* ── helpers ───────────────────────────────────────────────────────────────── */

function renderRecipesPage() {
  return render(
    <MemoryRouter>
      <RecipesPage />
    </MemoryRouter>
  );
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('RecipesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecipesState = mockRecipes;
    mockLoadingState = false;
    mockErrorState = null;
  });

  /* ── Recipe List behavior ─────────────────────────────────────────────── */

  describe('Recipe List', () => {
    it('should render a list of recipe cards when recipes are non-empty', () => {
      renderRecipesPage();

      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
      expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
      expect(screen.getByText('Vegan Curry')).toBeInTheDocument();
    });

    it('should render an empty state message when recipes array is empty', () => {
      mockRecipesState = [];
      renderRecipesPage();

      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument();
    });

    it('should render a loading spinner when loading is true', () => {
      mockLoadingState = true;
      renderRecipesPage();

      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('should render the correct number of recipe cards', () => {
      renderRecipesPage();

      const editButtons = screen.getAllByRole('button', { name: /edit recipe/i });
      expect(editButtons).toHaveLength(3);
    });

    it('should show recipe count text', () => {
      renderRecipesPage();

      expect(screen.getByText('3 recipes saved')).toBeInTheDocument();
    });
  });

  /* ── Search behavior ──────────────────────────────────────────────────── */

  describe('Recipe Search', () => {
    it('should render a search input field', () => {
      renderRecipesPage();

      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument();
    });

    it('should filter recipes as the user types in the search box', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'chicken');

      await waitFor(() => {
        expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
        expect(screen.queryByText('Spaghetti Bolognese')).not.toBeInTheDocument();
        expect(screen.queryByText('Vegan Curry')).not.toBeInTheDocument();
      });
    });

    it('should show "no recipes match" when search returns no results', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'nonexistentrecipe');

      await waitFor(() => {
        expect(screen.getByText(/no recipes match your filters/i)).toBeInTheDocument();
      });
    });
  });

  /* ── Filter behavior ──────────────────────────────────────────────────── */

  describe('Recipe Filters', () => {
    it('should render filter button', () => {
      renderRecipesPage();

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('should show filter panel when filter button is clicked', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));

      await waitFor(() => {
        expect(screen.getByText('Dietary Preferences')).toBeInTheDocument();
        expect(screen.getByText('Allergies')).toBeInTheDocument();
        expect(screen.getByText('Sort by cost')).toBeInTheDocument();
      });
    });

    it('should filter by dietary preference when a diet checkbox is toggled', async () => {
      mockRecipesState = [
        { ...mockRecipe, id: 'r1', title: 'Vegan Bowl', diet: ['Vegan'] },
        { ...mockRecipe, id: 'r2', title: 'Halal Dish', diet: ['Halal'] },
      ];
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));

      // Find the Vegan checkbox in the filter panel
      const veganCheckboxes = screen.getAllByLabelText(/vegan/i);
      // Use the one in the filter panel (not in a recipe card tag)
      await user.click(veganCheckboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('Vegan Bowl')).toBeInTheDocument();
        expect(screen.queryByText('Halal Dish')).not.toBeInTheDocument();
      });
    });

    it('should clear all filters when clear button is clicked', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));
      await user.click(screen.getByRole('button', { name: /clear/i }));

      // All recipes should remain visible
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
      expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
      expect(screen.getByText('Vegan Curry')).toBeInTheDocument();
    });
  });

  /* ── Delete flow ──────────────────────────────────────────────────────── */

  describe('Delete recipe', () => {
    it('should show confirmation modal when delete is clicked and call deleteRecipe on confirm', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      const deleteButtons = screen.getAllByRole('button', { name: /delete recipe/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      await waitFor(() => {
        expect(mockDeleteRecipe).toHaveBeenCalledWith('recipe-1');
      });
    });

    it('should close confirmation modal and not delete when cancel is clicked', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      const deleteButtons = screen.getAllByRole('button', { name: /delete recipe/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^cancel$/i }));

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
      });
      expect(mockDeleteRecipe).not.toHaveBeenCalled();
    });
  });

  /* -- Error display -------------------------------------------------------- */

  describe('Error display', () => {
    it('should display error message when error state is set', () => {
      mockErrorState = 'Failed to load recipes. Please try again.';
      renderRecipesPage();

      expect(screen.getByText(/failed to load recipes/i)).toBeInTheDocument();
    });
  });

  /* -- Create recipe flow --------------------------------------------------- */

  describe('Create recipe', () => {
    it('should show recipe form when "New Recipe" button is clicked', async () => {
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /new recipe/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Recipe')).toBeInTheDocument();
      });
    });
  });

  /* -- Edit recipe flow ----------------------------------------------------- */

  describe('Edit recipe', () => {
    it('should show recipe form with edit mode when edit button is clicked', async () => {
      mockGetRecipeById.mockReturnValue(mockRecipe);
      renderRecipesPage();
      const user = userEvent.setup();

      const editButtons = screen.getAllByRole('button', { name: /edit recipe/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
      });
    });
  });

  /* -- Allergy filter ------------------------------------------------------- */

  describe('Allergy filter', () => {
    it('should filter by allergy when an allergy checkbox is toggled', async () => {
      mockRecipesState = [
        { ...mockRecipe, id: 'r1', title: 'Nut-Free Dish', allergies: ['Peanuts'] },
        { ...mockRecipe, id: 'r2', title: 'Dairy-Free Dish', allergies: ['Dairy'] },
      ];
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));

      const peanutCheckboxes = screen.getAllByLabelText(/peanuts/i);
      await user.click(peanutCheckboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('Nut-Free Dish')).toBeInTheDocument();
        expect(screen.queryByText('Dairy-Free Dish')).not.toBeInTheDocument();
      });
    });
  });

  /* -- Sort by cost --------------------------------------------------------- */

  describe('Sort by cost', () => {
    it('should sort recipes by cost ascending when selected', async () => {
      mockRecipesState = [
        { ...mockRecipe, id: 'r1', title: 'Expensive Recipe', cost: 50 },
        { ...mockRecipe, id: 'r2', title: 'Cheap Recipe', cost: 5 },
        { ...mockRecipe, id: 'r3', title: 'Medium Recipe', cost: 20 },
      ];
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'asc');

      const cards = screen.getAllByRole('heading', { level: 3 });
      expect(cards[0]).toHaveTextContent('Cheap Recipe');
      expect(cards[1]).toHaveTextContent('Medium Recipe');
      expect(cards[2]).toHaveTextContent('Expensive Recipe');
    });
  });

  /* -- Time range filter ---------------------------------------------------- */

  describe('Time range filter', () => {
    it('should filter by minimum time', async () => {
      mockRecipesState = [
        { ...mockRecipe, id: 'r1', title: 'Quick Recipe', time: 10 },
        { ...mockRecipe, id: 'r2', title: 'Long Recipe', time: 60 },
      ];
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));

      const minInput = screen.getByPlaceholderText('Min');
      await user.type(minInput, '30');

      await waitFor(() => {
        expect(screen.getByText('Long Recipe')).toBeInTheDocument();
        expect(screen.queryByText('Quick Recipe')).not.toBeInTheDocument();
      });
    });

    it('should filter by maximum time', async () => {
      mockRecipesState = [
        { ...mockRecipe, id: 'r1', title: 'Quick Recipe', time: 10 },
        { ...mockRecipe, id: 'r2', title: 'Long Recipe', time: 60 },
      ];
      renderRecipesPage();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /filter/i }));

      const maxInput = screen.getByPlaceholderText('Max');
      await user.type(maxInput, '30');

      await waitFor(() => {
        expect(screen.getByText('Quick Recipe')).toBeInTheDocument();
        expect(screen.queryByText('Long Recipe')).not.toBeInTheDocument();
      });
    });
  });
});
