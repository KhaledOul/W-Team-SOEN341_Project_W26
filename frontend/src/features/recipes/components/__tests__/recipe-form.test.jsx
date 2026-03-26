import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeForm from '../recipe-form';
import { mockRecipe } from '../../../../test/mockData';

/* ── mocks ─────────────────────────────────────────────────────────────────── */

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockGetById = vi.fn();

vi.mock('../../context/recipe-context', () => ({
  useRecipe: () => ({
    createRecipe: mockCreate,
    updateRecipe: mockUpdate,
    getRecipeById: mockGetById,
  }),
}));

/* ── helpers ───────────────────────────────────────────────────────────────── */

function renderForm(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  return {
    ...render(<RecipeForm recipeId={props.recipeId ?? null} onClose={onClose} />),
    onClose,
  };
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('RecipeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
    mockGetById.mockReturnValue(null);
  });

  it('should render all form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/steps/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cost/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
  });

  it('should render dietary preference checkboxes', () => {
    renderForm();

    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Keto')).toBeInTheDocument();
  });

  it('should render allergy checkboxes', () => {
    renderForm();

    expect(screen.getByText('Peanuts')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Gluten')).toBeInTheDocument();
  });

  it('should pre-populate all fields when editing an existing recipe', () => {
    mockGetById.mockReturnValue(mockRecipe);
    renderForm({ recipeId: 'recipe-1' });

    expect(screen.getByLabelText(/title/i)).toHaveValue('Spaghetti Bolognese');
    expect(screen.getByLabelText(/author/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/difficulty/i)).toHaveValue('Medium');
  });

  it('should show "Edit Recipe" heading when recipe id is provided', () => {
    mockGetById.mockReturnValue(mockRecipe);
    renderForm({ recipeId: 'recipe-1' });

    expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
  });

  it('should show "Create New Recipe" heading when no recipe id', () => {
    renderForm();

    expect(screen.getByText('Create New Recipe')).toBeInTheDocument();
  });

  it('should validate that title is required on submit', async () => {
    renderForm();
    const user = userEvent.setup();

    // Fill everything except title
    await user.type(screen.getByLabelText(/author/i), 'Author');
    await user.type(screen.getByLabelText(/ingredients/i), 'Some ingredient');
    await user.type(screen.getByLabelText(/steps/i), 'Step 1');
    await user.clear(screen.getByLabelText(/time/i));
    await user.type(screen.getByLabelText(/time/i), '10');
    await user.clear(screen.getByLabelText(/cost/i));
    await user.type(screen.getByLabelText(/cost/i), '5');

    await user.click(screen.getByRole('button', { name: /create recipe/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should validate that ingredients are required on submit', async () => {
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/title/i), 'Test Recipe');
    await user.type(screen.getByLabelText(/author/i), 'Author');
    await user.type(screen.getByLabelText(/steps/i), 'Step 1');
    await user.clear(screen.getByLabelText(/time/i));
    await user.type(screen.getByLabelText(/time/i), '10');
    await user.clear(screen.getByLabelText(/cost/i));
    await user.type(screen.getByLabelText(/cost/i), '5');

    await user.click(screen.getByRole('button', { name: /create recipe/i }));

    await waitFor(() => {
      expect(screen.getByText(/ingredients are required/i)).toBeInTheDocument();
    });
  });

  it('should call createRecipe and close on valid create submit', async () => {
    const { onClose } = renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/title/i), 'New Recipe');
    await user.type(screen.getByLabelText(/author/i), 'Chef');
    await user.type(screen.getByLabelText(/ingredients/i), '200g pasta');
    await user.type(screen.getByLabelText(/steps/i), 'Cook pasta');
    await user.clear(screen.getByLabelText(/time/i));
    await user.type(screen.getByLabelText(/time/i), '15');
    await user.clear(screen.getByLabelText(/cost/i));
    await user.type(screen.getByLabelText(/cost/i), '5');

    await user.click(screen.getByRole('button', { name: /create recipe/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Recipe',
          author: 'Chef',
          ingredients: '200g pasta',
          steps: 'Cook pasta',
          time: 15,
          cost: 5,
          difficulty: 'Easy',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const { onClose } = renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
