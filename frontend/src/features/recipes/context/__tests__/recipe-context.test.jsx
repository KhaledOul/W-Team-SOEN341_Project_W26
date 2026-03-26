import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RecipeProvider, useRecipe } from '../recipe-context';
import * as recipeService from '../../services/recipe-service';

/* ── Mock services ────────────────────────────────────────────────────────── */

vi.mock('../../services/recipe-service', () => ({
  subscribeToRecipes: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
}));

const mockCurrentUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
};

vi.mock('../../../auth/context/auth-context', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser }),
}));

/* ── Consumer helper ──────────────────────────────────────────────────────── */

function RecipeConsumer() {
  const ctx = useRecipe();
  return (
    <div>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="recipe-count">{ctx.recipes.length}</span>
      <span data-testid="error">{ctx.error ?? 'none'}</span>
      <button onClick={() => ctx.createRecipe({ title: 'New' })}>Create</button>
      <button onClick={() => ctx.updateRecipe('r1', { title: 'Updated' })}>Update</button>
      <button onClick={() => ctx.deleteRecipe('r1')}>Delete</button>
    </div>
  );
}

function renderWithRecipeProvider() {
  return render(
    <RecipeProvider>
      <RecipeConsumer />
    </RecipeProvider>
  );
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('RecipeContext / useRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recipeService.subscribeToRecipes.mockImplementation((onData) => {
      onData([
        { id: 'r1', title: 'Recipe 1' },
        { id: 'r2', title: 'Recipe 2' },
      ]);
      return vi.fn(); // unsubscribe
    });
    recipeService.createRecipe.mockResolvedValue({ id: 'new-id' });
    recipeService.updateRecipe.mockResolvedValue(undefined);
    recipeService.deleteRecipe.mockResolvedValue(undefined);
  });

  it('should return loading=true initially before subscription fires', () => {
    // Make subscription never fire
    recipeService.subscribeToRecipes.mockImplementation(() => vi.fn());
    renderWithRecipeProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('should return populated recipes after subscribeToRecipes fires', async () => {
    renderWithRecipeProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('recipe-count')).toHaveTextContent('2');
    });
  });

  it('should call createRecipe service with userId and data', async () => {
    renderWithRecipeProvider();
    const user = (await import('@testing-library/user-event')).default.setup();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(recipeService.createRecipe).toHaveBeenCalledWith('test-uid', 'Test User', {
        title: 'New',
      });
    });
  });

  it('should call updateRecipe service with id and updated data', async () => {
    renderWithRecipeProvider();
    const user = (await import('@testing-library/user-event')).default.setup();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(recipeService.updateRecipe).toHaveBeenCalledWith('r1', { title: 'Updated' });
    });
  });

  it('should call deleteRecipe service with the correct id', async () => {
    renderWithRecipeProvider();
    const user = (await import('@testing-library/user-event')).default.setup();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(recipeService.deleteRecipe).toHaveBeenCalledWith('r1');
    });
  });

  it('should show error state when subscription fails', async () => {
    recipeService.subscribeToRecipes.mockImplementation((onData, onError) => {
      onError(new Error('Firestore read failed'));
      return vi.fn();
    });

    renderWithRecipeProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(/failed to load recipes/i);
    });
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    recipeService.subscribeToRecipes.mockImplementation((onData) => {
      onData([]);
      return unsubscribe;
    });

    const { unmount } = renderWithRecipeProvider();
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
