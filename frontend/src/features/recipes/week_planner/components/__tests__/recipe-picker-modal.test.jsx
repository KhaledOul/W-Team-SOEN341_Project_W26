import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipePickerModal from '../recipe-picker-modal';
import * as recipeService from '../../../services/recipe-service';

/* -- mocks ----------------------------------------------------------------- */

vi.mock('../../../services/recipe-service', () => ({
  subscribeToRecipes: vi.fn(),
}));

const mockRecipes = [
  { id: 'r1', title: 'Pasta Primavera', time: 30 },
  { id: 'r2', title: 'Chicken Stir Fry', time: 25 },
  { id: 'r3', title: 'Vegan Tacos', time: 20 },
];

/* -- helpers --------------------------------------------------------------- */

function renderModal(props = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectRecipe: vi.fn(),
    currentUserId: 'test-uid',
  };
  return {
    // Return the handlers so assertions can use either the defaults or per-test overrides.
    ...render(<RecipePickerModal {...defaultProps} {...props} />),
    onClose: props.onClose ?? defaultProps.onClose,
    onSelectRecipe: props.onSelectRecipe ?? defaultProps.onSelectRecipe,
  };
}

/* -- tests ----------------------------------------------------------------- */

describe('RecipePickerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default most tests to an immediate successful subscription with fixture data.
    recipeService.subscribeToRecipes.mockImplementation((onData) => {
      onData(mockRecipes);
      return vi.fn(); // unsubscribe
    });
  });

  describe('Visibility', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <RecipePickerModal
          isOpen={false}
          onClose={vi.fn()}
          onSelectRecipe={vi.fn()}
          currentUserId="uid"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal content when isOpen is true', () => {
      renderModal();

      expect(screen.getByText('Select a Recipe')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading text while fetching recipes', () => {
      recipeService.subscribeToRecipes.mockImplementation(() => vi.fn());
      renderModal();

      expect(screen.getByText(/loading recipes/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when subscription fails', async () => {
      recipeService.subscribeToRecipes.mockImplementation((onData, onError) => {
        onError(new Error('Network error'));
        return vi.fn();
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Recipe list', () => {
    it('should render all recipes from subscription', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByText('Pasta Primavera')).toBeInTheDocument();
        expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
        expect(screen.getByText('Vegan Tacos')).toBeInTheDocument();
      });
    });

    it('should display recipe time when available', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByText('30 min')).toBeInTheDocument();
      });
    });

    it('should show empty message when no recipes exist', async () => {
      recipeService.subscribeToRecipes.mockImplementation((onData) => {
        onData([]);
        return vi.fn();
      });

      renderModal();

      await waitFor(() => {
        expect(screen.getByText(/no recipes available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search functionality', () => {
    it('should render search input', () => {
      renderModal();

      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument();
    });

    it('should filter recipes based on search term', async () => {
      renderModal();
      const user = userEvent.setup();

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'chicken');

      await waitFor(() => {
        expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
        expect(screen.queryByText('Pasta Primavera')).not.toBeInTheDocument();
        expect(screen.queryByText('Vegan Tacos')).not.toBeInTheDocument();
      });
    });

    it('should show empty message when search has no matches', async () => {
      renderModal();
      const user = userEvent.setup();

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no recipes found matching/i)).toBeInTheDocument();
      });
    });
  });

  describe('Selection behavior', () => {
    it('should call onSelectRecipe and onClose when a recipe is clicked', async () => {
      const onSelectRecipe = vi.fn();
      const onClose = vi.fn();
      renderModal({ onSelectRecipe, onClose });
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Pasta Primavera')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pasta Primavera'));

      expect(onSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Close behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      const user = userEvent.setup();

      await user.click(screen.getByRole('button'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay is clicked', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      const user = userEvent.setup();

      const overlay = document.querySelector('.recipe-picker-modal-overlay');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe when modal closes', () => {
      const unsubscribe = vi.fn();
      recipeService.subscribeToRecipes.mockImplementation((onData) => {
        onData(mockRecipes);
        return unsubscribe;
      });

      const { unmount } = renderModal();
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
